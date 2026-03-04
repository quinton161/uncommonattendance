// Firebase Admin SDK setup for deleting users
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://uncommonattendance.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();

async function deleteUsers() {
  const usersToDelete = ['bongelwa', 'ashely'];
  
  console.log('🔧 Starting deletion process for users:', usersToDelete);
  
  for (const username of usersToDelete) {
    try {
      console.log(`\n📋 Processing user: ${username}`);
      
      // Find user by display name or email
      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('displayName', '==', username)
        .get();
      
      if (snapshot.empty) {
        // Try searching by email
        const emailSnapshot = await usersRef
          .where('email', '==', `${username}@example.com`)
          .get();
        
        if (emailSnapshot.empty) {
          console.log(`⚠️ User ${username} not found in database`);
          continue;
        }
        
        var userDoc = emailSnapshot.docs[0];
      } else {
        var userDoc = snapshot.docs[0];
      }
      
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`👤 Found user: ${userData.displayName} (${userData.email}) - ID: ${userId}`);
      
      // Delete from all collections
      const collections = [
        'users',
        'attendance', 
        'dailyAttendance',
        'events',
        'registrations',
        'ticketTypes'
      ];
      
      let totalDeleted = 0;
      
      for (const collectionName of collections) {
        try {
          // Delete documents where user is referenced
          const collectionRef = db.collection(collectionName);
          
          // Query for documents related to this user
          const queries = [
            collectionRef.where('userId', '==', userId),
            collectionRef.where('studentId', '==', userId),
            collectionRef.where('organizerId', '==', userId),
            collectionRef.where('uid', '==', userId)
          ];
          
          for (const query of queries) {
            const querySnapshot = await query.get();
            
            for (const doc of querySnapshot.docs) {
              await doc.ref.delete();
              totalDeleted++;
              console.log(`  🗑️ Deleted from ${collectionName}: ${doc.id}`);
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Error processing ${collectionName}:`, error.message);
        }
      }
      
      // Delete user document
      await userDoc.ref.delete();
      totalDeleted++;
      console.log(`  🗑️ Deleted user document: ${userId}`);
      
      // Delete from Firebase Auth
      try {
        await auth.deleteUser(userId);
        console.log(`  🔐 Deleted from Firebase Auth: ${userId}`);
        totalDeleted++;
      } catch (authError) {
        console.log(`  ⚠️ Auth deletion failed: ${authError.message}`);
      }
      
      console.log(`✅ Completed deletion for ${username}. Total documents deleted: ${totalDeleted}`);
      
    } catch (error) {
      console.error(`❌ Error deleting user ${username}:`, error);
    }
  }
  
  console.log('\n🎉 Deletion process completed!');
  
  // Cleanup
  await admin.app().delete();
}

// Run the deletion
deleteUsers().catch(console.error);
