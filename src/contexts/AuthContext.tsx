import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, AuthContextType } from '../types';
import { uniqueToast } from '../utils/toastUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 AuthContext: Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          console.log('🔐 AuthContext: Fetching user data from Firestore...');
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('🔐 AuthContext: User data loaded:', userData.displayName, userData.userType);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              photoUrl: firebaseUser.photoURL || userData.photoUrl,
              userType: userData.userType || 'attendee',
              bio: userData.bio,
              createdAt: userData.createdAt?.toDate() || new Date(),
            });
          } else {
            console.warn('🔐 AuthContext: User document not found in Firestore');
            setUser(null);
          }
        } catch (error) {
          console.error('🔐 AuthContext: Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log('🔐 AuthContext: Auth initialization complete');
    });

    return unsubscribe;
  }, []);

  const register = async (
    email: string,
    password: string,
    displayName: string,
    userType: 'organizer' | 'attendee' | 'admin'
  ) => {
    console.log('🔐 AuthContext: Starting registration for:', email, userType);
    try {
      console.log('🔐 AuthContext: Creating Firebase user...');
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log('🔐 AuthContext: Firebase user created:', firebaseUser.uid);

      // Update Firebase Auth profile
      console.log('🔐 AuthContext: Updating Firebase profile...');
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      console.log('🔐 AuthContext: Creating Firestore user document...');
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        userType,
        createdAt: new Date(),
        photoUrl: null,
        bio: '',
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('🔐 AuthContext: Registration complete!');
      uniqueToast.success('Account created successfully! Welcome!', { autoClose: 4000 });
    } catch (error) {
      console.error('🔐 AuthContext: Registration error:', error);
      uniqueToast.error('Failed to create account. Please try again.', { autoClose: 4000 });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Starting login for:', email);
    try {
      console.log('🔐 AuthContext: Attempting Firebase sign in...');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('🔐 AuthContext: Login successful!');
      uniqueToast.success('Welcome back! Successfully logged in.', { autoClose: 3000 });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide specific error messages based on Firebase error codes
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      uniqueToast.error(errorMessage, { autoClose: 5000 });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      uniqueToast.info('Successfully logged out. See you next time!', { autoClose: 3000 });
    } catch (error) {
      console.error('Logout error:', error);
      uniqueToast.error('Failed to logout. Please try again.', { autoClose: 3000 });
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile if displayName or photoUrl changed
      if (data.displayName || data.photoUrl) {
        await updateProfile(auth.currentUser!, {
          displayName: data.displayName || auth.currentUser!.displayName,
          photoURL: data.photoUrl || auth.currentUser!.photoURL,
        });
      }

      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), data);

      // Update local state
      setUser({ ...user, ...data });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      uniqueToast.success('Password reset email sent! Check your inbox.', { autoClose: 5000 });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Failed to send password reset email.';
      }
      
      uniqueToast.error(errorMessage, { autoClose: 5000 });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile: updateUserProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
