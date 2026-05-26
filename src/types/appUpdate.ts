import type { Timestamp } from 'firebase/firestore';

/** `system_config/app_update` — broadcast “new update” to all signed-in users */
export interface AppUpdateDoc {
  /** Monotonic id; larger = newer announcement */
  seq: number;
  title: string;
  message: string;
  updatedAt?: Timestamp | null;
}
