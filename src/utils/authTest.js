// Simple Firebase Auth test
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

// Test function to verify Firebase Auth is working
export const testFirebaseAuth = async () => {
  console.log('🧪 Testing Firebase Authentication...');
  
  try {
    // Test 1: Check if auth is initialized
    console.log('1. Auth instance:', auth);
    console.log('2. Auth app:', auth.app);
    console.log('3. Auth config:', auth.config);
    
    // Test 2: Try to create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    
    console.log('4. Creating test user:', testEmail);
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Test user created successfully:', userCredential.user.uid);
    
    // Test 3: Try to sign in with the test user
    console.log('5. Signing in with test user...');
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Test user signed in successfully');
    
    // Test 4: Sign out
    await auth.signOut();
    console.log('✅ Test user signed out successfully');
    
    return { success: true, message: 'All Firebase Auth tests passed!' };
    
  } catch (error) {
    console.error('❌ Firebase Auth test failed:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  window.testFirebaseAuth = testFirebaseAuth;
  console.log('🧪 Firebase Auth test available: window.testFirebaseAuth()');
}
