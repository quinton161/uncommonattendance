import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { AppUpdateDoc } from '../types/appUpdate';

export const APP_UPDATE_COLLECTION = 'system_config';
export const APP_UPDATE_DOC_ID = 'app_update';

const STORAGE_KEY = 'uncommon_app_update_seq';

export function getLastSeenAppUpdateSeq(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v == null || v === '') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setLastSeenAppUpdateSeq(seq: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(seq));
  } catch {
    /* ignore quota */
  }
}

export function subscribeToAppUpdate(
  onData: (data: AppUpdateDoc | null, err: Error | null) => void
): () => void {
  const ref = doc(db, APP_UPDATE_COLLECTION, APP_UPDATE_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null, null);
        return;
      }
      const d = snap.data() as Partial<AppUpdateDoc>;
      const seq = typeof d.seq === 'number' ? d.seq : 0;
      const title = typeof d.title === 'string' ? d.title : 'Update';
      const message = typeof d.message === 'string' ? d.message : '';
      onData({ seq, title, message, updatedAt: d.updatedAt }, null);
    },
    (err) => onData(null, err)
  );
}

/** Admin: publish a new announcement; bumps `seq` so clients show the scrollable note until dismissed */
export async function publishAppUpdate(input: { title: string; message: string }): Promise<number> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title) throw new Error('Title is required');
  if (!message) throw new Error('Message is required');

  const seq = Date.now();
  await setDoc(
    doc(db, APP_UPDATE_COLLECTION, APP_UPDATE_DOC_ID),
    {
      seq,
      title,
      message,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  setLastSeenAppUpdateSeq(seq);
  return seq;
}
