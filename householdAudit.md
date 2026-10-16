# Barrett Household: AI Integration Audit

Planning notes. Nothing here is implemented yet. The personas, and the rules for what may be committed to this public repo, are in [householdPersonas.md](householdPersonas.md).

## Goal

Bring AI into how the household runs, set up like an audit: settle the scope, take stock of what exists, find the gaps and risks, then design and roll out in small steps that are easy to undo.

## Stages

| Stage | Covers | Status |
|---|---|---|
| 1. Household business | Income, bills, accounts and investments, insurance and taxes, home and vehicle maintenance, repairs and projects, records | Current |
| 2. Day-to-day operations | Calendar coordination, groceries, meals, errands, chores, routines | Later |

In stage 1, calendars and email are read-only data sources. They show when bills, renewals, appointments and contractor visits land. Managing the calendar itself is stage 2.

## Audit phases

Each stage runs through the same phases:

0. Scope and ground rules
1. Inventory: what exists today
2. Gaps: what's missing, late or done by hand
3. Risks and safeguards
4. Design: what AI does, and what it can access
5. Rollout: one area at a time
6. Review rhythm

## Phase 0: Scope and ground rules (stage 1)

- [x] Scope: household business first, day-to-day operations later
- [x] Personas: chat tab and code tab (see [householdPersonas.md](householdPersonas.md))
- [ ] People: who decides, who does the work, who needs to know
- [ ] Where the real data lives (not this repo)
- [ ] What AI may and may not do
- [ ] What success looks like at 90 days

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-10-16 | Personas set by method: chat tab and code tab | Each tab gets its own job, access and way of responding |
| 2026-10-16 | Stage 1 is the household business; day-to-day operations come later | The household's call on what comes first |
