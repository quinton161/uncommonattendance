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
  fetchSignInMethodsForEmail,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, AuthContextType, HubSelection } from '../types';
import { uniqueToast } from '../utils/toastUtils';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';
import DataService from '../services/DataService';
import { ADMIN_EMAIL } from '../constants/admin';
import { isUncommonOrgStaffEmail } from '../constants/staff';

function needsHubRole(userType: User['userType']): boolean {
  return userType === 'attendee' || userType === 'instructor';
}

function isGoogleSignIn(fbUser: FirebaseAuthUser): boolean {
  return !!fbUser.providerData?.some((p) => p.providerId === 'google.com');
}

/** Directory email stored in Firestore (`users/{uid}.email`); falls back to Firebase Auth sign-in email. */
function directoryEmailFromUserDoc(
  d: Record<string, unknown> | undefined,
  firebaseEmail: string | null
): string {
  const docEmail = d && typeof d.email === 'string' ? d.email.trim() : '';
  if (docEmail) return docEmail;
  return (firebaseEmail || '').trim();
}

function emailLowerFromUserDoc(
  d: Record<string, unknown> | undefined,
  directoryEmail: string
): string | undefined {
  if (d && typeof d.emailLower === 'string' && d.emailLower.trim()) {
    return d.emailLower.trim().toLowerCase();
  }
  return directoryEmail ? directoryEmail.toLowerCase() : undefined;
}

/** Same code Firebase uses so the UI can detect “use Sign in, not Sign up” and prefill email. */
function emailAlreadyRegisteredError(): Error & { code: 'auth/email-already-in-use' } {
  const e = new Error(
    'This email is already registered. Use Sign in (not Create account). If you forgot your password, use Forgot password on the sign-in screen. If your app profile was removed but your login still exists, signing in will reconnect you. Ask an admin to delete the user in Firebase Authentication only if you need a completely new login at this address.'
  ) as Error & { code: 'auth/email-already-in-use' };
  e.code = 'auth/email-already-in-use';
  return e;
}

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

          const isAdmin    = fbUser.email === ADMIN_EMAIL;
          const isStaff    = isUncommonOrgStaffEmail(fbUser.email);

          if (snap.exists()) {
            const d = snap.data() as Record<string, unknown>;
            const dirEmail = directoryEmailFromUserDoc(d, fbUser.email);
            try {
              await updateDoc(doc(db, 'users', fbUser.uid), { lastLoginAt: serverTimestamp() });
            } catch {
              /* non-fatal */
            }
            setUser({
              uid:         fbUser.uid,
              email:       dirEmail,
              emailLower:  emailLowerFromUserDoc(d, dirEmail),
              displayName: (d.displayName as string) || fbUser.displayName || 'User',
              photoUrl:    fbUser.photoURL || (d.photoUrl as string | undefined),
              userType:    isAdmin ? 'admin' : ((d.userType as User['userType']) || 'attendee'),
              bio:         d.bio as string | undefined,
              course:      d.course as string | undefined,
              profession:  d.profession as string | undefined,
              hubId:       d.hubId as string | undefined,
              hubName:     d.hubName as string | undefined,
              createdAt:   (d.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date(),
            });
          } else if (isAdmin) {
            const fallback = {
              uid:         fbUser.uid,
              email:       fbUser.email!,
              emailLower:  fbUser.email!.trim().toLowerCase(),
              displayName: fbUser.displayName || 'Admin',
              userType:    'admin' as const,
              createdAt:   serverTimestamp(),
              photoUrl:    fbUser.photoURL || null,
              bio:         '',
            };
            await setDoc(doc(db, 'users', fbUser.uid), fallback);
            setUser({
              uid: fallback.uid,
              email: fallback.email,
              displayName: fallback.displayName,
              userType: 'admin',
              createdAt: new Date(),
              photoUrl: fallback.photoUrl ?? undefined,
              bio: fallback.bio,
            });
          } else if (isGoogleSignIn(fbUser)) {
            // New Google user: require explicit registration (role + hub) — no Firestore row yet
            setUser({
              uid: fbUser.uid,
              email: fbUser.email!,
              displayName: fbUser.displayName || 'User',
              photoUrl: fbUser.photoURL ?? undefined,
              userType: 'attendee',
              createdAt: new Date(),
              bio: '',
              needsProfileCompletion: true,
            });
          } else {
            // Legacy: email/password or other providers without a doc yet
            const fallback = {
              uid:         fbUser.uid,
              email:       fbUser.email!,
              emailLower:  fbUser.email!.trim().toLowerCase(),
              displayName: fbUser.displayName || 'New User',
              userType:    isStaff ? 'instructor' : 'attendee' as any,
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
          const isAdmin = fbUser.email === ADMIN_EMAIL;
          const isStaff = isUncommonOrgStaffEmail(fbUser.email);
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
  const register = async (
    email: string,
    password: string,
    displayName: string,
    userType: User['userType'],
    hub?: HubSelection
  ) => {
    const emailTrim = email.trim();
    if (userType === 'attendee' && isUncommonOrgStaffEmail(emailTrim)) {
      throw new Error(
        'Uncommon staff emails (@uncommon.org) cannot register as students. Choose Instructor, or use a personal email for a student account.'
      );
    }
    // Note: With “email enumeration protection” enabled, fetchSignInMethodsForEmail often
    // returns an empty list even when the address exists — registration then fails at createUser.
    const methods = await fetchSignInMethodsForEmail(auth, emailTrim);
    if (methods.length > 0) {
      throw emailAlreadyRegisteredError();
    }
    const taken = await DataService.getInstance().isEmailLowerTaken(emailTrim);
    if (taken) {
      throw new Error('An account with this email already exists in our directory.');
    }

    let fbUser: FirebaseAuthUser | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, emailTrim, password);
      fbUser = cred.user;
      await updateProfile(fbUser, { displayName });
      const hubFields =
        hub && needsHubRole(userType)
          ? { hubId: hub.id, hubName: hub.name }
          : {};
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        email: fbUser.email!,
        emailLower: fbUser.email!.trim().toLowerCase(),
        displayName,
        userType,
        createdAt: serverTimestamp(),
        photoUrl: null,
        bio: '',
        ...hubFields,
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
      if (err?.code === 'auth/email-already-in-use') {
        throw emailAlreadyRegisteredError();
      }
      throw err;
    }
  };

  // ── login ─────────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, hub?: HubSelection) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = cred.user.email === ADMIN_EMAIL;

    const snapLogin = await getDoc(doc(db, 'users', cred.user.uid));
    if (isUncommonOrgStaffEmail(cred.user.email) && snapLogin.exists()) {
      const ut = (snapLogin.data().userType || 'attendee') as User['userType'];
      if (ut === 'attendee') {
        await signOut(auth);
        throw new Error(
          'This @uncommon.org profile is set as a student. Uncommon staff must use an instructor account. Ask an admin to change your role in Firestore, or register as Instructor.'
        );
      }
    }

    if (!isAdmin && hub) {
      const d = snapLogin.exists() ? snapLogin.data() : {};
      const userType = (d.userType || 'attendee') as User['userType'];
      if (needsHubRole(userType)) {
        await setDoc(
          doc(db, 'users', cred.user.uid),
          {
            hubId: hub.id,
            hubName: hub.name,
            emailLower: cred.user.email?.trim().toLowerCase() ?? undefined,
          },
          { merge: true }
        );
      }
    }
    uniqueToast.success('Welcome back!', { autoClose: 3000 });
  };

  // ── Google login ──────────────────────────────────────────────────────────────
  const loginWithGoogle = async (hub?: HubSelection) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await signInWithPopup(auth, provider);
      const fb = result.user;
      const isAdmin = fb.email === ADMIN_EMAIL;
      const snap = await getDoc(doc(db, 'users', fb.uid));

      // Brand-new Google account (no Firestore profile): let them complete registration next
      if (!snap.exists() && !isAdmin) {
        uniqueToast.info('Welcome! Finish setting up your account (role and hub).', { autoClose: 4000 });
        return;
      }

      if (snap.exists() && isUncommonOrgStaffEmail(fb.email)) {
        const ut = (snap.data().userType || 'attendee') as User['userType'];
        if (ut === 'attendee') {
          await signOut(auth);
          uniqueToast.error(
            'This @uncommon.org account is registered as a student. Uncommon staff must use an instructor profile. Ask an admin to update your role.',
            { autoClose: 6000 }
          );
          return;
        }
      }

      // Existing user: non-admins must pick a hub on the login screen before we merge
      if (!isAdmin && !hub) {
        await signOut(auth);
        uniqueToast.error('Please select your hub before signing in with Google.', { autoClose: 5000 });
        return;
      }

      if (!isAdmin && hub) {
        const d = snap.exists() ? snap.data() : {};
        const userType = (d.userType || 'attendee') as User['userType'];
        if (needsHubRole(userType)) {
          await setDoc(
            doc(db, 'users', fb.uid),
            {
              hubId: hub.id,
              hubName: hub.name,
              emailLower: fb.email?.trim().toLowerCase() ?? undefined,
            },
            { merge: true }
          );
        }
      }
      uniqueToast.success(`Welcome, ${result.user.displayName}!`, { autoClose: 3000 });
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      uniqueToast.error(getFirebaseAuthErrorMessage(err.code, 'Google sign-in failed.'), { autoClose: 5000 });
      throw err;
    }
  };

  const completeGoogleProfile = async (
    displayName: string,
    userType: User['userType'],
    hub?: HubSelection
  ) => {
    const cu = auth.currentUser;
    if (!cu || !user?.needsProfileCompletion) {
      throw new Error('Not completing Google registration.');
    }
    if (userType === 'instructor' && !isUncommonOrgStaffEmail(cu.email)) {
      uniqueToast.error('Instructor accounts must use an @uncommon.org email.', { autoClose: 4000 });
      return;
    }
    if (userType === 'attendee' && isUncommonOrgStaffEmail(cu.email)) {
      uniqueToast.error('Uncommon staff (@uncommon.org) cannot register as students. Choose Instructor.', { autoClose: 5000 });
      return;
    }
    if (needsHubRole(userType) && !hub) {
      uniqueToast.error('Please select your hub.', { autoClose: 4000 });
      return;
    }
    const em = cu.email!.trim();
    const dup = await DataService.getInstance().isEmailLowerTaken(em, cu.uid);
    if (dup) {
      uniqueToast.error('This email is already registered to another account.', { autoClose: 4000 });
      return;
    }

    const hubFields =
      hub && needsHubRole(userType) ? { hubId: hub.id, hubName: hub.name } : {};
    await setDoc(doc(db, 'users', cu.uid), {
      uid: cu.uid,
      email: cu.email!,
      emailLower: em.toLowerCase(),
      displayName: displayName.trim(),
      userType,
      createdAt: serverTimestamp(),
      photoUrl: cu.photoURL || null,
      bio: '',
      ...hubFields,
    });
    await updateProfile(cu, { displayName: displayName.trim() });
    setUser({
      uid: cu.uid,
      email: cu.email!,
      displayName: displayName.trim(),
      userType,
      createdAt: new Date(),
      photoUrl: cu.photoURL ?? undefined,
      bio: '',
      ...hubFields,
    });
    uniqueToast.success('Account created! Welcome!', { autoClose: 3000 });
  };

  const cancelGoogleRegistration = async () => {
    await signOut(auth);
    uniqueToast.info('Sign in again when you are ready to register.', { autoClose: 3000 });
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
    const payload: Record<string, unknown> = { ...data };
    if (typeof data.email === 'string') {
      const trimmed = data.email.trim();
      payload.email = trimmed;
      payload.emailLower = trimmed.toLowerCase();
    }
    await updateDoc(doc(db, 'users', user.uid), payload as any);
    setUser({ ...user, ...payload } as User);
  };

  const setHub = async (hub: HubSelection) => {
    if (!auth.currentUser || !user) throw new Error('Not logged in');
    if (!needsHubRole(user.userType)) return;
    await updateDoc(doc(db, 'users', user.uid), { hubId: hub.id, hubName: hub.name });
    setUser({ ...user, hubId: hub.id, hubName: hub.name });
  };

  // ── resetPassword ─────────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await sendPasswordResetEmail(auth, email.trim(), {
      url: `${origin}/reset-password`,
      handleCodeInApp: true,
    });
  };

  // ── deleteAccount ─────────────────────────────────────────────────────────────
  const deleteAccount = async () => {
    if (!auth.currentUser || !user) throw new Error('Not logged in');
    await DataService.getInstance().deleteUser(user.uid, { actingUser: user });
    await deleteUser(auth.currentUser);
  };

  const value: AuthContextType = {
    user, loading, login, register, logout,
    updateProfile: updateUserProfile, resetPassword,
    deleteAccount, loginWithGoogle, setHub,
    completeGoogleProfile, cancelGoogleRegistration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
