# Firestore Database Reset Guide

## ✅ What You Did (Option 1)

You deleted the old Firestore database in the **uncommonattendance** project. 

Now you need to deploy Firestore rules to your new database.

---

## What to Do NOW

### Step 1: Deploy Firestore Rules to New Database

Open your terminal and run:

```bash
firebase deploy --only firestore
```

This will deploy the security rules to your new database.

### Step 2: Deploy Storage Rules (Optional)

If your app uses file storage:

```bash
firebase deploy --only storage
```

### Step 3: Test the App

Your app should now work with the fresh database. Try:
1. Register a new user
2. Check in attendance
3. Verify data appears in the new database

---

## How to Check Your New Database

1. Go to: https://console.firebase.google.com/project/uncommonattendance/firestore/databases
2. You should see your new database
3. Click on it to view collections

---

## Troubleshooting

**App not connecting to new database?**

Make sure your Firebase config in [`src/services/firebase.ts`](src/services/firebase.ts) still points to:
- projectId: `uncommonattendance`
- authDomain: `uncommonattendance.firebaseapp.com`

If you created the database in a DIFFERENT project, you'll need to update these values.

**Getting permission errors?**

Run `firebase deploy --only firestore` to update the rules.

---

## That's It!

Your new database is ready. The app will work as before with a fresh empty database.
