# Monthly Maintenance Checklist

Use this checklist once per month to keep the app current and stable.

## Quick Command

Run:

`npm run maintenance:monthly`

This runs:

1. Dependency drift check (`npm outdated`)
2. Security audit (`npm audit`)
3. Browser compatibility data refresh (`npx update-browserslist-db@latest`)
4. Verification tests + production build

## Manual QA (Critical Paths)

After updates, always verify these flows in the app:

1. Register a student account (email + Google).
2. Student check-in and check-out.
3. Admin Dashboard today counts.
4. Attendance page list and profile issue indicator.
5. CSV export for attendance.

## Update Strategy

1. Patch/minor updates first.
2. Major updates one at a time.
3. Re-run test/build after each major package update.
4. Keep changes in a dedicated maintenance branch.

## Optional Commands

- `npm run maintenance:outdated`
- `npm run maintenance:audit`
- `npm run maintenance:refresh-browsers`
- `npm run maintenance:verify`

