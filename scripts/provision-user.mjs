#!/usr/bin/env node
/**
 * Create Firebase Auth + Firestore user profiles without Cloud Functions (Spark plan).
 *
 * Setup: download a service account JSON from Firebase Console → Project settings →
 * Service accounts → Generate new private key. Save as scripts/serviceAccountKey.json
 * (never commit). See scripts/PROVISIONING.md.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'uncommonattendance';
const DEFAULT_KEY = resolve(__dirname, 'serviceAccountKey.json');

const HUB_IDS = new Set([
  'uncommon_kuwadzana',
  'uncommon_belvedere',
  'uncommon_victoriafalls',
]);

function usage() {
  console.log(`
Provision a user (Auth + Firestore users/{uid}) — no Blaze plan required.

Usage:
  npm run provision:user -- --email user@example.com --name "Full Name" --role attendee --hub uncommon_kuwadzana
  npm run provision:user -- --email admin@example.com --name "Admin User" --role admin
  npm run provision:user -- --email coach@uncommon.org --name "Instructor" --role instructor --hub uncommon_belvedere

Options:
  --email, -e     Required. Login email.
  --name, -n      Required. Display name (2+ characters).
  --role, -r      admin | instructor | attendee | student  (student = attendee)
  --hub, -h       Hub id (required for instructor and attendee)
  --send-reset    Print a password-reset link (user sets password before first sign-in)
  --key           Path to service account JSON (default: scripts/serviceAccountKey.json)

Hub ids: ${[...HUB_IDS].join(', ')}
`);
}

function parseArgs(argv) {
  const out = { sendReset: false, key: process.env.GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_KEY };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-?') {
      out.help = true;
      continue;
    }
    if (a === '--send-reset') {
      out.sendReset = true;
      continue;
    }
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--email' || a === '-e') out.email = next();
    else if (a === '--name' || a === '-n') out.name = next();
    else if (a === '--role' || a === '-r') out.role = next();
    else if (a === '--hub' || a === '-h') out.hub = next();
    else if (a === '--key') out.key = resolve(next());
  }
  return out;
}

function normalizeRole(raw) {
  const r = String(raw || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'instructor') return 'instructor';
  if (r === 'attendee' || r === 'student') return 'attendee';
  throw new Error(`Invalid --role "${raw}". Use admin, instructor, or attendee.`);
}

function initFirebase(keyPath) {
  if (!existsSync(keyPath)) {
    throw new Error(
      `Service account key not found: ${keyPath}\n` +
        'Download from Firebase Console → Project settings → Service accounts → Generate new private key.\n' +
        `Save as scripts/serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS.`
    );
  }
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || PROJECT_ID,
    });
  }
}

async function resolveHubName(db, hubId) {
  if (!hubId) return '';
  try {
    const snap = await db.doc(`hubs/${hubId}`).get();
    if (snap.exists) {
      const n = snap.data()?.name;
      if (n && String(n).trim()) return String(n).trim();
    }
  } catch {
    /* ignore */
  }
  return hubId;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  const email = args.email?.trim().toLowerCase();
  const displayName = args.name?.trim();
  const userType = normalizeRole(args.role);
  const hubId = args.hub?.trim() || '';

  if (!email || !email.includes('@')) {
    console.error('Error: --email is required.');
    usage();
    process.exit(1);
  }
  if (!displayName || displayName.length < 2) {
    console.error('Error: --name is required (2+ characters).');
    process.exit(1);
  }
  if ((userType === 'instructor' || userType === 'attendee') && !hubId) {
    console.error('Error: --hub is required for instructor and attendee roles.');
    process.exit(1);
  }
  if (hubId && !HUB_IDS.has(hubId)) {
    console.warn(`Warning: hub "${hubId}" is not in the known list; continuing anyway.`);
  }

  initFirebase(args.key);
  const auth = admin.auth();
  const db = admin.firestore();

  try {
    await auth.getUserByEmail(email);
    console.error(`Error: Auth user already exists for ${email}.`);
    process.exit(1);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') {
      throw e;
    }
  }

  const authUser = await auth.createUser({
    email,
    displayName,
    emailVerified: false,
  });

  const hubName = hubId ? await resolveHubName(db, hubId) : '';
  const profile = {
    uid: authUser.uid,
    email,
    emailLower: email,
    displayName,
    userType,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    photoUrl: null,
    bio: '',
    provisioned: true,
    provisionedBy: 'local-script',
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
      await auth.deleteUser(authUser.uid);
    } catch {
      /* ignore */
    }
    throw e;
  }

  console.log('\nCreated user successfully:');
  console.log(`  uid:      ${authUser.uid}`);
  console.log(`  email:    ${email}`);
  console.log(`  role:     ${userType}`);
  if (hubId) console.log(`  hub:      ${hubName || hubId} (${hubId})`);

  if (args.sendReset) {
    const link = await auth.generatePasswordResetLink(email);
    console.log('\nPassword reset link (send to user or open once):\n');
    console.log(link);
  } else {
    console.log('\nNext: user opens the app → Forgot password, or run with --send-reset to print a setup link.');
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message || err);
  process.exit(1);
});
