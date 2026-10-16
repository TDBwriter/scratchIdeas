# Barrett Household: AI Integration Audit

Planning notes. Nothing here is implemented yet. The personas, and the rules for what may be committed to this public repo, are in [householdPersonas.md](householdPersonas.md).

## Goal

Bring AI into how the household runs, set up like an audit: settle the scope, take stock of what exists, find the gaps and risks, then design and roll out in small steps that are easy to undo.

These notes work out **what** needs to be done. **Who** does each job is decided in the chat tab.

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
- [ ] Stage 1 work list agreed (draft below)

## Stage 1: what needs to be done

Draft for review. Each job lists when it recurs and what signals it. The inventory and gap phases will check each job against what happens today.

### Income

| Job | When | Signal |
|---|---|---|
| Record each income source and its expected pay dates | Setup; when a source changes | Pay stubs, offer letters |
| Confirm each deposit arrived and matches what was expected | Each pay date | Bank statement, deposit alerts by email |
| Track variable income (shifts, internships) against the budget | Monthly | Pay stubs, statements |
| Collect year-end tax forms | January–February | Email, mail, employer portals |

### Bills and recurring costs

| Job | When | Signal |
|---|---|---|
| Keep a register of every bill: due day, fixed or variable, autopay or manual, how the notice arrives | Setup; when a bill changes | Statements, email |
| Catch new bills and statements as they arrive | Continuous | Email, mail |
| Remind before each manual bill is due | Before each due date | Bill register |
| Confirm autopays went through | Monthly | Bank and card statements |
| Flag changes: higher amounts, new charges, missing statements | Monthly | Statements compared with the register |
| Review subscriptions and memberships | Quarterly | Card statements, email receipts |
| Plan for yearly and irregular costs (registrations, renewals, school fees) | Yearly, with a monthly set-aside | Last year's statements, email, calendar |

### Accounts and investments

| Job | When | Signal |
|---|---|---|
| Keep a list of accounts: type, purpose, access on file | Setup; when accounts change | Statements |
| Reconcile balances, transfers and budget actuals | Monthly | Statements |
| Check savings and retirement contributions happen as planned | Monthly | Statements, pay stubs |
| Review allocation and beneficiaries | Yearly | Account statements |
| Take a net worth snapshot | Yearly | All balances |

### Insurance, taxes and legal

| Job | When | Signal |
|---|---|---|
| Keep a register of policies: type, renewal date, deductible, coverage | Setup; at each renewal | Policy documents, email |
| Compare quotes before a policy renews | About 60 days before each renewal | Policy register, renewal notices by email |
| Assemble the tax packet: income forms, deductions, receipts | January–April | Email, mail, records |
| Track estimated tax payments, if any | Quarterly | Tax worksheet |
| Track expiration dates: IDs, passports, vehicle registrations | Ahead of each date | Records, renewal notices |
| Review wills, guardianship and powers of attorney | Yearly; after a major life change | Legal documents |

### Home and vehicle maintenance

| Job | When | Signal |
|---|---|---|
| Build an asset register: major systems, appliances, vehicles, with install or purchase date, warranty end and service interval | Setup; when something is replaced | Receipts, manuals, warranties |
| Schedule recurring maintenance (filters, HVAC service, gutters, smoke and CO detectors, oil changes) | By interval or season | Asset register, calendar |
| Run seasonal checklists | Spring and fall | Asset register |
| Act before warranties expire | Ahead of each end date | Asset register |
| Keep vehicle registration and inspections current | Yearly | Renewal notices, records |

### Repairs and projects

| Job | When | Signal |
|---|---|---|
| Log problems as they come up | As they happen | Household reports |
| Track each project: scope, quotes, budget, permits, status, warranty | Per project | Quotes and invoices by email, calendar for visits |
| Compare quotes | Per project | Quotes |
| Keep a vendor list with work history | Ongoing | Invoices, email |
| Keep a wish list, ranked by cost and urgency | Quarterly | Project log |

### Records

| Job | When | Signal |
|---|---|---|
| Set up one filing structure: statements, receipts, policies, warranties, titles | Setup | — |
| File new documents as they arrive | Continuous | Email, mail |
| Keep sensitive documents (IDs, insurance cards, tax returns) in secure storage | Setup; yearly check | Records |
| Decide how long to keep each document type, and clear out old ones | Yearly | Records |
| Make sure a second household member can find everything in an emergency | Setup; yearly check | Records |

### Across all areas

| Job | When |
|---|---|
| Review what's due in the next 14 days and anything new that needs a decision | Weekly |
| Monthly close: bills paid against bills due, budget actuals, contributions, anything missed | Monthly |
| Yearly review: taxes, renewals, asset register, net worth, legal documents | Yearly |

## Open questions for later phases

- Where the real data lives (not this repo): phase 4
- What AI may and may not do: phase 3
- What success looks like at 90 days

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-10-16 | Personas set by method: chat tab and code tab | Each tab gets its own job, access and way of responding |
| 2026-10-16 | Stage 1 is the household business; day-to-day operations come later | The household's call on what comes first |
| 2026-10-16 | The code tab works out what needs to be done; who does it is decided in the chat tab | The household's call on how the tabs divide the work |
