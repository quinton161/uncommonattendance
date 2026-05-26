/**
 * Firestore hub registry seed script.
 *
 * Ensures `hubs/{hubId}` docs exist so hub dropdowns and scope behavior rely on
 * Firestore data exactly like other hubs (not only local fallbacks).
 *
 * Run:
 *   npx ts-node firestore-seed-hubs.ts
 */

import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

interface HubSeed {
  id: string;
  name: string;
  city: string;
  location: string;
  order: number;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing ${name}. Set REACT_APP_* Firebase vars before running this script.`
    );
  }
  return String(value).trim();
}

const firebaseConfig = {
  apiKey: env('REACT_APP_FIREBASE_API_KEY'),
  authDomain: env('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: env('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: env('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('REACT_APP_FIREBASE_APP_ID'),
  ...(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim()
    ? { measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID.trim() }
    : {}),
};

const HUBS: HubSeed[] = [
  { id: 'uncommon_kuwadzana', name: 'Nicki Keszler Innovation Hub', city: 'Harare', location: 'Kuwadzana 6 Primary School', order: 1 },
  { id: 'uncommon_dzivarasekwa', name: 'Dzikwa Trust Innovation Hub', city: 'Harare', location: 'Dzivarasekwa', order: 2 },
  { id: 'uncommon_mufakose', name: 'Mufakose Innovation Hub', city: 'Harare', location: 'Gwinyiro Primary School', order: 3 },
  { id: 'uncommon_warrenpark', name: 'Warren Park Innovation Hub', city: 'Harare', location: 'Warren Park 2 Primary School', order: 4 },
  { id: 'uncommon_kambuzuma', name: 'Kambuzuma Innovation Hub', city: 'Harare', location: 'Kambuzuma', order: 5 },
  { id: 'uncommon_mbare', name: 'Mbare Innovation Hub', city: 'Harare', location: 'Mbare', order: 6 },
  { id: 'uncommon_bulawayo', name: 'Nedbank Innovation Hub', city: 'Bulawayo', location: "Emganwini, hosted by Zara's Center", order: 7 },
  { id: 'uncommon_victoriafalls', name: 'Vincent Bohlen Innovation Hub', city: 'Victoria Falls', location: 'Chamabondo Primary School', order: 8 },
  { id: 'uncommon_gwayi', name: 'Gwayi Innovation Hub', city: 'Matabeleland North', location: 'Gwayi', order: 9 },
  { id: 'uncommon_jafuta', name: 'Jafuta Innovation Hub', city: 'Victoria Falls', location: 'Jafuta', order: 10 },
  { id: 'uncommon_gokwe', name: 'Gokwe Innovation Hub', city: 'Gokwe', location: 'Gokwe', order: 11 },
  { id: 'uncommon_chitungwiza', name: 'Chitungwiza Innovation Hub', city: 'Chitungwiza', location: 'Chitungwiza', order: 12 },
  { id: 'uncommon_sizinda_byo', name: 'Sizinda Innovation Hub', city: 'Bulawayo', location: 'Sizinda, BYO', order: 13 },
];

async function seedHubs() {
  console.log(`\nSeeding ${HUBS.length} hub docs to Firestore project "${firebaseConfig.projectId}"...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const hub of HUBS) {
    await setDoc(
      doc(db, 'hubs', hub.id),
      {
        name: hub.name,
        city: hub.city,
        location: hub.location,
        order: hub.order,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    console.log(`- Upserted hubs/${hub.id}`);
  }

  console.log('\nHub seeding complete.');
}

seedHubs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nHub seeding failed:', error);
    process.exit(1);
  });
