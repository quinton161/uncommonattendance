import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Links email/password on Google-only Auth accounts so sendPasswordResetEmail works.
 * Safe to call before every client-side reset request.
 */
export async function preparePasswordResetCallable(email: string): Promise<void> {
  const fn = httpsCallable<{ email: string }, { ok: boolean }>(functions, 'preparePasswordReset');
  await fn({ email: email.trim().toLowerCase() });
}
