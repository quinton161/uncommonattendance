# Uncommon AI — Task catalog (in-app)

Prioritized features for the **attendance app** (Firebase/React). External n8n/MCP automation is **not** part of this repo.

**Legend:** 🟢 UI/report only · 🟡 Needs new query or function · 🔴 Writes data (confirm first)

---

## P0 — Core product

| # | Task | Who | Notes |
|---|------|-----|-------|
| 1 | **Student check-in / check-out** | Student | Harare window; goal at check-in or from Goals page |
| 2 | **Goals board** | Student | Weekly + daily goals; staff read-only by hub |
| 3 | **Who hasn’t checked in today** | Instructor | Users / attendance pages |
| 4 | **Late arrivals today** | Instructor | After 9:00 Harare |
| 5 | **Hub-scoped dashboards** | Staff | Admin all hubs; instructor one hub |

---

## P1 — Attendance operations

| # | Task | Who | Notes |
|---|------|-----|-------|
| 6 | **Weekly hub summary** | Admin | Rates, trends in dashboard |
| 7 | **Absent 3+ school days** | Instructor | Follow-up list |
| 8 | **Low check-in by 10:00** | Instructor | Alert in UI |
| 9 | **Export weekly CSV** | Admin | Existing export tools |
| 10 | **Staff mark present / absent** | Instructor | Users page |

---

## P1 — Students & engagement

| # | Task | Who | Notes |
|---|------|-----|-------|
| 11 | **Goals board nudge** | Student | Remind if no goal this week |
| 12 | **Event reminder** | Student | In-app notifications |
| 13 | **Rankings digest** | Student | Rankings page |
| 14 | **New student welcome** | Student | After registration |

---

## P1 — Staff & admin

| # | Task | Who | Notes |
|---|------|-----|-------|
| 15 | **Promote instructor / admin** | Admin | Users page + Firestore rules |
| 16 | **Staff accounts** | Admin | `/staff` |
| 17 | **Monthly awards** | Admin | Medals / rankings |
| 18 | **Invalid @uncommon.org cleanup** | Admin | Users page tools |

---

## P2 — Later (optional)

| # | Task | Notes |
|---|------|-------|
| 19 | **Email daily brief** | Firebase scheduled function + Gmail API (if requested) |
| 20 | **Draft comms templates** | Admin UI; human sends |
| 21 | **Student help FAQs** | Static help page |

---

## Checklist (in-app)

### P0
- [x] Student dashboard check-in with goals
- [x] Goals board (student + staff view)
- [x] Admin / instructor hub scope

### P1
- [ ] Absent 3+ days report in admin UI
- [ ] Low check-in alert in admin UI
- [ ] Event reminders in-app

See [UNCOMMON_ORG_AI_AGENT.md](./UNCOMMON_ORG_AI_AGENT.md) for developer setup.
