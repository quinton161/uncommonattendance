import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import type { AppUpdateDoc } from '../types/appUpdate';

const STORAGE_KEY = 'uncommon_app_update_seq';

export function getLastSeenAppUpdateSeq(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v == null || v === '') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function setLastSeenAppUpdateSeq(seq: number): void {
  try { localStorage.setItem(STORAGE_KEY, String(seq)); } catch { /* ignore */ }
}

export function subscribeToAppUpdate(
  onData: (data: AppUpdateDoc | null, err: Error | null) => void
): () => void {
  const fetchAndNotify = async () => {
    try {
      const update = await convex.query(api.appUpdates.getLatest as any) as any;
      if (!update) {
        onData(null, null);
        return;
      }
      onData({
        seq: update.seq,
        title: update.title,
        message: update.message,
      }, null);
    } catch (err) {
      onData(null, err instanceof Error ? err : new Error(String(err)));
    }
  };

  fetchAndNotify();
  const interval = setInterval(fetchAndNotify, 30000);
  return () => clearInterval(interval);
}

export async function publishAppUpdate(input: { title: string; message: string }): Promise<number> {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title) throw new Error('Title is required');
  if (!message) throw new Error('Message is required');

  const seq = await convex.mutation(api.appUpdates.publish as any, { title, message });
  setLastSeenAppUpdateSeq(seq);
  return seq;
}
