// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

/**
 * Default Uncommon Attendance Firebase web app (Console → Project settings).
 * Override any value with REACT_APP_* in .env for staging or other projects.
 */
const DEFAULT_WEB_CONFIG = {
  apiKey: 'AIzaSyDlyRXx3aUhmsFx0iON1xDE1qGWorsdztc',
  authDomain: 'uncommonattendance.firebaseapp.com',
  projectId: 'uncommonattendance',
  storageBucket: 'uncommonattendance.firebasestorage.app',
  messagingSenderId: '28326821265',
  appId: '1:28326821265:web:5b44ada2b7cba9a83bae30',
  measurementId: 'G-6XGF42V4MH',
} as const;

function envOrDefault(envName: string, fallback: string): string {
  const v = process.env[envName];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  return fallback;
}

const firebaseConfig = {
  apiKey: envOrDefault('REACT_APP_FIREBASE_API_KEY', DEFAULT_WEB_CONFIG.apiKey),
  authDomain: envOrDefault('REACT_APP_FIREBASE_AUTH_DOMAIN', DEFAULT_WEB_CONFIG.authDomain),
  projectId: envOrDefault('REACT_APP_FIREBASE_PROJECT_ID', DEFAULT_WEB_CONFIG.projectId),
  storageBucket: envOrDefault('REACT_APP_FIREBASE_STORAGE_BUCKET', DEFAULT_WEB_CONFIG.storageBucket),
  messagingSenderId: envOrDefault(
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    DEFAULT_WEB_CONFIG.messagingSenderId
  ),
  appId: envOrDefault('REACT_APP_FIREBASE_APP_ID', DEFAULT_WEB_CONFIG.appId),
  measurementId: envOrDefault(
    'REACT_APP_FIREBASE_MEASUREMENT_ID',
    DEFAULT_WEB_CONFIG.measurementId
  ),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
/** Same region as Cloud Functions deployment (see `firebase deploy --only functions`). */
export const functions = getFunctions(app, 'us-central1');

// Optional offline cache; non-fatal if unavailable (e.g., private mode, tests, multi-tab lock).
if (typeof window !== 'undefined') {
  void enableIndexedDbPersistence(db).catch(() => {
    /* ignore persistence setup failures */
  });
}

export default app;
