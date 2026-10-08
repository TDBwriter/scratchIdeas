# Spam Response App: USA Legal Scope

**Working concept:** an iPhone and Android app where users log unwanted marketing calls and texts, pool what they collect (caller IDs, sender names, scripts, patterns, and which entity is behind a campaign), and use shared templates and evidence to take legal action on their own.

**Status:** first research pass, as of October 2026. This is a scoping document, not legal advice. Several of the core questions below are being argued in court **right now**. Before anything ships, a licensed attorney (ideally a TCPA practitioner) needs to review the items marked ⚠️.

---

## 1. Summary

| Lever | Who can use it | Value per violation | Status for **texts** (Oct 2026) | Status for **calls** |
|---|---|---|---|---|
| TCPA § 227(b): robocalls / prerecorded / autodialer | Any called party | $500, or up to $1,500 if willful | Texts count as "calls" here, but *Duguid* (2021) narrowed "autodialer" so much that most text claims fail | **Strongest federal claim**: artificial or prerecorded voice to a cell phone without consent |
| TCPA § 227(c)(5): National Do Not Call (DNC) and internal DNC | "Residential telephone subscriber" with more than 1 call in 12 months | $500 / $1,500 | ⚠️ **Split.** The 7th Cir. (IL, IN, WI) says texts are **not** covered. District courts elsewhere disagree | ⚠️ Whether a cell phone counts as "residential" is now contested after *McLaughlin* |
| State mini-TCPAs (FL, OK, MD, TX, WA, and others) | State residents (or numbers with a state area code) | Varies, about $500–$5,000 | Often explicitly cover texts, so this is **the growing lever** | Yes |
| FDCPA / Reg F (debt collectors only) | Consumer | Up to $1,000 per action plus actual damages and **attorney's fees** | Yes | Yes |
| FTC Telemarketing Sales Rule | Practically speaking, regulators only (private suits need more than $50k in damages) | n/a | Complaint only | Complaint only |
| Truth in Caller ID Act (spoofing) | FCC / state AGs only | n/a | Complaint only | Complaint only |
| Complaints (FTC, FCC, state AG, carrier 7726) | Anyone | $0 to the user, but feeds enforcement and tracebacks | Yes | Yes |

**What this means for the product:**
1. Litigation is fragmented by **state** and by **federal circuit**, so the app needs a jurisdiction engine: user's state + area code + federal circuit → available claims.
2. State laws now matter more than the federal DNC claim for **texts**.
3. The **call** side (prerecorded/AI-voice robocalls) is still on solid federal ground.
4. The shared, collaborative part creates its own legal risks for the **app operator**: defamation from spoofed numbers, unauthorized practice of law, lawyer-referral rules, and wiretap laws for recordings. See §5.

---

## 2. Federal law

### 2.1 Telephone Consumer Protection Act (47 U.S.C. § 227; 47 C.F.R. § 64.1200)

**§ 227(b): autodialed / artificial / prerecorded voice**
- Without prior express consent, it is unlawful to call a **cell phone** using an ATDS (autodialer) or an artificial or prerecorded voice. Marketing calls require prior express **written** consent.
- Prerecorded telemarketing calls to **residential landlines** also require consent.
- The FCC's 2024 declaratory ruling treats **AI-generated / voice-cloned** voices as "artificial." After *McLaughlin*, courts are not bound by that ruling, but its reasoning fits the plain text of the statute well.
- *Facebook v. Duguid* (U.S. 2021): an ATDS must use a random or sequential **number generator**. Most modern list-based dialers and SMS platforms don't qualify, which is why § 227(b) **text** claims are weak unless the text came from a truly random or sequential system.
- *Campbell-Ewald v. Gomez* (U.S. 2016) accepted that a text is a "call" for § 227(b).
- Private right of action: § 227(b)(3). $500 per violation, trebled to $1,500 if willful or knowing, plus an injunction.

**§ 227(c): Do Not Call**
- Requirements: the number has been on the National DNC Registry for 31 days or more; the user received **more than one** "telephone solicitation" from (or on behalf of) the same entity within 12 months; and the user is a "residential telephone subscriber."
- **Internal / company-specific DNC** (64.1200(d)): telemarketers must keep a written DNC policy, honor do-not-call requests, train staff, and identify the seller by name and give a phone number or address. Consumers can **demand a copy of the written DNC policy**, and failing to provide it is itself a violation in many courts. That makes it a useful, low-cost evidence step for the app.
- Calling hours: no telephone solicitations before **8 a.m. or after 9 p.m.** at the called party's local time (64.1200(c)(1)).
- Private right of action: § 227(c)(5). $500 / $1,500 per violation. Many courts also allow 64.1200(d) claims (internal DNC, identification) under this provision.
- ⚠️ **Texts:** *Steidinger v. Blackstone Medical Services*, No. 25-2398 (7th Cir. July 14, 2026) held that a text message is **not** a "telephone call" under § 227(c)(5). That is binding in IL, IN, and WI and persuasive elsewhere. District courts in other circuits are split (e.g., *Jones v. Blackstone*, C.D. Ill. 2025, and N.D./M.D. Fla. decisions against coverage; other courts in favor). Commentators expect a Supreme Court petition.
- ⚠️ **Cell phones as "residential":** this rested on a 2003 FCC presumption. After *McLaughlin*, courts are split: S.D. Fla. rejected the presumption, while N.D. Ga. (*Isaacs v. USHEALTH*, 2025) and D. Or. (*Wilson v. Hard Eight*) kept cell phones covered, especially where personal or home-like use is alleged. **App implication:** collect a user attestation that the number is personal / household use (not business).

**Exemptions and defenses the app must screen for**
- Prior express (written) consent. Users often "consented" through web lead forms, sweepstakes, or comparison sites. *Insurance Marketing Coalition v. FCC* (11th Cir. Jan. 2025) **vacated** the FCC's "one-to-one consent" rule, so a single form can still produce consent for many sellers.
- Established business relationship (DNC claims only): 18 months after a purchase or transaction, 3 months after an inquiry.
- Calls by or on behalf of tax-exempt nonprofits (DNC rules); political, survey, and purely informational calls are not "telephone solicitations." **But** § 227(b) still applies to political robocalls and prerecorded calls to cell phones.
- Debt collection is not telemarketing (use the FDCPA instead, §2.3).
- **Vicarious liability:** a seller is liable for telemarketers acting on its behalf (FCC *Dish Network* ruling 2013; *United States v. Dish Network*). This is central to the collaborative "who is really behind this campaign" feature.

**Consent revocation (current rules)**
- Consumers can revoke consent by **any reasonable means**: replying STOP, "quit," "end," "revoke," "opt out," "cancel," "unsubscribe," or similar. Senders must honor it within **10 business days** (effective April 11, 2025).
- The "revoke-all" provision (one opt-out covers unrelated message types from the same sender) has been **delayed to January 31, 2027** (FCC order DA 26-12, Jan. 2026), and an October 2025 FNPRM is reconsidering it. ⚠️ Watch this.

**Procedure**
- Statute of limitations: **4 years** (28 U.S.C. § 1658).
- Jurisdiction: state **or** federal court (*Mims v. Arrow Financial*, U.S. 2012). **Small claims court** works for individual claims in most states (typical caps are $5k–$12.5k; some states bar attorneys or business plaintiffs).
- Standing in federal court: the 11th Cir. en banc (*Drazen v. Pinto*, 2023) held that **a single unwanted text** is a concrete injury. Most circuits agree. State small-claims courts usually don't apply Article III at all.
- **No fee-shifting under the TCPA.** Lawyers take these cases on contingency, mostly as class actions. Individual users will often be pro se, which is the app's main use case.

**Big-picture risk: *McLaughlin Chiropractic v. McKesson* (U.S. June 20, 2025).** District courts are no longer bound by FCC interpretations of the TCPA. Anything that rested only on an FCC order (texts = calls for DNC, cell = residential, AI voice = artificial) can be relitigated. The app's claim logic must be **versioned and updateable by jurisdiction**, not hard-coded.

### 2.2 Telemarketing Sales Rule (FTC, 16 C.F.R. Part 310)
- Covers DNC, abandoned calls, robocall restrictions, caller ID transmission, and misrepresentations.
- Private suits exist (15 U.S.C. § 6104) only if damages exceed **$50,000**, so this is effectively complaint-only for individuals. Still worth filing at **reportfraud.ftc.gov** / **donotcall.gov**; the FTC uses complaint volume to target enforcement.

### 2.3 FDCPA and Regulation F (debt collectors)
- Private right: actual damages + up to **$1,000** statutory damages per action + **attorney's fees** (the fee-shifting makes lawyers more willing to take these). 1-year statute of limitations.
- Reg F: a presumption of harassment at more than 7 calls in 7 days about a debt; text and email opt-outs must be honored; no calls at inconvenient times (before 8 a.m. / after 9 p.m.).
- This is a separate "debt collector" track in the app.

### 2.4 Caller ID spoofing: Truth in Caller ID Act (§ 227(e)) and TRACED Act
- Spoofing with intent to defraud or cause harm is illegal, but there's **no private right of action**. Enforcement is by the FCC and state AGs.
- TRACED Act (2019): STIR/SHAKEN call authentication, plus the Industry Traceback Group (ITG) that traces illegal robocalls to their source. **App opportunity:** aggregated, well-documented reports can be passed to the FCC, state AGs, and the ITG. This is a "collective" action that has no litigation risk.
- Practical consequence: **the displayed number is often not the caller.** See §5.2 on defamation.

### 2.5 Other channels
- **Forward spam texts to 7726 ("SPAM")** for the carriers.
- FCC consumer complaints (consumercomplaints.fcc.gov), FTC, **state attorney general**, and state utility / public service commissions (some states run their own DNC lists).
- CAN-SPAM and the FCC wireless-email rule (64.3100) cover email-to-phone messages. They have almost no private right of action, so they're out of scope except for complaint routing.

---

## 3. State law (mini-TCPAs and related)

This is the fastest-moving area. Mark each row ⚠️ "verify current statute text" until counsel confirms.

| State | Law | Texts? | Private right / damages | Notes for the app |
|---|---|---|---|---|
| **Florida** | Telephone Solicitation Act, Fla. Stat. § 501.059 (amended 2023, HB 761) | Yes | $500, up to $1,500 if willful; attorney's fees | **Pre-suit step for texts:** reply **STOP**, then sue only if texts continue **more than 15 days** later. The 2023 amendments narrowed "autodialer" to "selects **and** dials" and limited class recovery. Calling hours 8 a.m.–8 p.m.; max 3 calls in 24 hours on the same subject |
| **Oklahoma** | Telephone Solicitation Act (2022) | Yes | $500, up to $1,500 if willful | Modeled on the original (pre-amendment) FTSA, so broad. "Automated system" is undefined. Max 3 contacts in 24 hours; Oklahoma area code presumes Oklahoma residence. Hours 8 a.m.–8 p.m. |
| **Maryland** | Stop the Spam Calls Act (eff. Jan 1, 2024) | Yes | Enforced through the Maryland Consumer Protection Act | Similar to FL/OK: consent required for automated sales calls, limits on call frequency and hours |
| **Texas** | Bus. & Com. Code ch. 302, as amended by **SB 140** (eff. Sept 1, 2025) | **Yes, explicitly** | Private suit through the DTPA. Sources differ on the per-violation statutory amount (cited as up to $1,500 or $5,000), plus trebling for knowing violations | Sellers must register with the Secretary of State and post a bond, so **"unregistered seller" is a checkable fact the app can look up.** Texts restricted to 9 a.m.–9 p.m. Mon–Sat, noon–9 p.m. Sun. Repeat suits are allowed if conduct continues |
| **Washington** | Commercial Electronic Mail Act, RCW 19.190 (texts: 19.190.060) | Yes (commercial texts) | Historically $500 per violation through the CPA. **Amended by ESHB 2274, effective June 11, 2026, which reduced damages** ⚠️ | Heavy litigation 2023–26 (incl. *Brown v. Old Navy*, Wash. 2025, on email subject lines). Confirm the post-amendment amounts |
| **Virginia** | Telephone Privacy Protection Act, Va. Code § 59.1-510 et seq. | ⚠️ verify | $500, up to $1,500 if willful, plus fees | Not confirmed in this research pass |
| **Others to research** | AZ, CT, IN, LA, NJ, NY, UT, GA, MI, CA | — | — | Many states have their own DNC lists, registration requirements, or text coverage. Needs a 50-state survey (task for the next pass) |

**Product requirements from state law:**
- Require each user to provide their state and a "personal / household use" attestation.
- Run state-specific **pre-suit workflows** (e.g., Florida's STOP + 15-day timer) inside the app, with timestamps.
- Check **calling-hour** and **frequency** violations automatically from logged timestamps in the *recipient's* time zone.

---

## 4. Collecting evidence lawfully (user side)

### 4.1 Recording calls (⚠️ high risk)
- Federal law and most states are **one-party consent**: the user may record a call they're on.
- **All-party consent** states (recording without everyone's consent can be a crime and/or create civil liability): **California, Delaware, Florida, Illinois, Maryland, Massachusetts, Montana, New Hampshire, Pennsylvania, Washington**, plus Connecticut (civil) and nuances in Michigan, Nevada, and Oregon. ⚠️ Verify the list.
- With interstate calls, the stricter state's law may apply (*Kearney v. Salomon Smith Barney*, Cal. 2006).
- **App default:** recording only with an **audible announcement** ("This call is being recorded"), or no recording at all. Prefer **voicemail capture** (prerecorded messages left on voicemail are strong § 227(b) evidence) and **post-call notes**.
- Platform reality: iOS doesn't allow third-party apps to record native calls; Android restricts it heavily. Recording would need a merge-in service line, which raises its own consent issues.

### 4.2 Texts and call logs
- Screenshots and exports of messages the user received are fine to keep and submit.
- iOS apps **can't read** the SMS inbox or call history. Options: the share sheet, screenshot + OCR, an iOS **Message Filter** extension (it can classify messages from unknown senders but can't read history), and a **Call Directory** extension (blocking and labeling).
- Android: Google Play restricts SMS and Call Log permissions to default handlers and approved exceptions. **Caller ID / spam detection** is a recognized permitted use, but it needs a Play policy declaration.

### 4.3 Things the app must not encourage
- **Baiting / "professional plaintiff" conduct.** In *Stoops v. Wells Fargo* (W.D. Pa. 2016), a plaintiff who bought dozens of phones to attract calls was held to lack standing. Serial-plaintiff discovery is also standard defense practice. The app shouldn't promote collecting phone lines or numbers to generate claims.
- **Faking consent or interest** to get the caller's identity. Asking "What company are you calling for?" or "Can you send me that in writing?" is fine. Inventing information or agreeing to buy can undercut the claim and may itself be fraud. Templates should give users **neutral identification scripts**.
- **Inflated or false filings.** These expose users to Rule 11 or state-equivalent sanctions and to counterclaims.

---

## 5. Legal risks for the app operator

### 5.1 Unauthorized practice of law (UPL)
- Generally safe: self-help **forms and templates**, general legal information, and "fill in your facts" document assembly. Texas expressly exempts software with a "not a substitute for a lawyer" disclaimer (Tex. Gov't Code § 81.101(c)). Other states are less clear.
- Risky: individualized advice ("you should sue X for $Y in Z court"), choosing legal strategy for the user, or representing that the app is a lawyer.
- **FTC v. DoNotPay** (final order 2025) penalized "robot lawyer" marketing as deceptive. **Avoid "AI lawyer" claims.** Frame features as "information + document tools," and bring in licensed attorneys for advice.
- ⚠️ If the app uses an LLM to draft demand letters or complaints, the UPL risk goes up. Get counsel's view per state, and consider an attorney-supervised model.

### 5.2 Defamation / false accusations in the shared database
- Spoofing means the **displayed caller ID often belongs to an innocent person or business**. Publicly labeling "555-1234 = Acme Insurance spammer" when the number was spoofed creates defamation and tortious-interference exposure.
- **Section 230** generally protects the app from liability for *user-posted* content, but not for content the app **creates or materially contributes** to (e.g., auto-generated "verified spammer" labels, editorial conclusions).
- Design: show "reported caller ID" separately from "identified seller." Promote to "identified seller" only with corroborating evidence (seller named in the call or text, a landing-page URL, a callback IVR naming the company). Provide a dispute / takedown process. Show report counts, not verdicts.

### 5.3 Lawyer referrals and monetization
- ABA Model Rules 5.4 (no fee-sharing with non-lawyers) and 7.2(b) (no paying for referrals except to qualified lawyer referral services) limit **charging lawyers per lead or taking a share of recoveries**. Flat advertising fees and subscriptions are usually OK. Rules vary by state.
- Taking a percentage of a user's TCPA recovery can trigger state **champerty / maintenance**, **barratry** (e.g., Tex. Penal Code § 38.12), and litigation-funding regulations.
- Aggregating users into a **class action** needs class counsel. Coordinated *individual* pro se suits are lawful, but "collaborative" features shouldn't amount to the app running mass litigation.

### 5.4 Privacy and data handling
- User data (phone numbers, message content, possibly voice recordings) is personal information under state privacy laws (CCPA/CPRA, VA, CO, CT, TX, etc.) and Apple/Google privacy-label requirements.
- Message content and recordings may also contain **third parties'** data. Minimize it: redact the user's own personal details before anything goes into the shared pool.
- Evidence integrity: hashes and timestamps help users authenticate exhibits (court rules on authentication: FRE 901 or state equivalents).
- Children: age-gate (COPPA). Litigation features should be 18+ in any case.

### 5.5 Arbitration clauses
- If the user has an account or relationship with the sender, their terms may require arbitration or bar class actions. The app should ask "Are you a customer of this company?" and flag it.

---

## 6. Escalation ladder (draft response playbook)

| Tier | Action | Legal basis | App asset |
|---|---|---|---|
| 0 | Log it: timestamp, number, content, screenshot or voicemail | Evidence | Capture flow + hashing |
| 1 | Report: forward to 7726, FTC / donotcall.gov, FCC, state AG | TSR, TRACED, state UDAP | One-tap prefilled complaints; anonymized pooled data to regulators and ITG |
| 2 | Opt out: reply STOP / say "put me on your do-not-call list" | Revocation rules; 64.1200(d); FL's 15-day pre-suit step | Script + timer; logs any messages after the opt-out |
| 3 | Demand the seller's **written DNC policy** and identity | 64.1200(d)(1),(4) | Letter template |
| 4 | Demand / settlement letter | TCPA, state mini-TCPA, FDCPA | Jurisdiction-aware template; evidence packet export |
| 5 | Small-claims filing | TCPA (concurrent jurisdiction), state laws | State-specific filing guides (information only) + evidence exhibits |
| 6 | Attorney handoff (fee-shifting statutes, class patterns) | FDCPA, FTSA, OTSA, TX DTPA | Opt-in attorney directory that follows the rules in §5.3 |

**Collaborative layer:** pooled reports identify the **same seller** behind many spoofed numbers. That supports vicarious-liability allegations, gives users shared exhibits (scripts, landing pages, registration lookups), and shows the **pattern evidence that supports "willful/knowing" treble damages**. Each user still files their own claim.

---

## 7. Open questions for counsel / next research pass

1. A 50-state table of mini-TCPAs, state DNC lists, text coverage, damages, pre-suit notice, and calling hours.
2. Post-amendment damages under Washington CEMA (ESHB 2274) and the exact Texas SB 140 statutory damages figure.
3. Has a cert petition been filed in *Steidinger*? Are other circuits pending on texts / § 227(c)(5) or on cell = residential?
4. Status of the FCC's revoke-all rule (Jan 31, 2027) and the October 2025 FNPRM. Any FCC "Delete, Delete, Delete" rollback of 64.1200 provisions.
5. UPL analysis of LLM-drafted demand letters and complaints in the launch states.
6. Whether sharing pooled caller data with the ITG, FCC, or AGs needs any specific terms or consents.
7. Insurance (media liability / E&O) for the shared-database defamation risk.
8. Whether a "personal use" attestation plus Florida-style pre-suit timers should be required before the app produces a demand letter.

---

## Sources (secondary summaries, Oct 2026; verify against primary law)

- 7th Cir. *Steidinger*: [Skadden](https://www.skadden.com/insights/publications/2026/07/7th-circuit-finds-that-the-private-right-of-action), [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/07/federal-appeals-court-holds-texts-are-not-telephone-calls), [Kirkland](https://www.kirkland.com/publications/kirkland-alert/2026/07/seventh-circuit-holds-text-messages-are-not-calls-under-the-tcpa), [Kelley Drye](https://www.kelleydrye.com/viewpoints/newsletters/tcpa-tracker/the-seventh-circuit-holds-text-messages-are-not-calls-under-tcpas-dnc-provision.md), [BakerHostetler](https://www.bakerlaw.com/insights/tcpa-update-seventh-circuit-rejects-private-right-of-action-for-text-messages-under-§-227c5/)
- District split on texts: [Kennedys](https://www.kennedyslaw.com/en/thought-leadership/article/2026/post-chevron-chaos-courts-split-on-whether-texts-are-calls-under-the-tcpa/), [Buchanan](https://www.bipc.com/another-court-holds-that-texts-are-not-%E2%80%9Ctelephone-calls%E2%80%9D-under-the-tcpa%E2%80%99s-do-not-call-rules), [NCLC best practices](https://library.nclc.org/article/best-practices-todays-fast-changing-tcpa-environment)
- Cell phones as residential: [TCPAWorld](https://tcpaworld.com/2025/06/25/the-death-of-presumption-are-cell-phones-still-residential-post-mclaughlin/), [Greenspoon Marder](https://www.gmlaw.com/news/s-d-fla-denies-tcpa-default-judgment-do-not-call-claims-face-headwinds-for-texts-and-cellphones/), [Troutman on *McLaughlin*](https://www.troutman.com/insights/why-does-the-tcpa-equal-chaos-the-us-supreme-court-opens-fcc-orders-to-new-challenges.html)
- FCC consent rules: [ActiveProspect](https://activeprospect.com/blog/fcc-one-to-one-consent/), [Krieg DeVault on the revoke-all delay](https://kriegdevault.com/insights/fcc-delays-compliance-date-for-part-of-new-tcpa-consent-revocation-rule/pdf)
- Texas SB 140: [Paul Hastings](https://www.paulhastings.com/insights/ph-privacy/marketing-texts-in-texas-sb-140-broadens-state-telemarketing-regulations), [Morgan Lewis](https://www.morganlewis.com/pubs/2025/09/texas-telephone-solicitation-law-now-covers-text-messages)
- Florida FTSA: [Greenspoon Marder](https://gmlaw.com/news/florida-enacts-significant-changes-to-states-telephone-solicitation-act), [Venable](https://www.venable.com/insights/blogs/2023/06/florida-limits-its-telemarketing-law-but-other-sta)
- Oklahoma OTSA: [Mintz](https://www.mintz.com/insights-center/viewpoints/2776/2022-06-28-tcpa-litigation-update-oklahoma-latest-state-enact-mini)
- Washington CEMA 2026 amendments: [Nat'l Law Review](https://natlawreview.com/article/washington-amends-cema-plaintiffs-rush-file-actions-june-11-2026-effective-date), [ESHB 2274 session law](https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Session%20Laws/House/2274-S.SL.pdf)
- State trend overview: [Goodwin 2025 Year in Review](https://www.goodwinlaw.com/en/insights/publications/2026/03/insights-finance-cfs-yir-telephone-consumer-protection-act), [ByteBack Law](https://www.bytebacklaw.com/2026/07/looking-back-on-the-last-year-of-state-level-tcpa-updates/)
- Primary law to pull next: 47 U.S.C. § 227; 47 C.F.R. § 64.1200; 16 C.F.R. Part 310; 15 U.S.C. § 1692 et seq.; 12 C.F.R. Part 1006; Fla. Stat. § 501.059; Tex. Bus. & Com. Code ch. 302; RCW 19.190.
