# Firestore rules — student attendance verification

Attendance (check-in, student dashboard, history) uses **Firestore only**. Deploy rules and indexes after changes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Test matrix

| Actor | Action | Collection | Expected |
|-------|--------|------------|----------|
| Student | read own today doc | `attendance/{date}_{uid}` | allow |
| Student | create check-in | `attendance` | allow (`studentId == auth.uid`) |
| Student | update checkout | `attendance` | allow (no prior `checkOutTime`, sets `checkOutTime`) |
| Student | check-in after staff absent row | `attendance` | allow (no prior `checkInTime`, sets `checkInTime`) |
| Student | create / update own row | `dailyAttendance/{uid}_{date}` | allow |
| Student | read another student's daily row | `dailyAttendance` | deny |
| Student | read own daily row | `dailyAttendance` | allow |
| Instructor | read hub attendance | `attendance` | allow (`isStaff`) |
| Instructor | write hub attendance | `attendance` | allow when hub scope matches |
| Admin | read / write attendance | `attendance` | allow |
| Any signed-in user | read notifications / monthly awards | `notifications`, `monthly_awards` | allow |
| Student | create check-in notification | `notifications` | allow (`create` when authenticated) |
| Staff | write monthly awards | `monthly_awards` | allow (`isStaff`) |
| Any signed-in user | mark notification read | `notifications` | allow (`update` only `readBy`) |

## Manual check (Firebase Console)

1. Sign in as a test student in the app.
2. Open Firestore → `attendance` → confirm doc id `{yyyy-mm-dd}_{uid}` appears after check-in.
3. Confirm `dailyAttendance` doc `{uid}_{yyyy-mm-dd}` with `isPresent: true`.
4. Check out in the app; confirm `checkOutTime` and `status: completed` on the same attendance doc.
5. As instructor, mark a student absent for today, then have that student check in — must succeed (no `permission-denied`).

## Rules emulator (optional)

```bash
firebase emulators:start --only firestore
```

Use the [Rules Playground](https://firebase.google.com/docs/firestore/security/test-rules-emulator) in the Emulator UI with paths and auth UIDs from your test users.

## Related code

- Rules: [`firestore.rules`](../firestore.rules)
- Indexes: [`firestore.indexes.json`](../firestore.indexes.json)
- Student real-time listener: `subscribeToTodayAttendance` in [`src/services/attendanceService.ts`](../src/services/attendanceService.ts)
- Student UI: [`src/components/Dashboard/StudentDashboard.tsx`](../src/components/Dashboard/StudentDashboard.tsx)
