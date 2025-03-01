const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const axios = require("axios");

const s3Client = new S3Client({
    region: 'ap-southeast-2',
    credentials: {
        accessKeyId: '', // Add later
        secretAccessKey: '' // Add later
    }
});
const app = express();
const port = 3000;

const mqttBrokerAddress = 'mqtt://192.168.0.107'; // Find a way to dynamically change this
const mqttPublishChannel = 'your/command/channel';
const mqttSubscribeChannel = 'your/result/channel';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/takePhoto', (req, res) => {
    const fileWriteStream = fs.createWriteStream('image.jpg');

    // Create an MQTT client
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
                const data = await s3Client.send(new GetObjectCommand({
                    Bucket: 'raspi-bucket-mushroom',
                    Key: key,
                }));
                let responseDataChunks = [];
                data.Body.on('data', chunk => {
                    fileWriteStream.write(chunk);
                    responseDataChunks.push(chunk);
                });

                await data.Body.once('end', async () => {
                    fileWriteStream.end();

                    const imageDataBase64 = Buffer.concat(responseDataChunks).toString('base64');

                    // Call Roboflow API
                    try {
                        const apiKey = "5yNSbYmPfQArT0CrClDY"; // add later
                        const roboflowResponse = await axios({
                            method: "POST",
                            url: "https://detect.roboflow.com/pd-recent-dataset/2",
                            params: {
                                api_key: apiKey,
                            },
                            data: imageDataBase64,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            maxBodyLength: Infinity
                        });

                        console.log("Inference response from Roboflow:", roboflowResponse.data);

                        roboflowResponse.data.predictions.forEach((prediction) => {
                            console.log(`Prediction ID: ${prediction.detection_id}`);
                            console.log('Points:', prediction.points);
                        });

                        client.end();
                        return res.status(200).json({
                            image: imageDataBase64,
                            inferenceResults: roboflowResponse.data,
                        });
                    } catch (error) {
                        console.error("Error in Roboflow API call:", error.message);
                        client.end();
                        return res.status(500).send('Error in Roboflow API call');
                    }
                });
            } catch (error) {
                console.error('Error retrieving object from S3:', error);
                return res.status(500).send('Error retrieving object from S3');
            }
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});