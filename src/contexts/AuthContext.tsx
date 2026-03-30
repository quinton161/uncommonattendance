import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, AuthContextType } from '../types';
import { uniqueToast } from '../utils/toastUtils';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';
import DataService from '../services/DataService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let snap = await getDoc(doc(db, 'users', fbUser.uid));

          // Retry up to 3× for new accounts (race between Auth and Firestore write)
          for (let i = 0; i < 3 && !snap.exists(); i++) {
            await new Promise(r => setTimeout(r, 1000));
            snap = await getDoc(doc(db, 'users', fbUser.uid));
          }

          const isAdmin    = fbUser.email === 'quintonndlovu161@gmail.com';
          const isStaff    = fbUser.email?.endsWith('@uncommon.org');

          if (snap.exists()) {
            const d = snap.data();
            setUser({
              uid:         fbUser.uid,
              email:       fbUser.email!,
              displayName: d.displayName || fbUser.displayName || 'User',
              photoUrl:    fbUser.photoURL || d.photoUrl,
              userType:    isAdmin ? 'admin' : (d.userType || 'attendee'),
              bio:         d.bio,
              course:      d.course,
              profession:  d.profession,
              createdAt:   d.createdAt?.toDate() || new Date(),
            });
          } else {
            // Create fallback document for users who arrive via Google sign-in
            const fallback = {
              uid:         fbUser.uid,
              email:       fbUser.email!,
              displayName: fbUser.displayName || 'New User',
              userType:    isAdmin ? 'admin' : isStaff ? 'instructor' : 'attendee' as any,
              createdAt:   serverTimestamp(),
              photoUrl:    fbUser.photoURL || null,
              bio:         '',
            };
            await setDoc(doc(db, 'users', fbUser.uid), fallback);
            setUser({
              uid: fallback.uid,
              email: fallback.email,
              displayName: fallback.displayName,
              userType: fallback.userType,
              createdAt: new Date(),
              photoUrl: fallback.photoUrl ?? undefined,
              bio: fallback.bio,
            });
          }
        } catch {
          // Network error — use minimal user from Firebase Auth
          const isAdmin = fbUser.email === 'quintonndlovu161@gmail.com';
          const isStaff = fbUser.email?.endsWith('@uncommon.org');
          setUser({
            uid:         fbUser.uid,
            email:       fbUser.email!,
            displayName: fbUser.displayName || 'User',
            photoUrl:    fbUser.photoURL ?? undefined,
            userType:    isAdmin ? 'admin' : isStaff ? 'instructor' : 'attendee',
            bio:         '',
            createdAt:   new Date(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── register ─────────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, displayName: string, userType: User['userType']) => {
    let fbUser: FirebaseAuthUser | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      fbUser = cred.user;
      await updateProfile(fbUser, { displayName });
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        email: fbUser.email!,
        displayName,
        userType,
        createdAt: serverTimestamp(),
        photoUrl: null,
        bio: '',
      });
      uniqueToast.success('Account created! Welcome!', { autoClose: 3000 });
    } catch (err: any) {
      if (fbUser) {
        try {
          await deleteUser(fbUser);
        } catch {
          /* ignore cleanup failure */
        }
      }
      throw err;
    }
  };

  // ── login ─────────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    uniqueToast.success('Welcome back!', { autoClose: 3000 });
  };

  // ── Google login ──────────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await signInWithPopup(auth, provider);
      uniqueToast.success(`Welcome, ${result.user.displayName}!`, { autoClose: 3000 });
      // NO window.location.href — onAuthStateChanged handles navigation automatically
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      uniqueToast.error(getFirebaseAuthErrorMessage(err.code, 'Google sign-in failed.'), { autoClose: 5000 });
      throw err;
    }
  };

  // ── logout ────────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    uniqueToast.info('Logged out. See you next time!', { autoClose: 3000 });
  };

  // ── updateProfile ─────────────────────────────────────────────────────────────
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    if (data.displayName) {
      await updateProfile(auth.currentUser!, { displayName: data.displayName });
    }
    await updateDoc(doc(db, 'users', user.uid), data as any);
    setUser({ ...user, ...data });
  };

  // ── resetPassword ─────────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // ── deleteAccount ─────────────────────────────────────────────────────────────
  const deleteAccount = async () => {
    if (!auth.currentUser || !user) throw new Error('Not logged in');
    await DataService.getInstance().deleteUser(user.uid);
    await deleteUser(auth.currentUser);
  };

  const value: AuthContextType = {
    user, loading, login, register, logout,
    updateProfile: updateUserProfile, resetPassword,
    deleteAccount, loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
