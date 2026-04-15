import type { Timestamp } from 'firebase/firestore';

/** `system_config/app_update` — user-facing “what’s new” copy shown to all signed-in users (not technical notes) */
export interface AppUpdateDoc {
  /** Monotonic id; larger = newer announcement */
  seq: number;
  title: string;
  message: string;
  updatedAt?: Timestamp | null;
}
