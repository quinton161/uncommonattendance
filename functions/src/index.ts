import * as admin from 'firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
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

interface ProvisionUserPayload {
  email?: string;
  displayName?: string;
  userType?: string;
  hubId?: string;
  hubName?: string;
}

async function resolveHubName(db: admin.firestore.Firestore, hubId: string, hubName?: string): Promise<string> {
  const trimmedName = hubName?.trim();
  if (trimmedName) return trimmedName;
  if (!hubId) return '';
  try {
    const hubSnap = await db.doc(`hubs/${hubId}`).get();
    if (hubSnap.exists) {
      const n = hubSnap.data()?.name;
      if (n && String(n).trim()) return String(n).trim();
    }
  } catch {
    /* use id */
  }
  return hubId;
}

/**
 * Staff-provisioned accounts: creates Firebase Auth user + Firestore profile.
 * Admins: any role. Instructors: students in their hub only. Password via reset email on client.
 */
export const provisionUser = functions
  .region('us-central1')
  .https.onCall(async (data: ProvisionUserPayload, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
    }

    const email = data?.email?.trim().toLowerCase();
    const displayName = data?.displayName?.trim();
    const userTypeRaw = String(data?.userType || '').toLowerCase();
    const hubId = data?.hubId?.trim() || '';

    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid email is required.');
    }
    if (!displayName || displayName.length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'Display name is required.');
    }

    let userType: 'admin' | 'instructor' | 'attendee';
    if (userTypeRaw === 'admin') userType = 'admin';
    else if (userTypeRaw === 'instructor') userType = 'instructor';
    else if (userTypeRaw === 'attendee' || userTypeRaw === 'student') userType = 'attendee';
    else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid user type.');
    }

    const db = admin.firestore();
    const callerUid = context.auth.uid;
    const callerSnap = await db.doc(`users/${callerUid}`).get();
    if (!callerSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Staff profile missing.');
    }

    const caller = callerSnap.data()!;
    const callerType = String(caller.userType || '').toLowerCase();
    const instructorHub = effectiveHub(caller) || LEGACY_HUB;

    if (callerType === 'instructor') {
      if (userType !== 'attendee') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Instructors can only create student accounts.'
        );
      }
      if (!hubId || !hubMatchesInstructorScope(hubId, instructorHub)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Students must be assigned to your hub.'
        );
      }
    } else if (callerType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only staff can create accounts.');
    }

    if ((userType === 'instructor' || userType === 'attendee') && !hubId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Hub is required for instructors and students.'
      );
    }

    try {
      await admin.auth().getUserByEmail(email);
      throw new functions.https.HttpsError('already-exists', 'An account with this email already exists.');
    } catch (e: unknown) {
      if (e instanceof functions.https.HttpsError) throw e;
      const code = (e as { code?: string })?.code;
      if (code !== 'auth/user-not-found') {
        console.error('provisionUser getUserByEmail', e);
        throw new functions.https.HttpsError('internal', 'Could not verify email.');
      }
    }

    let authUser: admin.auth.UserRecord;
    try {
      authUser = await admin.auth().createUser({
        email,
        displayName,
        emailVerified: false,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Email already registered.');
      }
      console.error('provisionUser createUser', e);
      throw new functions.https.HttpsError('internal', 'Could not create login account.');
    }

    const hubName = await resolveHubName(db, hubId, data?.hubName);
    const profile: Record<string, unknown> = {
      uid: authUser.uid,
      email,
      emailLower: email,
      displayName,
      userType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      photoUrl: null,
      bio: '',
      provisioned: true,
      provisionedBy: callerUid,
      mustSetPassword: true,
    };
    if (hubId) {
      profile.hubId = hubId;
      profile.hubName = hubName || hubId;
    }

    try {
      await db.doc(`users/${authUser.uid}`).set(profile);
    } catch (e) {
      try {
        await admin.auth().deleteUser(authUser.uid);
      } catch {
        /* ignore */
      }
      console.error('provisionUser firestore write', e);
      throw new functions.https.HttpsError('internal', 'Could not save user profile.');
    }

    return { uid: authUser.uid, email, userType };
  });

interface PreparePasswordResetPayload {
  email?: string;
}

const PASSWORD_RESET_RATE_LIMIT = 3;
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;

function userHasPasswordProvider(user: admin.auth.UserRecord): boolean {
  return user.providerData.some((p) => p.providerId === 'password');
}

async function enforcePasswordResetRateLimit(email: string): Promise<void> {
  const db = admin.firestore();
  const emailHash = crypto.createHash('sha256').update(email).digest('hex');
  const ref = db.doc(`passwordResetRate/${emailHash}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      tx.set(ref, {
        count: 1,
        windowStart: now,
        expiresAt: admin.firestore.Timestamp.fromMillis(now + PASSWORD_RESET_WINDOW_MS),
      });
      return;
    }
    const data = snap.data()!;
    const windowStart = Number(data.windowStart) || 0;
    let count = Number(data.count) || 0;
    if (now - windowStart > PASSWORD_RESET_WINDOW_MS) {
      tx.set(ref, {
        count: 1,
        windowStart: now,
        expiresAt: admin.firestore.Timestamp.fromMillis(now + PASSWORD_RESET_WINDOW_MS),
      });
      return;
    }
    if (count >= PASSWORD_RESET_RATE_LIMIT) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many reset attempts. Try again in a few minutes.'
      );
    }
    tx.update(ref, { count: count + 1 });
  });
}

/**
 * Prepares password reset for Google-only Auth users by linking a password provider.
 * Client then calls sendPasswordResetEmail. Unauthenticated — user is logged out when resetting.
 */
export const preparePasswordReset = functions
  .region('us-central1')
  .https.onCall(async (data: PreparePasswordResetPayload) => {
    const email = data?.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid email is required.');
    }

    await enforcePasswordResetRateLimit(email);

    try {
      const authUser = await admin.auth().getUserByEmail(email);
      if (!userHasPasswordProvider(authUser)) {
        const tempPassword = crypto.randomBytes(32).toString('base64url');
        await admin.auth().updateUser(authUser.uid, { password: tempPassword });
      }
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        return { ok: true };
      }
      if (e instanceof functions.https.HttpsError) throw e;
      console.error('preparePasswordReset', e);
      throw new functions.https.HttpsError('internal', 'Could not prepare password reset.');
    }

    return { ok: true };
  });

const HUB_IDS = [
  'uncommon_kuwadzana',
  'uncommon_belvedere',
  'uncommon_victoriafalls',
];

/** 1st of each month 02:00 Africa/Harare — rollup previous month awards per hub. */
export const rollupMonthlyAwards = functions
  .region('us-central1')
  .pubsub.schedule('0 2 1 * *')
  .timeZone('Africa/Harare')
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${period}-01`;
    const lastDay = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
    const endDate = `${period}-${String(lastDay).padStart(2, '0')}`;

    const attendanceSnap = await db
      .collection('attendance')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const usersSnap = await db.collection('users').get();
    const students = usersSnap.docs.filter((d) => {
      const t = String(d.data().userType || '').toLowerCase();
      return t === 'attendee' || t === 'student';
    });

    for (const hubId of HUB_IDS) {
      const hubStudents = students.filter((d) => {
        const h = String(d.data().hubId || '').trim();
        return h === hubId || (!h && hubId === LEGACY_HUB);
      });
      const studentIds = new Set(hubStudents.map((d) => d.id));
      const roster = hubStudents.map((d) => ({
        id: d.id,
        name: String(d.data().displayName || d.data().name || 'Student'),
      }));

      const counts = new Map<string, { present: number; late: number; name: string }>();
      roster.forEach((s) => counts.set(s.id, { present: 0, late: 0, name: s.name }));

      attendanceSnap.docs.forEach((docSnap) => {
        const r = docSnap.data();
        if (!studentIds.has(r.studentId)) return;
        const h = String(r.hubId || '').trim();
        if (h && h !== hubId && !(h === '' && hubId === LEGACY_HUB)) return;
        if (h === '' && hubId !== LEGACY_HUB) return;
        if (h && h !== hubId) return;
        const day = r.date as string;
        if (!day || day < startDate || day > endDate) return;
        const status = String(r.status || '').toLowerCase();
        const row = counts.get(r.studentId);
        if (!row) return;
        if (status === 'late' || status.includes('late')) row.late++;
        else if (status === 'present' || status === 'completed') row.present++;
      });

      const leaders = [...counts.entries()]
        .map(([studentId, c]) => {
          const total = c.present + c.late;
          return {
            studentId,
            studentName: c.name,
            present: c.present,
            late: c.late,
            attendanceRate: total > 0 ? Math.min(100, total * 10) : 0,
          };
        })
        .sort((a, b) => b.present + b.late - (a.present + a.late))
        .slice(0, 3)
        .map((row, i) => ({ ...row, rank: i + 1 }));

      await db.doc(`monthly_awards/${period}_${hubId}`).set({
        period,
        hubId,
        hubName: hubId,
        winners: leaders,
        computedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await db.doc(`hub_monthly_stats/${period}`).set({
      period,
      startDate,
      endDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  });
