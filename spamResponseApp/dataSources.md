# Data Sources: Using Existing Services to Get Reliable Data

Companion to `usLegalScope.md` and `screeningAndDistribution.md`. Status: research pass, October 2026. ⚠️ = confirm current availability, terms, and pricing.

**Principle:** user reports are noisy, so treat each one as a **claim**. Confidence comes from **independent sources agreeing**. Layer the data:

1. **Own first-party signal:** auto-captured app data (strongest per event, smallest volume)
2. **Government complaint data:** free, large, unverified, but independent of us
3. **Network / reputation data:** commercial, carrier-grade behavior signals
4. **Attribution records:** who owns the number, the brand, the domain, the license, the campaign money
5. **Legal history:** prior lawsuits and enforcement against the same entity

---

## 1. First-party data (what we control)

Collected automatically where the platform allows it (see `screeningAndDistribution.md`):
- Android `CallScreeningService`: number, timestamp, ring/answer/duration, and the **STIR/SHAKEN verification status** (passed / failed / none).
- iOS Message Filter "Report" and Android notification capture: message text, sender, URLs, timestamp.
- Voicemail audio (prerecorded or AI-voice detection, transcript, callback number).
- User attestations: personal use, on the DNC registry since [date], not a customer, STOP sent at [time].

**Reliability measures:**
- Hash and timestamp at capture (tamper-evidence).
- Per-reporter **trust score**: account age, how often their reports are corroborated, any disputes.
- Weight **auto-captured** events above manual entries.
- Defenses against coordinated fake reporting: rate limits, device attestation (Apple App Attest / Play Integrity), and flagging bursts of reports from new accounts.

## 2. Government complaint data (free)

| Source | What it has | Access | Use |
|---|---|---|---|
| **FCC Consumer Complaints** (Consumer Help Center) | Caller ID number, advertiser business number, call/message type, issue, date and time, state / ZIP; **no personal info**; unverified | opendata.fcc.gov dataset `3xyp-aqkj`, Socrata API. FCC says it updates **nightly** ⚠️ | Independent corroboration for numbers and "advertiser business numbers." Volume trends by campaign |
| **FTC Do Not Call Reported Calls data** | Originating number, date/time, consumer city / state / area code, subject, robocall flag; unverified | Published as data.gov files; the latest mirrors seen cover 2018–19 ⚠️ **check if still published**; the FTC DNC Data Book is annual | Historical corroboration; subject categories |
| **FCC enforcement and robocall actions** | Cease-and-desist letters to gateway providers, forfeitures, Robocall Mitigation Database (RMD) removals | fcc.gov notices; RMD is public | Map campaigns → **originating / gateway carrier** → known bad actors |
| **State AG Anti-Robocall Task Force** (all 51 AGs) | Named providers and campaigns under investigation, warning letters | AG press releases | Attribution and willfulness evidence |
| **Industry Traceback Group** (USTelecom) | Traceback results to the originating provider | **Not public.** Takes referrals from enforcement and partners | **Partnership target:** we send well-documented campaign packets, they trace. Their published reports name problem providers |

## 3. Network and reputation data (commercial)

| Source | What it offers | Notes |
|---|---|---|
| **Hiya, First Orion, TNS** (the carrier analytics engines behind "Spam Likely") | Number reputation scores based on network-wide calling behavior | Telnyx Number Reputation exposes Hiya-powered scores (0–100, US numbers, 100 per request). Direct licensing is possible but expensive ⚠️ |
| **TransNexus** reputation lookup | Robocall risk score built from honeypots, traffic flows, government data, and user feedback | API |
| **YouMail** (API + Robocall Index) | Spam likelihood from billions of calls handled; monthly national volume and top-offender estimates | The index is public; the API is licensed ⚠️ |
| **Number lookup** (e.g., Twilio Lookup Line Type Intelligence, Telnyx, carrier LNP/CNAM lookups) | **Current carrier**, line type (mobile / landline / fixed VoIP / **non-fixed VoIP**), CNAM | Non-fixed VoIP plus a cluster of numbers = signs of rotation. The carrier of record is who you subpoena |
| **URL / domain reputation** (Google Safe Browsing, VirusTotal, URLhaus, PhishTank; RDAP / WHOIS) | Whether a link in a text is phishing or malware; domain registration date and registrar | Separates **scam** (report it, don't engage) from **marketing** (legal response). Brand-new domains are a strong spam signal |

These scores **help decide when to block**. They are **not evidence** of who is behind a call. Keep that separation in the data model.

## 4. Attribution (who is behind it)

This is the step existing blockers skip, and it's what turns a pile of reports into a defendant:

| Category | Source | What it tells you |
|---|---|---|
| Any seller | **State telemarketer registrations**: Texas SOS (SB 140 registration + bond), Florida FDACS telemarketing license, others ⚠️ list | Registered or not. **Unregistered = a violation in itself** in some states |
| Any business | Secretary of State business filings, OpenCorporates | Legal entity name, registered agent (who you serve the lawsuit on) |
| Texts with links | Landing pages: privacy policy, "powered by," form vendors, consent language | The **lead generator → seller chain** (vicarious liability). The consent text shows whether any "consent" they claim is real |
| Short codes / 10DLC | Short-code owner lookup ⚠️ (The Campaign Registry 10DLC data is **not public**) | The brand behind a short code. For 10DLC, report abuse to carriers, who can see the brand |
| **Political** | **FEC API** (api.open.fec.gov): campaign **disbursements** to texting, robocall, and phone vendors; state campaign-finance databases | Which campaign paid **which vendor**, and when. Lines up with message timing to identify the sender |
| **Real estate** | County deed and recorder data (who buys property), state real estate commission license lookup, wholesaler registrations ⚠️ | Identifies "we buy houses" operators and whether they're licensed |
| Debt collectors | State collection-agency license lookups, CFPB complaint database (public API) | License status; complaint history |

## 5. Legal history

| Source | Use |
|---|---|
| **CourtListener / RECAP API** (free; federal dockets) and PACER (paid) | Prior TCPA / FDCPA suits against the same entity. **Prior suits and settlements show "knowing / willful" conduct** (trebled damages). Also names counsel who have handled them |
| FCC / FTC / state AG enforcement history | Same purpose, plus attribution |
| CFPB complaint database | Patterns for debt collection and finance-related callers |

---

## 6. Blending it: confidence tiers

| Tier | Requirement | App behavior |
|---|---|---|
| **Reported** | One or more of our user reports | Shown only to the reporter; no shared labeling |
| **Corroborated** | Several independent trusted reporters, **or** our reports + FCC/FTC complaints, **or** + a high commercial reputation score | Shared caller-ID label ("Reported by 37 users: real-estate offer"); auto-block only if the user opted in |
| **Campaign-linked** | Content fingerprint (template / script / URL / callback number) links several numbers | Block by **content pattern**; label shows campaign, not company |
| **Attributed** | Seller identified through §4 sources (named in message, landing-page chain, registration, FEC disbursement) | Company name shown; legal templates unlocked with the seller pre-filled |
| **Actionable** | Attributed + the user's own evidence satisfies a claim in their jurisdiction (`usLegalScope.md`) | Escalation ladder: complaint → demand letter → small claims |

**Spoofing guard:** if STIR/SHAKEN failed or is missing, or the number belongs to an unrelated real business or person, **never attribute based on the number alone**. Attribute by content instead.

## 7. Legal and terms constraints on using these sources

- **Don't scrape** community sites (800notes, WhoCallsMe, etc.) or competitors' apps. It breaks their terms and risks Computer Fraud and Abuse Act / contract claims. License the data or partner instead.
- Commercial reputation data usually comes with **use restrictions** (no redistribution, no "evidence" use). Read the license.
- Government data is public domain but **unverified**. In court, use it as corroboration and to show notice and willfulness, not as proof by itself.
- Line-type and CNAM lookups for numbers that *called the user* are fine. Don't build lookups of **individuals** (FCRA, state privacy laws).
- FEC data has a **legal restriction**: contributor names can't be used for soliciting or commercial purposes (52 U.S.C. § 30111(a)(4)). Use **disbursement** (vendor) data, not contributor lists.

## 8. Partnership targets (ranked)

1. **FCC open data API** (free, nightly): integrate on day one.
2. **CourtListener API** (free): willfulness evidence on day one.
3. **FEC API** (free): the political module.
4. **Number lookup** (Twilio / Telnyx, pay-per-lookup): line type + carrier.
5. **Hiya / YouMail / TransNexus** (licensed): reputation scores once there's funding.
6. **Industry Traceback Group / state AG task force:** send campaign packets. That builds credibility and data flowing back.
7. **Academic robocall honeypot researchers:** data sharing and validation of the confidence model.

---

## Sources

- FCC complaint data: [FCC complaint data page](https://www.fcc.gov/node/46), [dataset metadata (3xyp-aqkj)](https://data.amerigeoss.org/dataset/cgb-consumer-complaints-data1), [Center for Data Innovation](https://datainnovation.org/2015/11/calling-out-the-robocallers/)
- FTC DNC reported calls: [data.gov FTC catalog](https://catalog-old.data.gov/organization/federal-trade-commission?page=2), [example weekly dataset](https://data.amerigeoss.org/dataset/do-not-call-dnc-reported-calls-data-2-1-19-2-7-191)
- Reputation: [Telnyx Number Reputation (Hiya-powered)](https://developers.telnyx.com/docs/branded-calling/number-reputation), [TransNexus](https://transnexus.com/reputation-service/), [YouMail API](https://appdevelopermagazine.com/youmail-launches-new-api-to-help-block-annoying-robocalls/), [Robocall Index](https://robocallindex.com/726/2021/may)
- To confirm: Twilio Lookup docs; api.open.fec.gov; CourtListener API; Texas SOS telemarketing registration search; Florida FDACS telemarketing license search; CFPB complaint database API.
