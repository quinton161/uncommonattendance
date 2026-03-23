/**
 * Firestore Database Cleanup Script
 * 
 * This script deletes ALL data from Firestore collections in the uncommonattendance project.
 * Use this to completely reset your Firestore database.
 * 
 * Project: uncommonattendance
 * 
 * ============================================================
 * OPTIONS TO RESET YOUR DATABASE:
 * ============================================================
 * 
 * OPTION 1: Use this script (recommended for partial cleanup)
 *    Run: npx ts-node firestore-cleanup.ts
 *    Or: npx ts-node firestore-cleanup.ts --dry-run (preview only)
 * 
 * OPTION 2: Delete ENTIRE database in Firebase Console (IRREVERSIBLE!)
 *    1. Go to: https://console.firebase.google.com/project/uncommonattendance/firestore/databases
 *    2. Click the three dots (⋮) next to the database name
 *    3. Select "Delete Database"
 *    4. Confirm by typing the database ID
 *    5. Create a new database (select a location like us-central1)
 * 
 * OPTION 3: Use built-in Master Reset in the app
 *    1. Log in as admin (quintonndlovu161@gmail.com)
 *    2. Go to Admin Dashboard
 *    3. Find the Master Reset option (usually in settings/profile)
 *    4. Type "reset" to confirm
 *    This keeps users but deletes attendance records
 * 
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration for uncommonattendance project
const firebaseConfig = {
  apiKey: "AIzaSyDlyRXx3aUhmsFx0iON1xDE1qGWorsdztc",
  authDomain: "uncommonattendance.firebaseapp.com",
  projectId: "uncommonattendance",
  storageBucket: "uncommonattendance.firebasestorage.app",
  messagingSenderId: "28326821265",
  appId: "1:28326821265:web:5b44ada2b7cba9a83bae30",
  measurementId: "G-6XGF42V4MH"
};

// Collections to delete (add any custom collections you have)
const COLLECTIONS_TO_DELETE = [
  'attendance',
  'users',
  'events',
  'registrations',
  'conversations',
  'messages',
  'dailyStatus',
  'stats'
];

interface FirestoreCleanupOptions {
  dryRun?: boolean;
  batchSize?: number;
}

async function getAllDocs(db: any, collectionName: string): Promise<any[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
}

async function deleteCollection(db: any, collectionName: string, options: FirestoreCleanupOptions = {}): Promise<number> {
  const { dryRun = false, batchSize = 100 } = options;
  
  console.log(`\n📦 Processing collection: ${collectionName}`);
  
  try {
    const docs = await getAllDocs(db, collectionName);
    console.log(`   Found ${docs.length} documents`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] Would delete ${docs.length} documents`);
      return docs.length;
    }
    
    if (docs.length === 0) {
      console.log(`   ✅ No documents to delete`);
      return 0;
    }
    
    // Delete in batches
    let deletedCount = 0;
    const batches = [];
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize).map(d => 
        deleteDoc(doc(db, collectionName, d.id))
      );
      batches.push(Promise.all(batch));
      deletedCount += batch.length;
      
      console.log(`   Progress: ${deletedCount}/${docs.length} deleted`);
    }
    
    await Promise.all(batches);
    console.log(`   ✅ Successfully deleted ${deletedCount} documents from ${collectionName}`);
    
    return deletedCount;
  } catch (error: any) {
    console.error(`   ❌ Error deleting collection ${collectionName}:`, error.message);
    return 0;
  }
}

async function confirmAction(): Promise<boolean> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n⚠️  Are you sure you want to delete ALL data from Firestore?\nType "DELETE" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'DELETE');
    });
  });
}

async function cleanupFirestore(options: FirestoreCleanupOptions = {}) {
  const { dryRun = false } = options;
  
  console.log('\n🔥 Firestore Database Cleanup Script');
  console.log('=====================================');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no data will be deleted)' : 'LIVE (data will be deleted)'}`);
  console.log(`Collections to process: ${COLLECTIONS_TO_DELETE.join(', ')}`);
  
  if (!dryRun) {
    console.log('\n⚠️  WARNING: This will permanently delete all data!');
    const confirmed = await confirmAction();
    if (!confirmed) {
      console.log('\n❌ Operation cancelled. No data was deleted.');
      return;
    }
  }
  
  console.log('\n🚀 Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  let totalDeleted = 0;
  
  for (const collectionName of COLLECTIONS_TO_DELETE) {
    const deleted = await deleteCollection(db, collectionName, options);
    totalDeleted += deleted;
  }
  
  console.log('\n=====================================');
  console.log(`✅ Cleanup complete! Total documents deleted: ${totalDeleted}`);
  
  if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run flag to actually delete data.');
  }
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-n');

cleanupFirestore({ dryRun: isDryRun })
  .then(() => {
    console.log('\n👋 Cleanup script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
