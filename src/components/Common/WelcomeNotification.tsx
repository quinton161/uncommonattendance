import React, { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../contexts/AuthContext';
import { uniqueToast } from '../../utils/toastUtils';

export const WelcomeNotification: React.FC = () => {
  const { user, hubResolved } = useAuth();
  const clearFirstVisit = useMutation(api.users.clearFirstVisit);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!user || !hubResolved || shownRef.current) return;
    if (user.firstVisit) {
      shownRef.current = true;
      const name = user.displayName || 'there';
      uniqueToast.success(
        `Welcome to Uncommon Attendance, ${name}!`,
        { labelOverride: 'Welcome' }
      );
      clearFirstVisit();
    }
  }, [user, hubResolved, clearFirstVisit]);

  return null;
};
