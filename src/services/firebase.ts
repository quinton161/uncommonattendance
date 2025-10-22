// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDlyRXx3aUhmsFx0iON1xDE1qGWorsdztc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "uncommonattendance.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "uncommonattendance",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "uncommonattendance.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "28326821265",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:28326821265:web:5b44ada2b7cba9a83bae30",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-6XGF42V4MH"
};

// Log configuration for debugging (without sensitive data)
console.log('🔥 Firebase Configuration:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPresent: !!firebaseConfig.apiKey,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
