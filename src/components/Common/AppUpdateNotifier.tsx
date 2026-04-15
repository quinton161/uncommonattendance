import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import {
  getLastSeenAppUpdateSeq,
  setLastSeenAppUpdateSeq,
  subscribeToAppUpdate,
} from '../../services/appUpdateService';
import { UncommonToastBody } from './UncommonToast';

/**
 * Listens to `system_config/app_update` and shows a one-time-style toast when `seq`
 * increases. Persists last-seen seq in localStorage so refreshes don’t repeat the same update.
 */
export const AppUpdateNotifier: React.FC = () => {
  const { user, loading } = useAuth();
  const sessionHandledRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (loading || !user) return;

    const unsub = subscribeToAppUpdate((data, err) => {
      if (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AppUpdateNotifier]', err.message);
        }
        return;
      }
      if (!data || !data.seq) return;

      const lastSeen = getLastSeenAppUpdateSeq();
      if (data.seq <= lastSeen) return;
      if (sessionHandledRef.current.has(data.seq)) return;
      sessionHandledRef.current.add(data.seq);

      setLastSeenAppUpdateSeq(data.seq);

      const bodyText = `${data.title}\n\n${data.message}`;
      const toastId = `app-update-${data.seq}`;

      toast.info(
        React.createElement(UncommonToastBody, {
          variant: 'info',
          message: bodyText,
          labelOverride: "What's new",
        }),
        {
          toastId,
          icon: false,
          className: 'uncommon-toast-outer',
          autoClose: 12000,
        }
      );
    });

    return () => unsub();
  }, [user, loading]);

  return null;
};
