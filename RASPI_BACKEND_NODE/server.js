// Append this code to the Raspberry Pi Backend Server

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/store-token', (req,res) => {
    const { token } = req.body;
    console.log('Received FCM Token: ', token);
    res.status(200).json({message: 'Token Stored Succesfully'});
});

app.listen(8000, '0.0.0.0', () => {
    console.log('Server Running on Localhost');
});``

app.get('/api/store-token', (req, res) => {
    res.send('Use POST request to store token.');
});
