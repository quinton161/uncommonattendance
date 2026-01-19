// Temporary file to test Firebase connection
import { auth, db } from '../services/firebase';

export const testFirebaseConnection = () => {
  console.log('Testing Firebase connection...');
  
  // Test environment variables
  console.log('Environment variables:', {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'SET' : 'MISSING',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'SET' : 'MISSING',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'MISSING',
    appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'SET' : 'MISSING',
  });
  
  // Test Auth
  console.log('Auth instance:', auth);
  console.log('Auth app:', auth.app);
  
  // Test Firestore
  console.log('Firestore instance:', db);
  console.log('Firestore app:', db.app);
  
  return {
    auth: !!auth,
    db: !!db,
    config: {
      apiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
    }
  };
};
