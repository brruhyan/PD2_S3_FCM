// Import the required functions from Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBqVBLtnPReMJwvtYpVJ1hiRVpzJsvC1c",
  authDomain: "mushroom-monitoring-app.firebaseapp.com",
  projectId: "mushroom-monitoring-app",
  storageBucket: "mushroom-monitoring-app.firebasestorage.app",
  messagingSenderId: "1046987086600",
  appId: "1:1046987086600:web:d4c6e8e7a3e72ab0116abd",
  measurementId: "G-61SQV8ZDTC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firebase Auth service
const auth = getAuth(app);

// Export the auth object and Firebase authentication methods
export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword };
