import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Removes the Firebase Authentication user for a student so they can register again
 * with the same email after their Firestore profile was removed.
 * Implemented via Cloud Function (Admin SDK). Safe to ignore if Functions are not deployed.
 */
export async function deleteStudentAuthUserCallable(uid: string): Promise<void> {
  const fn = httpsCallable(functions, 'deleteStudentAuthUser');
  await fn({ uid });
}
