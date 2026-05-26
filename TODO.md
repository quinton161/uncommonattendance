# Uncommon Attendance - Futuristic Dashboard Redesign (Attendance-app structure)

## Goals
- Redesign Layout/navigation + key UI components.
- Fix AdminDashboard compile issues to preserve backend calls.

- Redesign Admin/Student/Event dashboards with `Layout`, `TopBar`, `GlassCard`, `StatCard`.
- Preserve backend functionality (QR, attendance check-in/out, events).
- Test build/tests + smoke flows.

## Steps
1. Inspect current routing + navigation flow.
2. Create `src/components/Common/TopBar.tsx` (if missing) and integrate into `Layout`.
3. Wire `Sidebar` items to React Router navigation (and derive active state from URL).
4. Update `src/App.tsx` routes so navigation renders the correct dashboard pages without changing backend calls.
5. Redesign `AdminDashboard` using `GlassCard`/`StatCard` and keep hub/QR/subscription logic identical.
6. Redesign `StudentDashboard` using `GlassCard`/`StatCard` and keep attendance check-in validation + service calls identical.
7. Redesign `EventDashboard` using `GlassCard` and keep `useEvent()` + check-in/out logic identical.
8. Verify TypeScript build + run tests (if configured).
9. Manual smoke testing:
   - Student check-in still works
   - Admin QR generation still works
   - Events still load and check-in/out still works

## Test Status
- `npm test`: FAILED (`src/App.test.tsx` expecting “sign in” heading, but auth screen rendered “Set a new password”).
- This appears unrelated to dashboard redesign; likely test fixtures/mocked router/auth state.


