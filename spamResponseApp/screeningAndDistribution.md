# Automatic Screening and Sideloading: Platform and Legal Scope

Companion to `usLegalScope.md`. Status: research pass, October 2026. ⚠️ = verify against current Apple/Google developer docs before building.

**The question:** can the app screen spam calls and texts **automatically**, logging evidence, classifying them (political / real estate / telemarketing), and starting the response flow, without the user doing it by hand? Does **sideloading** (installing outside the App Store / Play Store) unlock more?

**Short answer:**
- **Android:** yes, mostly, and you can do a lot **through the Play Store** without sideloading.
- **iPhone:** only partially. Apple's sandbox, not app store policy, is the limit, and **sideloading is not available in the US**. The iOS design has to lean on Apple's filter extensions plus user-shared evidence.

---

## 1. iPhone (iOS 26)

| Capability | API / feature | What a third-party app can do | What it can't do |
|---|---|---|---|
| Label / block calls by number | **Call Directory extension** (CallKit) | Ship a block list and caller-ID labels ("Likely spam: real estate offer"), updated from the pooled community database | See that a call happened, or log it automatically |
| Real-time caller lookup | **Live Caller ID Lookup** (iOS 18+; privacy-preserving server query) ⚠️ | Answer "who is this number?" from your server at ring time. Apple's design keeps the server from learning who is calling whom | Get the user's call log; the privacy design deliberately blocks you from logging |
| Filter texts from unknown senders | **Message Filter extension** (IdentityLookup, `ILMessageFilterExtension`) | Classify texts from **unknown senders** into Junk / Promotions / Transactions, either on-device or by deferring to your server | Read texts from contacts, read message history, export message content to the app, or reply STOP automatically |
| Built-in screening | iOS 26 **Call Screening** ("Ask Reason for Calling"), **Unknown Senders** inbox, Live Voicemail | Users turn it on. It works *alongside* your app | Hand transcripts or screening results to third-party apps |
| Report spam | Message Filter extensions can add a **"Report" action** that sends a reported message to your server (iOS 16+ unwanted-communication reporting) ⚠️ | **The main way to capture evidence on iOS**: the user taps "Report Junk" and the message goes to your backend | Run without the user's tap |
| Evidence capture | Share sheet, screenshots + OCR, voicemail export (share audio file) | Semi-automatic logging | Recording native calls (not allowed) |

**iOS design implication:** "automatic" on iOS means **automatic blocking and labeling powered by the community database**, plus **one-tap reporting** for evidence. Full automatic logging isn't possible.

### iOS sideloading
- **US: not available.** Alternative app marketplaces and web distribution exist only in the **EU** (Digital Markets Act, iOS 17.4+), and Apple checks location and account region. Japan's smartphone act opened a similar path in Dec 2025 ⚠️. The US *Epic v. Apple* outcome concerned in-app payment links ("anti-steering"), not sideloading.
- Developer certificates, TestFlight (90-day builds, 10k testers), and enterprise certificates are **not** legitimate consumer distribution channels. Enterprise misuse gets certificates revoked.
- **Even an EU sideloaded app still runs in the same iOS sandbox.** Sideloading doesn't unlock call-log or SMS access on iPhone, so it gains nothing for this use case.

---

## 2. Android

| Capability | API | Play Store? | Notes |
|---|---|---|---|
| Screen calls in real time | **`CallScreeningService`** (`ROLE_CALL_SCREENING`, Android 10+) | ✅ No restricted permissions needed | Sees the incoming number (and the STIR/SHAKEN verification status), can **reject, silence, or skip the call log**, and can log the event to the app. **No audio access.** You do not have to be the default dialer |
| Caller ID overlay | `CallScreeningService` + notification | ✅ | Label "Reported 214× · real-estate offer" |
| Read call history | `READ_CALL_LOG` | ⚠️ Restricted. Allowed only for default dialer / approved uses ("caller ID, spam detection and blocking" is a listed permitted use, but needs a **Permissions Declaration** and review) | Lets you backfill history for evidence |
| Read / auto-classify texts | `RECEIVE_SMS` / `READ_SMS` | ⚠️ Restricted to the **default SMS app** or approved exceptions (spam filtering has historically been hard to get approved) | The cleanest Play route is to **be the default SMS app**: a big build, but you get full classification, auto-STOP, and evidence capture |
| RCS / chat messages | Mostly inside Google Messages | ❌ No third-party API for reading RCS | A growing gap: more spam arrives over RCS |
| Notification listener | `NotificationListenerService` | ✅ Allowed with a disclosure | Can read the *notification text* of incoming SMS/RCS from any messaging app. A practical workaround for evidence capture, but Play reviews this use ⚠️ |
| Record calls | — | ❌ Blocked since Android 10 for third-party apps (accessibility workarounds are banned on Play) | Also the wiretap-consent issue, see §3 |
| Built-in competitors | Pixel Call Screen, on-device Scam Detection, Samsung Smart Call (Hiya), carrier apps (T-Mobile Scam Shield, Verizon Call Filter, AT&T ActiveArmor) | — | Complement them; don't compete. Your edge is the **legal response + pooled evidence**, not the blocking |

### Android sideloading
- **What it gets you:** no Play policy review of the restricted SMS and call-log permissions. A sideloaded app can request `READ_SMS` and `READ_CALL_LOG` as ordinary runtime permissions, with **full automatic logging of calls and texts** and automatic STOP replies.
- **What it doesn't:**
  - **Restricted settings** (Android 13+): sideloaded apps can't use accessibility or notification-listener access until the user manually allows it in App Info. ⚠️ Later Android versions may extend this to SMS permissions.
  - **Play Protect** may warn about or block apps that request SMS permissions.
  - **Developer verification (new):** starting **Sept 30, 2026** in Brazil, Indonesia, Singapore, and Thailand, with a **global rollout planned for 2027**, certified Android devices only install apps from **identity-verified developers**, sideloaded ones included. Unverified apps need the new **"advanced flow,"** which involves a one-time restart plus a 24-hour wait. ADB installs and de-Googled ROMs are exempt.
- **Recommendation:** register as a **verified developer** in any case. Ship a Play Store build using `CallScreeningService` + notification listener + share-to-app, and **optionally** a verified, directly distributed "power" APK (from your website or F-Droid-style repos) with full SMS and call-log access for users who opt in. Both should use the same backend.

---

## 3. Legal constraints on *automated* screening

| Automated action | Legal status | Design rule |
|---|---|---|
| Blocking / silencing calls and texts | User's own choice; lawful | — |
| Auto-labeling numbers from community reports | The defamation / spoofing risk from `usLegalScope.md` §5.2 is **amplified**: a wrong label now shows up on *every* user's screen at ring time | Label the *behavior* ("214 reports: real-estate offer"), not a named company, unless verified. Fast dispute / unblock path. Watch for numbers that are probably spoofed (STIR/SHAKEN failed or unverified) |
| Auto-replying **STOP** | Lawful, and it **creates evidence** (it starts the revocation clock and Florida's 15-day pre-suit timer). Users should *choose* this | Opt-in per category. Log timestamps. Don't reply to suspected **scam/phishing** texts (it confirms the number is live). Distinguish "spam to report" from "fraud to ignore" |
| AI **answering bot** (picks up, talks to the telemarketer to identify the seller) | ⚠️ **Recording / interception risk.** Bots that record or transcribe a two-way conversation run into all-party-consent states (CA, FL, IL, MD, MA, MT, NH, PA, WA, …). Some states (e.g., CA's CIPA) also cover third-party "eavesdropping," which can include a vendor's server | If you build one, play an **upfront disclosure** ("This call is screened and recorded by an automated assistant"). Keep the bot from saying anything that could look like **consent** ("yes," "sure, send info"). Prefer one-way capture (voicemail, iOS / Pixel built-in screening) |
| Uploading message content / caller numbers to your server | The user's own received messages are theirs to share. Caller **business** numbers aren't sensitive. Messages can contain **third-party personal data**, and texts from real people (not spam) can get swept in | Classify **on-device first**. Upload only messages the user marks or the classifier flags as commercial or political. Redact the user's PII. Disclose clearly (state privacy laws, App Store privacy labels, Play Data Safety) |
| Auto-filing complaints (FTC / FCC / 7726) on the user's behalf | Fine **with the user's authorization** for each filing or category. The complaint forms ask for user attestations, so don't file without the user | One-tap "file all pending complaints" review screen |
| Auto-generating demand letters at a trigger (e.g., text received after the STOP deadline) | The unauthorized-practice-of-law risk from `usLegalScope.md` §5.1. Automation makes it look more like legal advice | Notify and offer the template. The user reviews, edits, and sends |
| Bulk / shared lookups (Live Caller ID, Call Directory updates) | Fine; that's what the APIs are for | Rate-limit. Keep stored lookup logs to a minimum (pairs of who-was-called-by-whom are sensitive) |

**A note on accuracy:** courts and regulators will rely on the app's logs only if they can be trusted. **Auto-captured** records (Android `CallScreeningService` timestamps, STIR/SHAKEN verification status, reported messages with hashes) make **better evidence** than screenshots. That's an argument for doing as much automatically as each platform allows.

---

## 4. Recommended architecture (v1)

1. **Community spam graph (backend):** reports → numbers → campaigns → identified sellers (with a confidence level). This feeds every platform.
2. **iOS app:**
   - Call Directory (block and label)
   - Live Caller ID Lookup
   - Message Filter extension with **Report**
   - Share-sheet import for voicemails and screenshots
   - Encourages turning on iOS 26 Call Screening
3. **Android Play app:**
   - `CallScreeningService` (automatic call log + block/label)
   - notification listener for SMS/RCS text capture (opt-in)
   - share-to-app
4. **Android direct APK (optional, verified developer):**
   - full SMS / call-log access
   - optional default-SMS mode with auto-STOP
5. **Response engine:**
   - category classification (political / real estate / telemarketing / debt / scam)
   - jurisdiction rules from `usLegalScope.md`
   - pre-suit timers
   - complaint and letter templates, always sent by the user

---

## Sources

- Android developer verification / advanced flow: [9to5Google](https://9to5google.com/2026/08/18/google-gradually-rolling-out-androids-advanced-sideloading-ahead-of-developer-verification/), [Android Authority](https://www.androidauthority.com/android-developer-verification-rollout-sideloading-flow-3653395), [PBX Science](https://pbxscience.com/google-tightens-android-sideloading-but-isnt-banning-it/), [Beebom](https://gadgets.beebom.com/news/google-rolls-out-advanced-flow-to-make-sideloading-unverified-android-apps-harder)
- iOS 26 screening: [Apple World Today](https://appleworld.today/2025/09/how-to-set-up-call-screening-in-ios-26/), [OWC / MacSales](https://eshop.macsales.com/blog/97828-silence-of-the-spams-how-to-enable-ios-26-iphone-call-screening-filters/), [Mac Observer](https://www.macobserver.com/?p=431967)
- iOS EU alternative distribution: Apple developer docs, developer.apple.com/support/alternative-app-marketplace-in-the-eu
- To pull next (primary): Apple docs for CallKit `CXCallDirectoryProvider`, Live Caller ID Lookup, IdentityLookup `ILMessageFilterExtension` / unwanted-communication reporting; Android docs for `CallScreeningService`, `RoleManager`, Play "SMS and Call Log permissions" policy, Android Developer Verification.
