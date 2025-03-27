const admin = require('firebase-admin');
const serviceAccount = require('./pd2push-firebase-adminsdk-fbsvc-19b5fed1d4.json'); // Replace with your actual service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
