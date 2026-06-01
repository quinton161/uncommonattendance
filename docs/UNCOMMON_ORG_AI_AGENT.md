# Uncommon Organization AI — Attendance app focus

This repo is the **Uncommon Attendance** web app (Firebase + React). External automation (n8n, MCP, hub-ops webhooks) has been **removed** from the codebase.

| Layer | Where | Who uses it |
|-------|--------|-------------|
| **Builder AI** | Cursor in this repo | Developers | Ship features, fix bugs, deploy hosting |
| **Staff** | Admin / instructor dashboards in the app | Instructors & admins | Attendance, users, goals (read), events |

**Feature ideas:** [UNCOMMON_AI_TASKS.md](./UNCOMMON_AI_TASKS.md)

---

## What staff do in the app

- **Students:** `/dashboard` — check in/out, daily goal at check-in (or reuse goal from `/goals`).
- **Instructors / admins:** `/dashboard`, `/users`, `/attendance`, `/goals` (hub-scoped view), `/staff` (admins).

Harare timezone rules apply everywhere attendance is recorded.

---

## What developers run locally

```bash
npm install
npm start          # dev server
npm run build      # production build
npm run functions:build   # Cloud Functions (deleteStudentAuthUser, etc.)
```

Provision staff: `npm run provision:user`

---

## Security

- Do not commit `.env`, service account JSON, or MCP tokens.
- Do not put student exports in public folders.
- Confirm before destructive Firestore or Auth operations.
