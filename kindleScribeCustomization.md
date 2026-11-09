# Kindle Scribe Customization

Research snapshot as of November 2026: what people are modding on the Kindle Scribe, ranked roughly by how much discussion each topic gets in mod directories, guides and tech news.

> Caveat: this ranking is inferred from mod listings (kindlemodshelf, kindlemodding.org), how-to guides, Hacker News and news coverage. I could not pull a direct Reddit ranking from r/kindlescribe.

---

## 1. Jailbreak + KOReader (the main topic, by far)

Almost every mod below depends on a jailbreak, and the most common reason to jailbreak is to install **KOReader**. KOReader is an open-source reader that handles EPUB, PDF, DjVu, CBZ, FB2 and other formats, offers much finer control over layout and PDF reflow, and has a large plugin ecosystem.

**Which Scribe can be jailbroken right now:**

| Model | Status (as of the latest guides, Aug 2026) |
|---|---|
| Scribe 1st gen (2022) | **Vera** jailbreak: firmware 5.17.1 to 5.19.6 |
| Scribe 2nd gen (2024) | **Vera** jailbreak: firmware 5.17.3 to 5.19.6 |
| Scribe 3rd gen (2025) | No public jailbreak |
| Scribe Colorsoft (Dec 2025) | No public jailbreak |

- **Vera** (Aug 2026) is the newest method. It runs entirely on the Kindle, with no computer needed.
- **WinterBreak** was patched in firmware 5.18.1. **AdBreak** exploits the lock-screen ad system, and Scribes ship without ads, so it never applied to them.
- **Sanctuary** (browser-based, June 2026) covers firmware 5.16.4 to 5.18.3 only.
- Common practice: stay in airplane mode and block OTA updates, because an Amazon update can close the exploit.
- Risk: a bad install can brick the device. Everyone says to read the kindlemodding.org guide first.

**Big Scribe-specific gotcha:** KOReader does **not** support pen annotation out of the box. The stock Notebooks and book annotation features keep working after a jailbreak, so people end up running both side by side.

## 2. Pen-aware homebrew (the most Scribe-specific scene)

Because KOReader ignores the pen, the most Scribe-specific work is in filling that gap:

- **kindle-koreader-apps** (GitHub, Mcp20091): a suite of KOReader plugins that turns a jailbroken Scribe into a small system of its own:
  - launcher and library
  - handwritten **Notes** with pen tools, search, export and OneNote sync
  - pen-solved **crosswords**
  - Microsoft To Do, Home Assistant dashboard, Wikipedia, Syncthing, SSH
  - a web server for managing the Kindle from a phone
  - optional AI handwriting-to-text (Claude, Gemini, Ollama, and others)
- **Grimoire**: a handwriting notebook for the Scribe with 9 pens, sheet music and tab paper, and PDF export (beta, tested on the 2024 Scribe).
- **Kindle AbiWord**: a word processor for the Scribe (alpha).
- Drawing apps: **Kreate**, and **KPaint** (Game Boy-style).

## 3. Sleep screens and removing Amazon UI

- **Custom Screensaver**: custom sleep-screen images without KOReader or KUAL. Works on firmware 5.16.3 and newer and doesn't touch system files.
- **CoverSleep**: shows the current book cover while the device sleeps.
- Themed packs: for example, the Pokédex set of all 151 Kanto Pokémon.
- **Remove Amazon Ads & UI**, **Home Screen Shortcuts**.
- Sources for screensaver art: r/kindlescreensavers, Gumroad packs.

## 4. KOReader theming and patches

- **ProjectTitle**: a cover-grid library view.
- **ZenOS**: a replacement home page, library and controls.
- **Hand-Drawn UI**: a sketchy, hand-drawn theme.
- The **KOReader Patches Library** of userpatches, such as a page header patch.
- **Boot KOReader Automatically**: skips the Amazon UI entirely.

## 5. Games, emulators and utilities

- Games: Game Boy emulators (Gambatte-K), chess, Wordle, Simon Tatham's Puzzle Collection, interactive fiction (Frotz, Gargoyle).
- Study and focus: KAnki flashcards, KPomo timer, InkSights reading stats.
- Networking and shell: KTerm terminal, Tailscale VPN, full-screen web browser, KindleCron.

## 6. No-jailbreak customization (what most owners actually do)

- **Custom notebook templates**: PDF planners, Cornell notes, grids, music staff, games. Huge Gumroad and Etsy market. Limitation: PDF templates have a fixed page count, unlike native notebooks.
- **Custom fonts**: copy .ttf/.otf files into the `fonts` folder over USB. They show up in the Aa menu. They work on AZW3/KFX but not MOBI.
- **Calibre + Send to Kindle**: for converting and sideloading books.
- **Show book cover on lock screen**: a stock setting on ad-free models.

## 7. Hardware mods

- **Third-party EMR pens**: Lamy AL-star EMR and Wacom One are known to work (MobileRead wiki). Cheap generic 4096-pressure-level EMR pens are widely sold. EMR pens are battery-free, so most Wacom-EMR styluses are candidates.
- **Paper-feel screen protectors** (3mk, Doodroo, CoBak, MoKo): reviews are split. Some love the added drag; others hit bubbles, or find the stock screen already fine.
- **Nib swaps**: replacement tips are cheap and shared across Amazon's pens, and people try softer, higher-friction nibs for more "paper" feel.

---

## Speed and efficiency: what actually helps

Ordered by impact. In 2026, the Kindle software version mattered more than any tweak.

### 1. Be on a good software version (biggest factor)

| Version | Reported behavior |
|---|---|
| 5.18.6 | Severe UI lag |
| 5.19.2 (Feb 2026) | Fixed the lag but caused fast battery drain |
| 5.19.3 (Mar 2026) | **Pulled within hours**: drained a full charge in hours, slow page turns |
| 5.19.3.0.1 | Replacement for all Scribe models. Users report battery and smoothness back to normal (Amazon hasn't confirmed) |

- Check your version under Settings > Device Info.
- There is **no rollback**, and a factory reset does **not** revert the software version.
- Jailbreak tension: blocking updates also blocks fixes. On a 2022 or 2024 Scribe, get onto a good version that Vera still supports (it goes up to 5.19.6) *before* jailbreaking and blocking updates. (I haven't verified how 5.19.4 to 5.19.6 perform.)

### 2. Fix stuck indexing (a hidden cause of battery drain and slowness)

1. Search a random string on the home screen, then open "Text in Books" to see which titles aren't indexed.
2. Delete any stuck title and download it again. Keep a copy of sideloaded files before deleting them.
3. To avoid it: add big libraries in batches, and leave the Scribe charging until indexing finishes.

### 3. Stock housekeeping

- **Full restart**: hold the power button about 40 seconds. This clears stuck background processes.
- **Free storage**: remove large files from the device. Amazon purchases can be downloaded again.
- **Don't bulk-download while reading.** It competes for the processor.
- **Use airplane mode while reading or writing** for better battery, and to avoid surprise updates.
- **Wi-Fi/sync lag**: Settings > Advanced Options > Reset > Reset Network Settings.
- **Heavily annotated books** drain the battery faster.

### 4. Jailbroken-only tweaks

- **Launch KOReader with "stop framework"**: shuts down Amazon's UI to free RAM. The trade-off is a slower exit back to the stock UI. Pairs with **Boot KOReader Automatically**.
- **Turn off KOReader plugins you don't use**, such as Battery Statistics, HTTP Inspector and AutoTurn.
- **Block updates** with the renameotabin KUAL extension ("Rename OTA Binaries"). Restore them before any factory reset.
- **DISABLE_CORE_DUMP**: an empty file with this name in the Kindle's root folder reportedly stops crash dumps from filling storage (one user report).
- **System Monitor / StorageTool** (Kindle Mod Shelf): show what is using the processor or storage.
- **Remove Amazon Ads & UI**: removes clutter. I found no measured speed gain.

---

## Open threads

- Which Scribe do I have? That decides whether sections 1 to 5 are even possible.
- Watch kindlemodding.org for a 3rd-gen / Colorsoft exploit.
- The pen-aware KOReader scene is small and moving fast. It could be a place to contribute, or to build something of my own.

## Sources

- Vera jailbreak: https://blog.the-ebook-reader.com/2026/08/14/how-to-jailbreak-kindles-and-install-koreader-using-vera-video/
- 2026 jailbreak matrix: https://www.itechguides.com/this-is-the-kindle-jailbreak-guide-amazon-doesnt-want-you-to-read-but-it-isnt-universal/
- Sanctuary: https://terminalbytes.com/sanctuary-kindle-jailbreak-koreader-2026/
- AdBreak (excludes Scribe/Colorsoft): https://www.notebookcheck.net/First-WinterBreak-now-AdBreak-New-jailbreak-comes-to-select-Kindles.1129818.0.html
- Kindle Modding wiki: https://kindlemodding.org/
- Kindle Mod Shelf (mod directory): https://kindlemodshelf.me/
- kindle-koreader-apps: https://github.com/Mcp20091/kindle-koreader-apps
- KOReader on a Scribe, no pen annotation (HN): https://news.ycombinator.com/item?id=43079799
- Custom templates: https://www.techradar.com/tablets/i-gave-my-kindle-scribe-note-taking-super-powers-heres-how-you-can-too
- Custom fonts folder: https://blog.the-ebook-reader.com/2018/06/06/latest-kindle-software-update-5-9-6-adds-option-for-custom-fonts/
- EMR pens that work: https://wiki.mobileread.com/wiki/Kindle_Scribe
- Scribe 3rd gen / Colorsoft launch: https://techcrunch.com/2025/12/04/amazon-unveils-new-kindle-scribe-and-kindle-scribe-colorsoft
- 5.19.3.0.1 fix: https://www.techwalla.com/13779365/kindle-update-519301-fixes-battery-drain-and-adds-pdf-tools
- 5.19.x slowdown and battery drain: https://stuff.co.za/2026/04/01/kindle-caught-slacking-youre-not-alone/
- Stuck indexing fix: https://bgr.com/2159249/how-to-fix-kindle-battery-stuck-indexing-problem/
- General speed-up tips: https://www.bgr.com/2153426/how-to-speed-up-kindle-guide/
- KOReader on Kindle (stop framework launcher): https://github.com/koreader/koreader/wiki/Installation-on-Kindle-devices
- Blocking OTA updates on 5.11+: https://kindlemodding.org/jailbreaking/Legacy/post-jailbreak/disable-ota.html
- KOReader plugin trimming: https://kabirnayeem99.medium.com/jailbreaking-kindle-paperwhite-10th-gen-adbreak-7ebc807253b2
