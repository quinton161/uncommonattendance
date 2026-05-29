import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
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

function mapDoc(id: string, data: Record<string, unknown>): AppNotification {
  const created = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    type: (data.type as NotificationType) || 'announcement',
    title: String(data.title || ''),
    body: String(data.body || ''),
    hubId: data.hubId as string | undefined,
    hubName: data.hubName as string | undefined,
    studentId: data.studentId as string | undefined,
    studentName: data.studentName as string | undefined,
    createdAt: created?.toDate?.() ?? new Date(),
    readBy: Array.isArray(data.readBy) ? (data.readBy as string[]) : [],
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  try {
    const ref = await addDoc(collection(db, 'notifications'), {
      type: input.type,
      title: input.title.trim(),
      body: input.body.trim(),
      hubId: input.hubId?.trim() || '',
      hubName: input.hubName?.trim() || '',
      studentId: input.studentId?.trim() || '',
      studentName: input.studentName?.trim() || '',
      createdAt: serverTimestamp(),
      readBy: [],
    });
    return ref.id;
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
    await updateDoc(doc(db, 'notifications', notificationId), {
      readBy: arrayUnion(uid),
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
  /** Global feed only — avoids composite-index deploy/build issues; hub filter is client-side. */
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(limitCount));

  let first = true;
  let prevIds = new Set<string>();

  const handleError = (err: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notificationFeedService] subscribe failed', err);
    }
    onData([], 0);
    onError?.(err);
  };

  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
      if (hubId) {
        items = items.filter(
          (n) => !n.hubId || hubIdMatchesScope(n.hubId, hubId)
        );
      }
      const unreadCount = items.filter((n) => !n.readBy.includes(uid)).length;

      if (!first && onNew) {
        items.forEach((n) => {
          if (!prevIds.has(n.id)) onNew(n);
        });
      }
      prevIds = new Set(items.map((n) => n.id));
      first = false;
      onData(items, unreadCount);
    },
    (err) => {
      handleError(err);
    }
  );
}
