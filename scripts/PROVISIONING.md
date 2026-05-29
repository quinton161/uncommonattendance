# Create staff and student accounts (no Blaze billing)

Cloud Functions need a paid Blaze plan. Use this **local script** on your computer instead — it uses the Firebase Admin SDK with a service account key (free on Spark).

## One-time setup

1. Open [Firebase Console](https://console.firebase.google.com/project/uncommonattendance/settings/serviceaccounts/adminsdk) → **Project settings** → **Service accounts**.
2. Click **Generate new private key** and save the JSON file.
3. Save it as `scripts/serviceAccountKey.json` in this repo (the file is gitignored — **never commit it**).
4. From the project root, dependencies are already installed (`firebase-admin` is in `package.json`).

## Create a user

```bash
npm run provision:user -- --email student@example.com --name "Student Name" --role attendee --hub uncommon_kuwadzana --send-reset
```

### Roles

| `--role` | `--hub` | Notes |
|----------|---------|--------|
| `admin` | Optional | Full app access (same as Firestore `userType: admin`) |
| `instructor` | Required | Hub-scoped staff |
| `attendee` or `student` | Required | Student account |

### Hub ids

- `uncommon_kuwadzana`
- `uncommon_belvedere`
- `uncommon_victoriafalls`

### Password

New users have **no password** until they set one:

- Run with `--send-reset` to print a password-reset link in the terminal, or
- Tell them to use **Forgot password** on the sign-in screen.

## Examples

```bash
# Student
npm run provision:user -- -e jane@school.com -n "Jane Doe" -r attendee -h uncommon_kuwadzana --send-reset

# Instructor
npm run provision:user -- -e coach@uncommon.org -n "Coach Name" -r instructor -h uncommon_belvedere --send-reset

# Admin
npm run provision:user -- -e admin@example.com -n "Site Admin" -r admin --send-reset
```

## Public sign-up

The app login screen supports **Create account** again for students and instructors. Use this script when you want to create **admin** accounts or pre-provision users without public registration.

## Optional: custom key path

```bash
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-key.json
npm run provision:user -- ...
```
