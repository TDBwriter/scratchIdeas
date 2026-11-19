# Stock vs Jailbroken Scribe: Should Everything Move?

Short answer: **no, not everything.** The jailbroken side (KOReader plus homebrew apps) is **far more capable** for reading, customizing and connecting the Scribe to my other devices. It is **not more responsive**, and for **pen work it is clearly slower** today.

A jailbreak doesn't remove Amazon's software, so the right move is a split: use each side for what it does best.

---

## Head to head

| | Amazon stock software | Jailbroken (KOReader + suite) |
|---|---|---|
| **Page turns** | Fast and clean | Not reliably faster. A 2026 KOReader issue on the 2024 Paperwhite (same newer display-driver family) reports the stock reader turning pages noticeably faster and cleaner. It's still open and not yet diagnosed |
| **Pen ink latency** | **~30–60 ms** behind the pen | **~150–250 ms** behind, arriving in pieces (one developer's frame-by-frame video analysis). KOReader never switches on the Scribe display's special pen mode. A "Fast ink" patch exists in GZreader (a KOReader-based reader) but **hasn't been tested on a real Scribe** |
| **Notebooks and writing tools** | Mature: notebooks, writing in books (Active Canvas), handwriting → text, share by email | Young: kindle-koreader-apps Notes, Grimoire (beta), AbiWord (alpha) |
| **Kindle Store books** | Yes | **No.** Purchased books are DRM-locked (KFX) and KOReader can't open them. Removing DRM is unreliable, keeps changing, and is legally grey |
| **Formats** | Amazon formats, PDF, EPUB via Send to Kindle | EPUB, PDF (with reflow), DjVu, CBZ/CBR, FB2 and more |
| **Typography and layout** | A few fonts and spacing options | Almost everything: margins, hyphenation, CSS tweaks, custom fonts, PDF cropping and reflow |
| **Reading stats, dictionaries** | Basic | Detailed stats, several dictionaries, Wikipedia |
| **Connecting to my world** | Send to Kindle, email. On 2025+ models, Drive/OneDrive/OneNote, but those can't be jailbroken | OPDS/WebDAV/Syncthing to the home server, reading-progress sync to the iPhone, Wallabag, **Mission Control, message pop-ups, mail** |
| **Amazon extras** | Whispersync, X-Ray, Word Wise, Goodreads, AI features | Only what plugins add (WordDumb can build Word Wise/X-Ray files for my own books) |
| **Updates** | New Amazon features and fixes | OTA updates blocked, so the firmware stays frozen where I jailbroke it |

---

## The split I'd use

| What I do | Where |
|---|---|
| Books bought from Amazon | **Stock reader** |
| My own EPUBs and PDFs, technical PDFs, comics, read-later articles | **KOReader** |
| Long handwriting: journaling, sketching | **Stock notebooks for now.** Move only if a KOReader pen app passes the pen test below |
| Short handwritten replies (texts, email) | **KOReader**. The lag matters less for a line or two |
| Dashboards, Mission Control, message pop-ups, mail | **KOReader** (only possible there) |

### The pop-up trade-off

Pop-ups only appear inside KOReader. If I journal in Amazon's notebooks, messages wait and show up when I switch back to KOReader. My phone still buzzes as usual.

The other choice is journaling in a KOReader notes app and accepting slower ink until "Fast ink" is proven.

**Don't turn on "Boot KOReader automatically"** while I still use the stock side. Launch KOReader from KUAL, or with a home-screen shortcut, instead.

---

## One-week test before converting anything

1. **Pen test**: write the same paragraph in a stock notebook and in kindle-koreader-apps Notes (and GZreader with "Fast ink", if available).
   - Does the KOReader ink keep up?
   - Does it feel like writing on paper?
2. **Page turns**: read the same book in both for a day. Try KOReader's refresh settings: full-refresh interval and partial-refresh waveform.
3. **Battery**: note % used per day in each setup, especially with Wi-Fi left on for pop-ups.
4. **Ghosting**: check text crispness after 20 page turns in each.
5. **Stability**: note any crashes or freezes, including after rotating to landscape (a past Scribe issue).
6. **Decide each row of the split table** on what I saw, not on what's promised.

## Before jailbreaking

- Confirm the model (2022 or 2024) and that the firmware is in **Vera's range**. Prefer a version without the 2026 battery-drain bugs (see `kindleScribeCustomization.md`).
- Back up notebooks and personal documents.
- Plan to block OTA updates right after jailbreaking.

## Sources

- KOReader slower page turns on Paperwhite 6 (issue #16185): https://github.com/koreader/koreader/issues/16185
- Scribe pen-mode latency analysis and "Fast ink" patch (GZreader PR #280): https://github.com/9retirement6irk/GZreader/pull/280
- Older-Kindle speed claims and counter-reports: https://en.todoereaders.com/Complete-guide-to-koreader-for-e-readers.html, https://www.mobileread.com/forums/showthread.php?t=358481
- Kindle KFX DRM structure and changes: https://lwn.net/Articles/1016247/, https://akitaonrails.com/en/2026/07/30/removing-drm-from-kindle-ebooks-in-2026/
- Scribe landscape-orientation issue (#11743): https://www.github.com/koreader/koreader/issues/11743
- Native Scribe pen experience: https://www.engadget.com/mobile/tablets/best-e-ink-tablet-130037939.html
