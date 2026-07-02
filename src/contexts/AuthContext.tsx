import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';
import { User, AuthContextType, HubSelection } from '../types';
import { uniqueToast } from '../utils/toastUtils';
import { useAuthActions } from '@convex-dev/auth/react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut: convexSignOut, signIn } = useAuthActions();
  const convexAuth = useConvexAuth();

  const currentQuery = api?.users?.current;
  const storeUserMutation = api?.users?.storeUser;
  const updateProfileMut = api?.users?.updateProfile;

  const convexUser = useQuery(currentQuery as any);
  const storeUser = useMutation(storeUserMutation as any);
  const updateProfileMutation = useMutation(updateProfileMut as any);

  const [localUser, setLocalUser] = useState<User | null>(null);
  const [hubResolved, setHubResolved] = useState(false);
  const [storeUserError, setStoreUserError] = useState<string | null>(null);
  const storeUserAttemptedRef = useRef(false);

  useEffect(() => {
    if (convexAuth.isAuthenticated && convexUser && !storeUserAttemptedRef.current) {
      storeUserAttemptedRef.current = true;
      setStoreUserError(null);
    }
  }, [convexAuth.isAuthenticated, convexUser, storeUser]);

  useEffect(() => {
    if (convexAuth.isAuthenticated && convexUser !== undefined) {
      if (convexUser) {
        const email = convexUser.email || '';
        const isUncommonAdmin = email.toLowerCase().endsWith('@uncommon.org');
        setLocalUser({
          uid: convexUser._id,
          email: convexUser.email,
          emailLower: convexUser.emailLower,
          displayName: convexUser.displayName || "User",
          userType: (isUncommonAdmin ? 'admin' : (convexUser.userType || 'attendee')) as any,
          createdAt: new Date(convexUser.createdAt),
          photoUrl: convexUser.profileImageUrl,
          hubId: convexUser.hubId,
          hubName: convexUser.hubName,
          bio: convexUser.bio,
          course: convexUser.course,
          profession: convexUser.profession,
          firstVisit: convexUser.firstVisit,
        } as any);
        setHubResolved(true);
      } else {
        setLocalUser(null);
        setHubResolved(false);
      }
    } else if (!convexAuth.isAuthenticated && !convexAuth.isLoading) {
      setLocalUser(null);
      setHubResolved(false);
    }
  }, [convexAuth.isAuthenticated, convexAuth.isLoading, convexUser]);

  useEffect(() => {
    if (convexAuth.isAuthenticated && storeUserError) {
      setStoreUserError(null);
      storeUserAttemptedRef.current = false;
    }
  }, [convexAuth.isAuthenticated, storeUserError]);

  const loading =
    convexAuth.isLoading ||
    (convexAuth.isAuthenticated &&
      convexUser === undefined);

  const login = async (email: string) => {
    await signIn("resend-otp", { email });
  };

  const register = async (
    email: string,
    _password: string,
    displayName: string,
    userType: User['userType'],
    hub?: HubSelection
  ) => {
    await storeUser({
      email,
      displayName,
      userType,
      hubId: hub?.id,
      hubName: hub?.name,
      firstName: displayName?.split(' ')[0],
      lastName: displayName?.split(' ').slice(1).join(' '),
    }).catch((err: any) => {
      const msg = err?.message || 'Failed to create user record';
      console.error('storeUser error:', err);
      setStoreUserError(msg);
    });
    await signIn("resend-otp", { email });
  };

  const logout = async () => {
    await convexSignOut();
    uniqueToast.info('Logged out. See you next time!');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!localUser || !updateProfileMutation) return;
    await updateProfileMutation({
      userId: localUser.uid as any,
      displayName: data.displayName,
      bio: data.bio,
      photoUrl: data.photoUrl,
    });
  };

  const setHub = async (hub: HubSelection) => {
    if (!localUser || !updateProfileMutation) return;
    await updateProfileMutation({
      userId: localUser.uid as any,
      hubId: hub.id as any,
    });
  };

  const resetPassword = async (_email?: string) => {
    uniqueToast.info('With OTP sign-in, just sign in again with your email.');
  };

  const loginWithGoogle = async () => {
    uniqueToast.info('Google sign-in is not available with email OTP.');
  };

  const deleteAccount = async () => { };

  const value: AuthContextType = {
    user: localUser,
    loading: loading as boolean,
    hubResolved,
    authError: storeUserError,
    retryStoreUser: async () => {
      storeUserAttemptedRef.current = false;
      setStoreUserError(null);
    },
    login: login as any,
    register: register as any,
    logout,
    updateProfile,
    resetPassword: resetPassword as any,
    deleteAccount,
    loginWithGoogle: loginWithGoogle as any,
    setHub,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
