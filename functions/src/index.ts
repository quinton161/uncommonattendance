import * as admin from 'firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

admin.initializeApp();

/** Matches `hubService` LEGACY_DEFAULT_HUB_ID */
const LEGACY_HUB = 'uncommon_victoriafalls';

function effectiveHub(data: DocumentData | undefined): string {
  if (!data) return '';
  const h = data.hubId;
  if (h == null || String(h).trim() === '') return '';
  return String(h).trim();
}

function hubMatchesInstructorScope(recordHub: string, instructorHub: string): boolean {
  const scope = instructorHub || LEGACY_HUB;
  const r = recordHub || '';
  if (r === scope) return true;
  if (scope === LEGACY_HUB && !r) return true;
  return false;
}

interface DeleteStudentAuthPayload {
  uid?: string;
}

/**
 * Deletes a Firebase Auth user so the email can be used for a new registration
 * after staff removed the Firestore profile. Admins: any uid. Instructors: students in their hub only.
 */
/** Minimal callable context typing (avoids coupling to firebase-functions internal exports). */
interface CallableContext {
  auth?: { uid: string } | null;
}

export const deleteStudentAuthUser = functions
  .region('us-central1')
  .https.onCall(async (data: DeleteStudentAuthPayload, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
    }

    const uid = data?.uid;
    if (!uid || typeof uid !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Missing uid.');
    }

    const callerUid = context.auth.uid;
    if (callerUid === uid) {
      throw new functions.https.HttpsError('invalid-argument', 'Use account settings to remove your own login.');
    }

    const db = admin.firestore();
    const [callerSnap, targetSnap] = await Promise.all([
      db.doc(`users/${callerUid}`).get(),
      db.doc(`users/${uid}`).get(),
    ]);

    if (!callerSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Staff profile missing.');
    }

    const caller = callerSnap.data()!;
    const callerType = String(caller.userType || '').toLowerCase();

    if (callerType === 'admin') {
      try {
        await admin.auth().deleteUser(uid);
        return { deleted: true };
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code;
        if (code === 'auth/user-not-found') return { deleted: false };
        console.error('deleteStudentAuthUser (admin)', e);
        throw new functions.https.HttpsError('internal', 'Could not delete Auth user.');
      }
    }

    if (callerType !== 'instructor') {
      throw new functions.https.HttpsError('permission-denied', 'Only staff can remove login accounts.');
    }

    if (!targetSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }

    const target = targetSnap.data()!;
    const targetType = String(target.userType || '').toLowerCase();
    if (targetType === 'admin' || targetType === 'instructor') {
      throw new functions.https.HttpsError('permission-denied', 'Instructors can only reset student logins.');
    }

    const instructorHub = effectiveHub(caller) || LEGACY_HUB;
    const targetHub = effectiveHub(target) || LEGACY_HUB;
    if (!hubMatchesInstructorScope(targetHub, instructorHub)) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot remove this account (different hub).');
    }

    try {
      await admin.auth().deleteUser(uid);
      return { deleted: true };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/user-not-found') return { deleted: false };
      console.error('deleteStudentAuthUser (instructor)', e);
      throw new functions.https.HttpsError('internal', 'Could not delete Auth user.');
    }
  });
