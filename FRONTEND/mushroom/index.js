const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const axios = require("axios");
const sharp = require('sharp');
const nodemailer = require('nodemailer'); // For email notifications - not working
const admin = require("./firebase-admin.js");

const s3Client = new S3Client({
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});

const s3ImagesClient = new S3Client({
    region: 'ap-southeast-2',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});
const app = express();
const port = 3000;

const mqttBrokerAddress = 'mqtt://192.168.100.161'; // raspi ip add
const mqttPublishChannel = 'your/command/channel';
const mqttSubscribeChannel = 'your/result/channel';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
    const client = mqtt.connect(mqttBrokerAddress);
    const message = 'Yes';

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

    client.on('message', async (topic, receivedMessage) => {
        if (topic === mqttSubscribeChannel) {
            client.unsubscribe(mqttSubscribeChannel);
            const key = receivedMessage.toString();
            console.log(`Received message on ${mqttSubscribeChannel}: ${key}`);

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
                    // Grid-based processing
                    const tileWidth = Math.floor(metadata.width / 3);
                    const tileHeight = Math.floor(metadata.height / 3);

                    console.log('Tile dimensions:', {
                        tileWidth,
                        tileHeight,
                        totalWidth: metadata.width,
                        totalHeight: metadata.height
                    });

                    // Process tiles
                    for (let row = 0; row < 3; row++) {
                        for (let col = 0; col < 3; col++) {
                            const left = col * tileWidth;
                            const top = row * tileHeight;
                            
                            const right = Math.min((col + 1) * tileWidth, metadata.width);
                            const bottom = Math.min((row + 1) * tileHeight, metadata.height);
                            
                            const width = right - left;
                            const height = bottom - top;

                            if (left < 0 || top < 0 || width <= 0 || height <= 0 ||
                                left + width > metadata.width || top + height > metadata.height) {
                                console.error(`Invalid extraction parameters for tile (${row}, ${col}):`, 
                                    { left, top, width, height, imageWidth: metadata.width, imageHeight: metadata.height });
                                continue;
                            }

                            console.log(`Processing tile (${row}, ${col}):`, { left, top, width, height });

                            try {
                                const tileBuffer = await sharp(imageBuffer)
                                    .extract({ left, top, width, height })
                                    .toBuffer();

                                const imageDataBase64 = tileBuffer.toString('base64');

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

                                // Process predictions with adjusted coordinates
                                const tilePredictions = roboflowResponse.data.predictions.map((prediction, index) => {
                                    console.log(`Prediction for tile (${row}, ${col}):`, prediction);

                                    const adjustedPoints = prediction.points.map(p => ({
                                        x: p.x + left,
                                        y: p.y + top
                                    }));

                                    return {
                                        ...prediction,
                                        points: adjustedPoints,
                                        detection_id: `detection-${allPredictions.length + index}`,
                                        timestamp: new Date().toISOString(),
                                        tile: { row, col }
                                    };
                                });

                                // Add to all predictions
                                allPredictions.push(...tilePredictions);

                                // Add to inference results
                                inferenceResults.push({
                                    tile: { row, col },
                                    inference: {
                                        ...roboflowResponse.data,
                                        predictions: tilePredictions // Use the adjusted predictions
                                    }
                                });
                            } catch (error) {
                                console.error(`Error processing tile (${row}, ${col}):`, error.message);
                                inferenceResults.push({
                                    tile: { row, col },
                                    error: error.message,
                                });
                            }
                        }
                    }
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

                // Create an SVG overlay for all predictions
                let svgElements = '';
                
                // Add grid lines if grid mode is active
                if (processingConfig.mode === 'grid') {
                    const tileWidth = Math.floor(metadata.width / 3);
                    const tileHeight = Math.floor(metadata.height / 3);
                    
                    svgElements += `<line x1="${tileWidth}" y1="0" x2="${tileWidth}" y2="${metadata.height}" stroke="red" stroke-width="2" />`;
                    svgElements += `<line x1="${tileWidth * 2}" y1="0" x2="${tileWidth * 2}" y2="${metadata.height}" stroke="red" stroke-width="2" />`;
                    svgElements += `<line x1="0" y1="${tileHeight}" x2="${metadata.width}" y2="${tileHeight}" stroke="red" stroke-width="2" />`;
                    svgElements += `<line x1="0" y1="${tileHeight * 2}" x2="${metadata.width}" y2="${tileHeight * 2}" stroke="red" stroke-width="2" />`;
                }
                
                // Add prediction polygons and labels
                allPredictions.forEach(prediction => {
                    const style = getClassStyles(prediction.class);
                    
                    // Create polygon for the bounding box
                    const polygonPoints = prediction.points.map(p => `${p.x},${p.y}`).join(' ');
                    svgElements += `<polygon points="${polygonPoints}" 
                                          fill="${style.color}" 
                                          fill-opacity="${style.opacity}" 
                                          stroke="${style.color}" 
                                          stroke-width="2" />`;
                    
                    // Add text label
                    const firstPoint = prediction.points[0];
                    svgElements += `<rect x="${firstPoint.x}" 
                                        y="${firstPoint.y - 20}" 
                                        width="${prediction.class.length * 7 + 10}" 
                                        height="20" 
                                        fill="${style.color}" 
                                        rx="5" 
                                        ry="5" />`;
                                          
                    svgElements += `<text x="${firstPoint.x + 5}" 
                                        y="${firstPoint.y - 5}" 
                                        font-family="Arial" 
                                        font-size="12" 
                                        fill="white">${prediction.class}</text>`;
                });

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
                    const notificationImagePath = await sendReadyMushroomNotification(readyMushrooms, imageBuffer);
                    notificationInfo = {
                        sent: true,
                        count: readyMushrooms.length,
                        timestamp: new Date().toISOString(),
                        imagePath: notificationImagePath
                    };
                } 


                client.end();
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
                client.end();
                return res.status(500).send('Server error');
            }
        }
    });
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});