import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';
import { User, AuthContextType, HubSelection } from '../types';
import { uniqueToast } from '../utils/toastUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const clerk = useClerk();
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
    if (clerkLoaded && clerkUser && storeUser && !storeUserAttemptedRef.current) {
      storeUserAttemptedRef.current = true;
      setStoreUserError(null);
      // Reload the user to get the latest unsafeMetadata from Clerk
      clerkUser.reload().then(() => {
        const meta = clerkUser.unsafeMetadata as any;
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        // Derive userType: always admin for @uncommon.org
        let userType = meta?.userType || undefined;
        if (email.toLowerCase().endsWith('@uncommon.org')) {
          userType = 'admin';
        }
        storeUser({
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          displayName: clerkUser.fullName || undefined,
          photoUrl: clerkUser.imageUrl,
          hubId: meta?.hubId || undefined,
          hubName: meta?.hubName || undefined,
          userType,
        }).catch((err: any) => {
          const msg = err?.message || err?.errors?.[0]?.message || 'Failed to create user record';
          console.error('storeUser error:', err);
          setStoreUserError(msg);
        });
      }).catch(() => {
        // Fallback if reload fails — use existing metadata
        const meta = clerkUser.unsafeMetadata as any;
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        let userType = meta?.userType || undefined;
        if (email.toLowerCase().endsWith('@uncommon.org')) {
          userType = 'admin';
        }
        storeUser({
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          displayName: clerkUser.fullName || undefined,
          photoUrl: clerkUser.imageUrl,
          hubId: meta?.hubId || undefined,
          hubName: meta?.hubName || undefined,
          userType,
        }).catch((err: any) => {
          const msg = err?.message || err?.errors?.[0]?.message || 'Failed to create user record';
          console.error('storeUser error:', err);
          setStoreUserError(msg);
        });
      });
    }
  }, [clerkLoaded, clerkUser, storeUser]);

  useEffect(() => {
    if (clerkLoaded && clerkUser && convexUser !== undefined) {
      if (convexUser) {
           const email = convexUser.email || '';
           const isUncommonAdmin = email.toLowerCase().endsWith('@uncommon.org');
           setLocalUser({
             uid: convexUser._id,
             clerkId: clerkUser.id,
             email: convexUser.email,
             emailLower: convexUser.emailLower,
             displayName: convexUser.displayName || clerkUser.fullName || "User",
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
    } else if (clerkLoaded && !clerkUser) {
      setLocalUser(null);
      setHubResolved(false);
    }
  }, [clerkLoaded, clerkUser, convexUser]);

  // Clear any stale auth error when Convex auth successfully recovers
  useEffect(() => {
    if (convexAuth.isAuthenticated && storeUserError) {
      setStoreUserError(null);
      storeUserAttemptedRef.current = false;
    }
  }, [convexAuth.isAuthenticated, storeUserError]);

  // Show loading spinner while:
  //  1. Clerk hasn't resolved yet
  //  2. Clerk user is logged in but convexUser is still undefined (query in flight)
  //  3. Clerk user is logged in and convexUser is null (storeUser mutation in flight — first login)
  const loading =
    !clerkLoaded ||
    (!!clerkUser &&
      convexUser === undefined) ||
    (!!clerkUser &&
      convexUser === null &&
      !storeUserError &&
      convexAuth.isLoading);

  const login = async () => clerk.openSignIn();
  const register = async () => clerk.openSignUp();
  const logout = async () => {
    await signOut();
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

  const resetPassword = async () => clerk.openSignIn();
  const loginWithGoogle = async () => clerk.openSignIn();
  const deleteAccount = async () => {
    await clerkUser?.delete();
  };

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
