# Data Connect / Postgres vs Firestore

## Source of truth for attendance

| Feature | Database |
|---------|----------|
| Check-in / check-out | **Firestore** (`attendance`, `dailyAttendance`) |
| Student dashboard (live status) | **Firestore** (`onSnapshot` on today's attendance doc) |
| Admin / instructor dashboards | **Firestore** |
| Events, registrations (app UI) | **Firestore** (`events`, `registrations`, etc.) |

The React app does **not** import Firebase Data Connect. All attendance writes go through [`src/services/attendanceService.ts`](../src/services/attendanceService.ts) and [`src/services/dailyAttendanceService.ts`](../src/services/dailyAttendanceService.ts).

## What Postgres is in this repo

The [`dataconnect/`](../dataconnect/) folder configures **Firebase Data Connect** with a Cloud SQL (PostgreSQL) instance. The GraphQL schema ([`dataconnect/schema/schema.gql`](../dataconnect/schema/schema.gql)) models users, events, and registrations — **not** daily attendance check-ins.

- `connectorDirs: []` — no Data Connect connectors are deployed.
- Postgres does **not** automatically receive student check-ins from the current app.
- Fixing or enabling Postgres is **not required** for students to check in or for the dashboard to update in real time.

## If you enable Postgres later

You would need a deliberate design: Data Connect connectors, mutations, and optional sync from Firestore (or a migration). That is a separate project from the Firestore rules and real-time student dashboard work.
