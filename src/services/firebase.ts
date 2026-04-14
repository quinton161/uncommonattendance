// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const isTest = process.env.NODE_ENV === 'test';

/** Prefer env vars so keys and project IDs are not committed. Jest uses placeholders when unset. */
function requiredEnv(name: string, testFallback: string): string {
  const v = process.env[name];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  if (isTest) return testFallback;
  throw new Error(
    `Missing ${name}. Copy .env.example to .env and set your Firebase web app config (Console → Project settings).`
  );
}

const firebaseConfig = {
  apiKey: requiredEnv('REACT_APP_FIREBASE_API_KEY', 'AIzaSyTest000000000000000000000000000000'),
  authDomain: requiredEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com'),
  projectId: requiredEnv('REACT_APP_FIREBASE_PROJECT_ID', 'test-project'),
  storageBucket: requiredEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com'),
  messagingSenderId: requiredEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', '000000000000'),
  appId: requiredEnv('REACT_APP_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000'),
  ...(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim()
    ? { measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID.trim() }
    : {}),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
/** Same region as Cloud Functions deployment (see `firebase deploy --only functions`). */
export const functions = getFunctions(app, 'us-central1');

export default app;
