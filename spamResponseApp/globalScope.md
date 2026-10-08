# Spam Response App: Global Legal Scope

Companion to `usLegalScope.md` (US detail), `screeningAndDistribution.md`, and `dataSources.md`. Status: first global research pass, **October 2026**. This is not legal advice. ⚠️ = verify against primary law or a regulator before relying on it.

There are two separate global questions:
1. **Where the spam comes from (origin).** A large share of call and text spam is placed from offshore call centers and routed through international gateways. What leverage does a recipient have against a caller in another country?
2. **Where users live (destination).** If the app works outside the US, each user's *home* country decides what remedies they have, and it adds obligations for the app operator.

---

## 1. Summary

**Users rarely have a practical claim against a foreign caller directly.** Leverage comes from four places, and the app should send every report to whichever of them apply:

| Leverage point | Why it works across borders | Examples |
|---|---|---|
| **1. The domestic beneficiary** (seller, brand, lead buyer) | The company paying the offshore call center is usually domestic and **liable for its agents** | US TCPA vicarious liability; UK/EU: the "instigator" of marketing is liable under PECR / ePrivacy; GDPR controller liability |
| **2. The domestic network entry point** (gateway carrier, SMS aggregator) | Foreign calls and texts must enter the domestic network through a regulated provider | US gateway-provider rules + Robocall Mitigation Database + Industry Traceback Group; UK Ofcom spoofed-number blocking; Australia's scam calls code + SMS Sender ID Register; Singapore's SMS Sender ID Registry; India's DLT registry |
| **3. Data-protection rights** (trace *how they got your number*) | GDPR / UK GDPR / LGPD / CCPA access rights force the seller and data brokers to disclose their sources | GDPR Art. 15 access request → Art. 21 objection → Art. 82 compensation; California **DROP** deletes from all registered brokers at once |
| **4. Regulators and cross-border enforcement networks** | Regulators share cases internationally. Volume and good documentation get campaigns prioritized | econsumer.gov (ICPEN), UCENet, FTC international cooperation, GSMA 7726 reporting, origin-country police (e.g., India's CBI joint operations with the FBI / Interpol) ⚠️ |

**For the product:** the "campaign graph" from `dataSources.md` has to be **country-neutral** (E.164 numbers, ISO country codes, origin vs. destination). The **response engine** then maps each user's home jurisdiction to a separate rule set.

---

## 2. Origin side: spam from other countries

### 2.1 How cross-border spam reaches phones
- Offshore call center → VoIP wholesale carrier → **domestic gateway provider** → terminating carrier → user. The caller ID is often **spoofed to a local number** (neighbor spoofing) or a number belonging to an unrelated real business or person.
- Texts arrive through international SMS aggregators ("grey routes"), email-to-SMS gateways, OTT apps (WhatsApp, Telegram, Viber), RCS, and iMessage.
- Real-estate, insurance, solar, debt-relief, and "lead generation" campaigns often use offshore agents to qualify leads, then **hand them to a domestic seller**. That handoff is the attribution point.

### 2.2 Legal hooks against foreign-origin traffic (by destination country)
| Destination | Hook | Status |
|---|---|---|
| **US** | Truth in Caller ID Act extended to calls from outside the US (RAY BAUM'S Act, 2018). Gateway providers must do STIR/SHAKEN, respond to traceback within 24 hours, "know your upstream provider," and block on FCC notice. Non-compliant providers are **removed from the Robocall Mitigation Database**, after which other carriers must block them (first "RoboBlocking" order: One Eye LLC, 2023) | In force since 2022–23. ⚠️ Check for 2024–26 changes (FCC Docket 22-174) |
| **UK** | Ofcom rules on blocking calls from abroad that present UK caller ID. PECR applies to anyone marketing to UK subscribers | ⚠️ Confirm Ofcom's current blocking rules for international calls spoofing UK mobile numbers |
| **Canada** | CRTC requires STIR/SHAKEN and network blocking of calls with clearly invalid numbers. CRTC is reviewing its Unsolicited Telecommunications Rules (Notice 2026-132, June 2026) | Consultation closed Aug 2026; a decision is pending ⚠️ |
| **Australia** | Reducing Scam Calls and Scam SMs industry code (carriers block spoofed numbers). **SMS Sender ID Register live from 1 July 2026**: unregistered alphanumeric sender IDs show as "Unverified," and non-participating providers are blocked | In force |
| **Singapore** | Mandatory SMS Sender ID Registry: unregistered senders are labeled "Likely-SCAM" | In force ⚠️ |
| **India** | DLT blockchain registry for commercial senders and templates (TRAI TCCCPR). Unregistered telemarketers are disconnected | In force; amended Feb 2025 |
| **EU** | Member-state telecom regulators (e.g., Germany's BNetzA) enforce number misuse and can order numbers shut off. CLI spoofing rules vary by country ⚠️ | Varies |

### 2.3 What the app does with foreign-origin evidence
- **Classify it** as likely foreign-origin: STIR/SHAKEN missing or failed, international or invalid caller ID, non-fixed VoIP numbers that turn over fast, sender IDs that are labeled "Unverified" / "Likely-SCAM," or scripts that match known offshore campaigns.
- **Report it** to the destination regulator, traceback programs, **econsumer.gov** (the multi-country consumer complaint portal run by ICPEN members), and 7726 or the local equivalent.
- **Follow the money:** the landing page, callback number, payment processor, or the domestic seller the lead is handed to. That's where a user's legal claim actually is.
- **Don't** tell users to sue a foreign call center. Service abroad (the Hague Service Convention), enforcing a judgment, and jurisdiction make it impractical for individuals.

---

## 3. Destination side: remedies by user's country

| Jurisdiction | Main laws | Do-not-call list | Text/SMS covered? | **Individual's remedy** | Regulator / reporting |
|---|---|---|---|---|---|
| **United States** | TCPA, TSR, state mini-TCPAs (see `usLegalScope.md`) | National DNC Registry + state lists | Partly (contested after 2026 *Steidinger*) | **Statutory damages $500–$1,500 per violation**, small claims. The strongest private remedy worldwide | FTC, FCC, state AGs, 7726 |
| **Canada** | Unsolicited Telecommunications Rules (CRTC), CASL (electronic messages incl. SMS) | National DNCL | Yes (CASL) | **Weak.** CASL's private right of action was never brought into force. Mostly complaints | CRTC (DNCL complaints), Spam Reporting Centre, 7726 |
| **United Kingdom** | PECR, UK GDPR, Data (Use and Access) Act 2025 | Telephone Preference Service (TPS) | Yes (PECR reg. 22: prior consent for marketing texts, with a "soft opt-in" exception) | **Compensation claims** for damage/distress under PECR reg. 30 and UK GDPR Art. 82 (county court **small claims track**). Subject access requests | ICO (now formally the **Information Commission**, from 30 Sept 2026): PECR fines up to **£17.5M or 4% of turnover** since Feb 2026. Ofcom (silent/abandoned calls). 7726 |
| **European Union** (baseline) | ePrivacy Directive Art. 13 (consent for automated calls, SMS, email); GDPR | National "Robinson" lists vary | Yes (consent) | **GDPR**: Art. 15 access ("where did you get my number?"), Art. 17 erasure, Art. 21 objection to direct marketing (absolute), **Art. 82 compensation** (the CJEU says non-material harm counts with no seriousness threshold: *Österreichische Post*, C-300/21, 2023). **European Small Claims Procedure** for cross-border EU claims up to €5,000 | National data protection authority (DPA) complaint (free, binding procedure); national telecom and consumer regulators |
| **Germany** | UWG §7 (phone advertising to consumers needs **prior express consent**; §7a requires keeping consent records); GDPR | — | Yes | GDPR Art. 82; civil **injunctive** claims against repeat cold callers; Art. 15 access requests | BNetzA (complaints about unlawful calls and number misuse; fines up to €300k) ⚠️; state DPAs |
| **France** | Consumer Code L223-1 as rewritten by **Law 2025-594**: **opt-in for telephone sales calls since 11 Aug 2026**. Bloctel abolished. Consent valid **≤ 1 year**, proof kept 3 years, available to the consumer on request | Bloctel **ended** (replaced by opt-in) | SMS: covered by ePrivacy consent rules | Ask for the **proof of consent** (the caller must produce it); GDPR rights; contracts concluded in breach can be voided | DGCCRF (fines up to €375k for companies); **SignalConso** reporting; CNIL; 33700 (SMS spam reporting) |
| **Australia** | Spam Act 2003 (SMS/email: consent, identification, unsubscribe); Do Not Call Register Act 2006; Scams Prevention Framework (2025) ⚠️ | Do Not Call Register | Yes (Spam Act) | **No private damages.** ACMA enforcement and infringement notices | ACMA (spam SMS reporting by forwarding to 0429 999 888 ⚠️), Scamwatch |
| **India** | TRAI TCCCPR 2018 (amended Feb 2025: complaint window 7 days, tighter consent rules, penalties on telecom operators); DPDP Act 2023 (phasing in) | National Customer Preference Register (DND via **1909** / TRAI DND app) | Yes | Complaint-driven (sender disconnection). Consumer commissions for losses | TRAI / telecom operators; DoT **Sanchar Saathi / Chakshu** (fraud reporting) |
| **Brazil** | Anatel rules: telemarketing must use the **0303** prefix, plus blocking of abusive high-volume callers ⚠️; LGPD; Consumer Defense Code | **Não Me Perturbe** | Partly | LGPD rights (access, deletion); consumer claims in small-claims courts (Juizados Especiais) | Anatel, Procon, consumidor.gov.br, ANPD |
| **Singapore** | PDPA Do Not Call provisions; SMS Sender ID Registry | DNC Registry | Yes | ⚠️ The PDPA has a private right of action. Confirm it covers DNC breaches | PDPC, ScamShield app |
| **Others (to research)** | Japan (Specified Commercial Transactions Act; Specified Email Act covers SMS), South Korea (Information and Communications Network Act), Mexico (REPEP / PROFECO), Philippines (SIM Registration Act 2022), UAE, South Africa (POPIA + National Opt-Out Registry) | — | — | — | — |

### 3.1 What this means
- **The US is unusual:** it's the only big market where an individual can collect **fixed statutory damages** for a single unwanted call or text. Elsewhere, the individual's tools are **data-protection rights + compensation for proven harm + regulator complaints**.
- **GDPR-style access requests are the best global tool for *tracing*** where the data came from. A user who sends a GDPR Art. 15 request to the seller learns the **source of their number** (Art. 15(1)(g)), often a lead broker, who gets the next request. That chains back through the data supply. The equivalents are UK GDPR, LGPD, California CCPA "right to know," and California DROP for deletion.
- **Collective redress outside the US** runs through **qualified entities** (EU Representative Actions Directive, consumer groups like vzbv, UFC-Que Choisir, Which?), not class actions. **Partnering with consumer organizations** is the global version of "attorney handoff."

---

## 4. Global obligations for the app operator

| Area | Obligation | Notes |
|---|---|---|
| **Data protection** | GDPR / UK GDPR apply to EU and UK users regardless of where we're based (Art. 3(2)). Needs an EU/UK **representative** (Art. 27), a lawful basis, a **DPIA** (large-scale processing of communications content), and data subject rights tooling | Messages contain **third parties'** data (senders, including real people). Minimize, classify on-device, and publish only aggregates |
| **International transfers** | EU→US needs the EU-US Data Privacy Framework (upheld by the EU General Court, *Latombe*, Sept 2025 ⚠️; appeal possible) or SCCs. UK uses its own bridge. India's DPDP and Brazil's LGPD have their own transfer rules | Consider **regional data storage** (EU, UK) for message content. The campaign graph shares only hashed or derived signals |
| **Shared spam database as hosted content** | **EU Digital Services Act**: hosting services need notice-and-action, statements of reasons, and complaint handling. The **UK Online Safety Act** may apply ⚠️ | No Section 230 outside the US |
| **Defamation** | Much stricter outside the US (e.g., UK Defamation Act 2013: defendant bears the burden of proving truth). Labeling a spoofed number as a named company's is riskier in the UK and EU | Global default: **label behavior, not identity**; attribute only at high confidence (`dataSources.md` §6) |
| **Call recording / AI answer bots** | All-party consent is common outside the US (e.g., Germany's §201 StGB makes it a criminal offense to record the spoken word without consent). EU requires transparency for AI systems interacting with people (**EU AI Act Art. 50**, from Aug 2026 ⚠️) | Default global setting: no recording; any bot discloses that it's an AI and that the call is recorded |
| **Legal services rules** | Self-help templates and information are generally fine. Reserved activities vary (e.g., UK Legal Services Act: conducting litigation is reserved). Paying for referrals and taking a share of claims are restricted in many countries | Per-country template packs reviewed by local counsel; partner with consumer organizations and legal aid |
| **Platform** | iOS/Android capabilities are the same worldwide. **Android developer verification** starts in Brazil, Indonesia, Singapore, and Thailand (from Sept 30, 2026) *before* the US. **iOS alternative distribution exists in the EU** (and Japan ⚠️), but the sandbox limits are the same | See `screeningAndDistribution.md` |
| **Reporting short codes** | 7726 (US, UK, Canada, and others via GSMA), 33700 (France), 1909 (India), ACMA forward number (Australia), etc. | The app picks the right one by the user's SIM country |

---

## 5. Data sources outside the US (adds to `dataSources.md`)
- **Regulator publications:** UK ICO enforcement notices and fines (named companies, call volumes); CRTC DNCL enforcement decisions; ACMA enforcement actions; TRAI and DoT advisories; BNetzA number shut-off lists ⚠️; DGCCRF sanctions.
- **Cross-border complaints:** econsumer.gov publishes aggregate trend data. Individual complaints go to participating agencies.
- **Sender registries:** Australia's SMS Sender ID Register, Singapore's SMS Sender ID Registry, India's DLT headers. Their *labels* ("Unverified," "Likely-SCAM," DLT header prefixes) are strong classification signals the app can read from the message itself.
- **Commercial reputation:** Hiya, Truecaller, and TransNexus have global number-reputation coverage. Truecaller is especially strong in India, Africa, and the Middle East.
- **Company registries:** UK Companies House (free API, including directors: PECR fines can reach directors), EU national registers, OpenCorporates (global).

---

## 6. Suggested rollout order (by legal leverage × feasibility)

1. **US:** statutory damages make the litigation track worth it (already scoped).
2. **UK:** strong regulator, new big-fine regime, compensation claims, a small-claims track, UK GDPR access requests, Companies House API, 7726.
3. **EU, starting with France and Germany:** GDPR tracing chain; **France's new opt-in regime (Aug 2026)** makes "show me your proof of consent" a powerful, simple user action; Germany's strict UWG consent rule; DPA complaints. Needs EU representative + data storage.
4. **Canada and Australia:** reporting-focused (no meaningful private damages). The value is aggregation for regulators and sender-ID label signals.
5. **India and Brazil:** very large spam volumes and active regulators. Complaint and reporting workflows (1909 / Chakshu; Não Me Perturbe / Anatel); attribution data for cross-border cases going back to the US, UK, and EU.

---

## 7. Open questions for the next pass
1. Current FCC gateway / foreign-origin rules (Docket 22-174, 2024–26 changes).
2. Ofcom's current rules on blocking international calls that spoof UK numbers.
3. The French implementing decrees (call days and hours, consent formats) published around Aug 2026.
4. Whether Singapore's PDPA private action covers DNC breaches; Brazil's Anatel high-volume blocking rules.
5. Status of the EU AI Act Art. 50 transparency obligations for AI answer bots, and the DSA applicability threshold for a small hosting service.
6. A country-by-country review of GDPR Art. 82 damages awards for unsolicited marketing (typical amounts). Under UK GDPR, *Lloyd v Google* limits representative damages claims.
7. Partnerships: GSMA (7726 data), econsumer.gov / ICPEN, UCENet, national consumer organizations.

---

## Sources (secondary unless noted; verify against primary law)
- France opt-in: [Ministère de l'Économie](https://www.economie.gouv.fr/node/3241473), [WebLex](https://www.weblex.fr/weblex-actualite/demarchage-telephone-consentement-prealable-obligatoire), [UFC-Que Choisir](https://www.quechoisir.org/enquete-demarchage-telephonique-les-pros-dans-les-starting-blocks-n177078/), [Assemblée nationale QE 15858](https://questions.assemblee-nationale.fr/q17/17-15858QE.htm)
- UK: [ICO TMAC Ltd penalty (Feb 2026)](https://ico.org.uk/action-weve-taken/enforcement/2026/02/tmac-ltd-mpn/), [Decision Marketing](https://www.decisionmarketing.co.uk/news/brummie-business-bashed-for-barrage-of-badgering-calls), [RecordingLaw UK](https://www.recordinglaw.com/united-kingdom/data-privacy/nuisance-calls-and-marketing/)
- US gateway rules: [Perkins Coie](https://perkinscoie.com/insights/update/fcc-requires-gateway-providers-combat-foreign-based-robocalls), [Faegre Drinker](https://www.faegredrinker.com/en/insights/publications/2022/6/fcc-acts-to-curb-foreign-originated-illegal-robocalls-imposes-several-new-requirements-on-gateway-pr), [Telecompetitor (One Eye)](https://www.telecompetitor.com/its-a-first-fcc-tells-providers-to-cut-off-company-carrying-alleged-illegal-robocalls/)
- Canada: [CRTC Notice 2026-132 (primary)](https://crtc.gc.ca/eng/archive/2026/2026-132.htm), [CRTC DNCL report](https://crtc.gc.ca/eng/dncl/rpt250930/p1.htm)
- Australia: [ACMA SMS Sender ID Register (primary)](https://www.acma.gov.au/about-register), [ACMA telco fact sheet](https://www.acma.gov.au/sites/default/files/2025-11/Australian%20telcos%20-%20SMS%20Sender%20ID%20Register%20fact%20sheet.pdf)
- India: [Securiti](https://securiti.ai/india-spam-rules-trai-latest-amendment/), [Bar and Bench](https://www.barandbench.com/law-firms/view-point/trais-crackdown-on-spam-calls-and-ai-driven-telemarketing), [Mondaq](https://mondaq.com/india/telecoms-mobile-cable-communications/1607946/efforts-to-curb-spam-continue-trai-releases-second-amendment-to-the-tcccpr-2018)
- California DROP: [Malwarebytes](https://www.malwarebytes.com/blog/news/2026/08/californians-can-tell-data-brokers-to-drop-their-information), [Alston & Bird](https://www.alstonprivacy.com/drop-is-coming-due-what-californias-delete-act-means-for-data-brokers-in-august/), [TrustArc](https://trustarc.com/resource/california-delete-act-drop-platform-data-brokers/)
- Primary law to pull next: GDPR (Arts. 3, 15, 21, 27, 82); Directive 2002/58/EC Art. 13; UK PECR regs 21–24, 30; Code de la consommation L223-1; UWG §§7, 7a; Spam Act 2003 (Cth); TRAI TCCCPR 2018 as amended; CASL; Regulation (EC) 861/2007 (European Small Claims).
