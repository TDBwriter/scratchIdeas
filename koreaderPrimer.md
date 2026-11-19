# KOReader Primer (for a Jailbroken Kindle Scribe)

## What it is

- **Open-source ebook and document reader built for e-ink**, licensed AGPL-3.0.
- Written mostly in Lua (LuaJIT). It has been around for over a decade and is actively developed. Releases are named by year and month, e.g. v2026.07.2.
- **Runs on many devices**: jailbroken Kindles, Kobo, PocketBook, Cervantes, reMarkable, Android and Linux.
- **On a Kindle it runs alongside Amazon's software.** I launch it from KUAL or a home-screen shortcut, and Amazon's reader and notebooks are still there.

## Formats

- **Reflowable** (text adjusts to the screen): EPUB, FB2, MOBI, DOC, RTF, HTML, CHM, TXT.
- **Fixed-page**: PDF, DjVu, CBZ, CBT.
- **Scanned PDFs and DjVu** can be reflowed into readable text columns with the bundled k2pdfopt.
- Some formats open straight from inside ZIP files.
- **Not supported**: Kindle Store purchases (DRM-locked).

## What it's good at

### 1. Typography and layout
- Fonts, plus my own fonts, with adjustable weight and contrast.
- Margins, line spacing, hyphenation dictionaries.
- **Style tweaks**: CSS switches per book or for all books, e.g. ignore a publisher's fonts, fix tiny tables, change paragraph indents.
- Page or scroll modes, footnote pop-ups, two columns in landscape.

### 2. PDFs on the big screen (where the Scribe shines)
- Automatic or manual margin cropping, zoom-to-column, and page-fit modes.
- Contrast boost for faint scans.
- Reflow for scanned books and papers.

### 3. Highlights and notes
- Typed highlights and notes, including highlights across several pages.
- **Export** to Markdown, HTML, Kindle-clippings format, and online services like Readwise and Joplin.

### 4. Looking things up
- StarDict dictionaries (install as many as I like).
- Wikipedia lookup, and Google Translate.
- **Vocabulary builder**: words I look up, ready for review; Anki export via a plugin.

### 5. Reading statistics
- Time per book, per day and per page, pages per hour, and a calendar view of reading streaks.

### 6. Control
- **Gestures**: map taps, swipes and multi-stroke swipes to almost any action, e.g. swipe up on the left edge for the frontlight, or a two-finger tap for the table of contents.
- **Profiles**: macros that switch several settings at once ("night reading", "PDF paper").
- **Quick menus**: my favourite actions on one gesture.

### 7. Library
- File browser, history, collections and cover view.
- Plugins like **ProjectTitle** give a richer cover-grid library.

### 8. Network
- **OPDS catalogs**: browse Calibre-Web, Kavita or Komga on the home server.
- **Cloud storage**: Dropbox, WebDAV, FTP.
- **Calibre wireless** connection.
- **Wallabag** read-later and **News downloader** (RSS feeds → EPUB).
- **Progress sync** (kosync): self-hostable, and works with Readest on the iPhone.
- **SSH server**, and updates to KOReader itself over Wi-Fi. These are separate from Amazon's updates, which stay blocked.

### 9. Extensible
- **Plugins** are folders named `*.koplugin`, written in Lua.
- **User patches** are small Lua files that change behaviour without a full plugin.
- Everything planned in this branch would be plugins: kindle-koreader-apps, Mission Control, Messages, Mail.

## Where it falls short on the Scribe

- **No built-in pen support.** Handwriting comes from plugins (kindle-koreader-apps Notes, Grimoire, GZreader). Ink currently trails the pen at **~150–250 ms vs ~30–60 ms** in Amazon's notebooks, because KOReader doesn't use the Scribe display's pen mode. A "Fast ink" patch is in progress but untested on a real Scribe.
- **Can't open Kindle Store books.**
- **Not reliably faster page turns** on the newest Kindles. There's an open 2026 report on the 2024 Paperwhite. Worth tuning the refresh settings.
- **Dense menus.** Powerful, but there's a learning curve. Change one area at a time.
- **Past Scribe quirk**: a landscape-orientation launch bug. Check that rotation behaves.

## Running it on the Kindle

- **Install**: after jailbreaking, install KPM and use it to install KOReader. The jailbreak guide covers this.
- **Launch**:
  - from KUAL, or from a home-screen shortcut
  - the **"stop framework"** launcher frees memory by shutting Amazon's UI while KOReader runs, but switching back is slower
  - **"Boot KOReader automatically"** exists. Leave it off while I still use Amazon's side.
- **Exit**: the menu → Exit returns to Amazon's home screen.

## First-day setup on the Scribe

1. **Screen refresh**: set how often a full refresh clears ghosting (e.g. every 6–10 pages). Then compare page-turn feel against the stock reader.
2. **Reading defaults**: pick a font, margins and line spacing; turn on hyphenation; save as the default for new books.
3. **Gestures**:
   - tap zones for page turns
   - an edge swipe for the frontlight
   - a gesture for the table of contents and one for bookmarks
4. **Dictionaries**: add one or two StarDict dictionaries.
5. **Plugins to turn on or add**:
   - Statistics (built in)
   - Progress sync to my own server
   - OPDS pointing at Calibre-Web
   - Wallabag
   - ProjectTitle
6. **Network** (needed for message pop-ups later): **don't** "disable Wi-Fi when inactive"; **do** "restore Wi-Fi on resume".
7. **Back up** KOReader's settings folder once it's set up the way I like.

## Docs

- KOReader on GitHub: https://github.com/koreader/koreader
- User guide: https://koreader.rocks/user_guide/
- Wiki (plugins, gestures, Kindle install): https://github.com/koreader/koreader/wiki/
- Kindle install notes: https://github.com/koreader/koreader/wiki/Installation-on-Kindle-devices
- Plugin roundup (third-party, 2026): https://boredom-at-work.com/best-koreader-plugins/
- Customization guide (third-party): https://informatecdigital.com/en/Complete-guide-to-Koreader-plugins-and-customization/
