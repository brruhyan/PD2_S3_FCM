const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const axios = require("axios");
const sharp = require('sharp');

const admin = require("./firebase-admin.js");

const options = {
  host: 'x',
  port: 8883,
  protocol: 'mqtts',
  username: 'x', // subscribe and publish
  password: 'x'
}

const s3Client = new S3Client({
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: 'x',
        secretAccessKey: 'x'
    }
});

const s3ImagesClient = new S3Client({
    region: 'ap-southeast-2',
    credentials: {
        accessKeyId: 'x',
        secretAccessKey: 'x'
    }
});
const app = express();
const port = 3000;

const mqttBrokerAddress = mqtt.connect(options); // ip of the mqtt broker where the raspi listens and app sends
const mqttPublishChannel = 'your/command/channel';
const mqttSubscribeChannel = 'your/result/channel';

mqttBrokerAddress.on('connect', function () {
    console.log('Connected');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

let processedMessages = new Set();

// Helper function to get style for class, matching ShowCameraFeed.js
const getClassStyles = (predictionClass) => {
    switch (predictionClass) {
        case 'READY':
            return { color: '#48D38A', opacity: 0.5 };
        case 'NOT_READY':
            return { color: '#FFD700', opacity: 0.5 };
        case 'Overdue':
            return { color: '#FF0000', opacity: 0.5 };
        default:
            return { color: '#000000', opacity: 0.5 };
    }
};

// Configuration for processing mode
const processingConfig = {
    mode: 'whole' // This can be modified to 'grid' for per-grid processing or 'whole' for whole-image processing
};
// Function to send notifications when "Ready" mushrooms are detected
async function sendReadyMushroomNotification(readyMushrooms, imageBuffer) {
    const readyCount = readyMushrooms.length;
    if (readyCount === 0) return;
    

// Function to Retrieve FCM Push Token when Ready is Detected
const retrieveTokenFromS3 = async () => {
    const params = {
        Bucket: "projectdesign-mushroom-bucket",
        Key: "tokens.json",
    };
    
    try {
        console.log("Fetching token from S3...");
        const response = await s3Client.send(new GetObjectCommand(params));
    
        if (!response.Body) {
        throw new Error("S3 Response Body is missing");
        }
    
        const tokenData = await response.Body.transformToString();
        console.log("Raw Token Data:", tokenData);
    
        const parsedData = JSON.parse(tokenData);
        if (!parsedData.token) {
        throw new Error("Missing 'token' field in JSON");
        }
    
        const token = Array.isArray(parsedData.token) ? parsedData.token[0] : parsedData.token;
        console.log("Extracted Token:", token);
        return token;
    } catch (error) {
        console.error("Error retrieving token from S3:", error.message);
        return null;
    }
    };

const sendNotification = async (token, title, body) => {
    if (!token) {
        console.error("Invalid FCM token provided for notification");
        return;
    }

    const message = {
        notification: { title, body },
        token: token,
    };

    try {
        console.log(`Sending notification to: ${token}`);
        const response = await admin.messaging().send(message);
        console.log("FCM Response:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

const sendReadyMushroomNotification = async () => {
    const token = await retrieveTokenFromS3();
    if (!token) {
        console.error("Failed to retrieve FCM token. Notification not sent.");
        return;
    }

    const title = "Harvest Notifications";
    const body = `${readyMushrooms.length} Mushrooms are Ready for Harvest! `;

    sendNotification(token, title, body);
};

// Call the function when needed
sendReadyMushroomNotification();

}
app.get('/takePhoto', async (req, res) => {
    const client = mqttBrokerAddress;
    const message = 'Yes';
    let hasResponded = false; // Flag to track if we've already responded

    // Create a message handler function that we can later remove
    const messageHandler = async (topic, receivedMessage) => {
        if (topic === mqttSubscribeChannel && !hasResponded) {
            // Set flag to prevent multiple responses
            hasResponded = true;
            
            // Unsubscribe to stop receiving more messages for this request
            client.unsubscribe(mqttSubscribeChannel);
            client.removeListener('message', messageHandler);
            
            const key = receivedMessage.toString();
            console.log(`Received message on ${mqttSubscribeChannel}: ${key}`);

            if (processedMessages.has(key)) {
                console.log('Duplicate detected');
                return res.status(200).json({ status: 'Duplicate message detected' });
            }
            processedMessages.add(key);

            try {
                const data = await s3ImagesClient.send(new GetObjectCommand({
                    Bucket: 'raspi-bucket-mushroom',
                    Key: key,
                }));

                // Create a promise to handle the stream
                const streamPromise = new Promise((resolve, reject) => {
                    const chunks = [];
                    data.Body.on('data', chunk => chunks.push(chunk));
                    data.Body.on('end', () => resolve(Buffer.concat(chunks)));
                    data.Body.on('error', reject);
                });

                // Wait for the entire image data to be loaded
                const imageBuffer = await streamPromise;
                
                // Write to file system
                await fs.promises.writeFile('image.jpg', imageBuffer);

                // Create a new Sharp instance with the complete buffer
                const image = sharp(imageBuffer);
                const metadata = await image.metadata();
                console.log('Image Metadata:', metadata);

                const allPredictions = [];
                const inferenceResults = [];

                if (processingConfig.mode === 'grid') {
                    // Grid-based processing code...
                    // [Your existing grid processing code goes here]
                } else if (processingConfig.mode === 'whole') {
                    // Whole image processing
                    try {
                        const imageDataBase64 = imageBuffer.toString('base64');

                        const apiKey = "LpkUpv6XAkCrQs0L9R8O";
                        const roboflowResponse = await axios({
                            method: "POST",
                            url: "https://detect.roboflow.com/mushroom-w7ucu/7",
                            params: {
                                api_key: apiKey,
                            },
                            data: imageDataBase64,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            maxBodyLength: Infinity
                        });

                        // Process predictions
                        const predictions = roboflowResponse.data.predictions.map((prediction, index) => ({
                            ...prediction,
                            detection_id: `detection-${index}`,
                            timestamp: new Date().toISOString()
                        }));

                        allPredictions.push(...predictions);
                        inferenceResults.push({
                            inference: {
                                ...roboflowResponse.data,
                                predictions: predictions
                            }
                        });
                    } catch (error) {
                        console.error('Error processing whole image:', error.message);
                        inferenceResults.push({
                            error: error.message
                        });
                    }
                }

                // Create SVG overlay
                let svgElements = '';
                
                // [Your existing SVG generation code]
                
                // Create complete SVG overlay
                const svgOverlay = Buffer.from(`<svg width="${metadata.width}" height="${metadata.height}">
                    ${svgElements}
                </svg>`);

                // Apply overlay to original image
                const processedImage = await sharp(imageBuffer)
                    .composite([{ input: svgOverlay, blend: 'over' }])
                    .toBuffer();

                // Check for "Ready" mushrooms and send notification if found
                const readyMushrooms = allPredictions.filter(p => p.class === 'READY');
                
                let notificationInfo = null;
                
                if (readyMushrooms.length > 0) {
                    console.log(`Found ${readyMushrooms.length} Ready mushrooms! Sending notification...`);
                    await sendReadyMushroomNotification(readyMushrooms, imageBuffer);
                    notificationInfo = {
                        sent: true,
                        count: readyMushrooms.length,
                        timestamp: new Date().toISOString()
                    };
                }
                
                // Send response once
                return res.status(200).json({
                    image: processedImage.toString('base64'),
                    inferenceResults: {
                        tileResults: inferenceResults,
                        predictions: allPredictions
                    },
                    notification: notificationInfo
                });
                
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).send('Server error');
            }
        }
    };

    // Add the message handler
    client.on('message', messageHandler);

    // Subscribe to the channel
    client.subscribe(mqttSubscribeChannel, async (err) => {
        if (err) {
            console.error('Error subscribing to channel:', err);
            return res.status(500).send('Error subscribing to channel');
        } else {
            await client.publish(mqttPublishChannel, message, () => {
                console.log(`Message published to ${mqttPublishChannel}: ${message}`);
            });
        }
    });

    // Add a timeout to make sure we don't leave the request hanging
    setTimeout(() => {
        if (!hasResponded) {
            hasResponded = true;
            client.unsubscribe(mqttSubscribeChannel);
            client.removeListener('message', messageHandler);
            res.status(504).send('Request timeout - no MQTT response received');
        }
    }, 30000); // 30 second timeout
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
});
