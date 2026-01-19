// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Using the specific API key for uncommonattendance project
const firebaseConfig = {
  apiKey: "AIzaSyDlyRXx3aUhmsFx0iON1xDE1qGWorsdztc",
  authDomain: "uncommonattendance.firebaseapp.com",
  projectId: "uncommonattendance",
  storageBucket: "uncommonattendance.firebasestorage.app",
  messagingSenderId: "28326821265",
  appId: "1:28326821265:web:5b44ada2b7cba9a83bae30",
  measurementId: "G-6XGF42V4MH"
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
