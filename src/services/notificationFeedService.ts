import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { AppNotification, NotificationType } from '../types/notifications';
import { hubIdMatchesScope } from './hubService';

export type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  hubId?: string;
  hubName?: string;
  studentId?: string;
  studentName?: string;
};

function mapDoc(d: any): AppNotification {
  return {
    id: d._id,
    type: (d.type as NotificationType) || 'announcement',
    title: String(d.title || ''),
    body: String(d.body || ''),
    hubId: d.hubId as string | undefined,
    hubName: d.hubName as string | undefined,
    studentId: d.studentId as string | undefined,
    studentName: d.studentName as string | undefined,
    createdAt: new Date(d.createdAt),
    readBy: Array.isArray(d.readBy) ? d.readBy : [],
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  try {
    return await convex.mutation(api.notifications.create as any, {
      type: input.type,
      title: input.title.trim(),
      body: input.body.trim(),
      hubId: input.hubId?.trim() || '',
      hubName: input.hubName?.trim() || '',
      studentId: input.studentId?.trim() || '',
      studentName: input.studentName?.trim() || '',
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notificationFeedService] createNotification failed', e);
    }
    return null;
  }
}

export async function markNotificationRead(notificationId: string, uid: string): Promise<void> {
  if (!notificationId || !uid) return;
  try {
    await convex.mutation(api.notifications.markRead as any, {
      notificationId: notificationId as any,
      uid,
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notificationFeedService] markNotificationRead failed', e);
    }
  }
}

export function subscribeToNotifications(
  opts: {
    hubId?: string;
    limitCount?: number;
    uid: string;
    onData: (items: AppNotification[], unreadCount: number) => void;
    onError?: (err: Error) => void;
    onNew?: (item: AppNotification) => void;
  }
): () => void {
  const { hubId, limitCount = 40, uid, onData, onError, onNew } = opts;

  let first = true;
  let prevIds = new Set<string>();

  const fetchAndNotify = async () => {
    try {
      let items = await convex.query(api.notifications.listRecent as any, { limitCount }) as any[];
      const mapped = (items || []).map(mapDoc);

      let filtered = mapped;
      if (hubId) {
        filtered = mapped.filter((n) => !n.hubId || hubIdMatchesScope(n.hubId, hubId));
      }
      const unreadCount = filtered.filter((n) => !n.readBy.includes(uid)).length;

      if (!first && onNew) {
        filtered.forEach((n) => {
          if (!prevIds.has(n.id)) onNew(n);
        });
      }
      prevIds = new Set(filtered.map((n) => n.id));
      first = false;
      onData(filtered, unreadCount);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[notificationFeedService] subscribe failed', err);
      }
      onData([], 0);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  fetchAndNotify();
  const interval = setInterval(fetchAndNotify, 20000);
  return () => clearInterval(interval);
}
