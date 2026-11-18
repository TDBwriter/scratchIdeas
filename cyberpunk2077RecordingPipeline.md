# Recording Pipeline

How footage is recorded and exported. Part 1 is the "set and forget" checklist as it was pasted into the planning conversation, unchanged apart from Markdown formatting and plain hyphens in the two number ranges. Part 2 is a separate list of notes: where the checklist meets the project's other decisions, and what it leaves out. Nothing in Part 2 has been applied to Part 1.

---

## Part 1. The checklist, as pasted

Here is the complete "set and forget" checklist for Cyberpunk 2077, your recording software, and DaVinci Resolve so you can hit record on every quest without tweaking settings again.

### 1. Cyberpunk 2077 In-Game Settings

Configure these once in the main menu so your raw footage looks like a clean movie plate.

- **Graphics (Clean Image):**
  - Film Grain: Off
  - Chromatic Aberration: Off
  - Motion Blur: Off
  - Depth of Field: On (keeps background blur natural during conversations)
  - Lens Flare: Off (or Low, to prevent neon glare from washing out dark scenes)
- **Interface (Zero Clutter):**
  - Action Buttons, Minimap, Healthbar, Stamina & Oxygen, Ammo Counter, Boss Healthbars: Off
  - Job Tracker & Activity Log: Off (open your journal manually between scenes to check objectives, then cut that pause out)
  - Subtitles (Cinematic & Overhead): Off (you will generate clean .srt captions in DaVinci Resolve instead)
  - Damage Numbers & Hit Indicators: Off
  - Crosshairs: Off (or keep only the subtle center dot if needed for aiming)
- **Gameplay & Controls (Smooth Camera):**
  - Camera Movement / Head Bobbing: Reduced (prevents jarring screen shake while walking)
  - Mouse Sensitivity / Controller Look Sensitivity: Lower slightly so your camera pans feel smooth and deliberate rather than twitchy.
- **Sound (Clean Audio & Copyright Safety):**
  - Disable Copyrighted Music: On
  - Music Volume: 70% | SFX Volume: 85% | Dialogue Volume: 100% (gives DaVinci Resolve's AI crystal-clear voice isolation)

### 2. PC & Recorder Settings (Set & Forget)

Whether you use Steam Game Recording or NVIDIA App, lock in these baseline settings.

- **Windows Display:** Turn Windows HDR Off before launching the game unless you plan to color-grade HDR manually (SDR prevents washed-out blacks).
- **If Using Steam Game Recording:**
  - Mode: Record on Demand (bind an easy Start/Stop hotkey, plus Ctrl + F12 for Short markers).
  - Video Quality: Ultra / Highest.
  - Audio: Record Game Audio Only.
- **If Using NVIDIA App (Best Visual Quality):**
  - Resolution: In-game (1440p or 4K).
  - Frame Rate: 60 FPS.
  - Bitrate: 50-80 Mbps (prevents dark Night City alleys from turning blocky).
  - Audio Tracks: Single track (Game audio only, mic muted).

### 3. DaVinci Resolve Export Preset (Save Once)

In DaVinci Resolve's Deliver tab, configure these settings and click the three dots (...) at the top right to Save as New Preset (name it "YouTube 4K Cinematic").

- Format: MP4
- Codec: H.265 (or H.264 if on Free without hardware acceleration)
- Resolution: 3840 x 2160 Ultra HD (4K) (even if you recorded at 1080p or 1440p, exporting at 4K forces YouTube to assign the high-quality VP9 codec).
- Frame Rate: 60 fps
- Quality: Restrict to 60,000 Kb/s (60 Mbps)
- Audio: AAC, 320 Kb/s, 48 kHz

### 4. Your 3-Step Quest Routine

Once everything above is saved, your workflow for every episode is identical:

1. **Record:** Hit Record before starting a quest, tap Ctrl + F12 during 1-2 cool moments for Shorts, and stop recording when the quest ends.
2. **Edit & Caption:** Drop the file into Resolve, cut out inventory pauses or long drives, add a 1-second fade-in/out, run Create Subtitles from Audio, and export your .srt file alongside your 4K MP4.
3. **Slice Shorts:** Duplicate the timeline, switch to vertical (1080x1920), trim down to your markers with Smart Reframe, burn in captions, and export.

---

## Part 2. Notes

Not applied to Part 1. Each note says what it rests on.

### What is actually happening (as of November 16, 2026)

- **Recording has started.** Hours of gameplay are recorded, with Steam's automatic (background) recording.
- **One save.** All the footage is from it. The V-Jackie save is dropped.
- **Played so far:** The Streetkid, Practice Makes Perfect, The Rescue and The Ripperdoc, then NCPD jobs.
- **Viktor is paid back,** out of recovered weapons and ammo.
- **Build so far:** "I have chosen not to level, building skills and equipment where I can." V levels up from XP, and every attribute and perk point is banked, so attributes stay at 3. Skills rise by use.
- **Videos:** every entry is edited into a full video of its own, each assault site included. Before The Heist that is 80: the 72 side entries and the 8 main jobs from The Streetkid to The Heist. A few deaths before the success stay in the full video. Each mission also gets a Short of up to 3 minutes, cut in the style of a 90s skate-video part, with that mission's deaths in it (`cyberpunk2077ShortsTreatment.md`).

**Warning: Steam's automatic recording overwrites old footage.** Background recording is a rolling buffer with a length or storage limit. When it fills, the oldest footage is overwritten. Only saved clips and exported files are kept, and they are stored separately.
- Valve's support page says the length and quality of the background recording are set in Steam's settings, and that seeking back far enough can reach footage that has already been overwritten.
- Forum posts report a default of about 120 minutes per game, and one reports that launching a different game deleted the first game's extra footage. These are user reports, not Valve's documentation.
- Not checked: what limit your Steam is set to, and how much of the recorded hours is still on disk.
- Part 1 says "Record on Demand." What is being used is automatic recording, so the routine's "hit Record before starting a quest" doesn't apply as written.

### Where the checklist meets other decisions

1. **Subtitles off, against "repeat the game's lines."**
   - The crew files reuse the game's own lines, and each one is marked to be checked in play. On-screen subtitles are the easiest way to check wording.
   - Automatic transcription is likely to get the slang and the Spanish wrong: "choomie," "mano," "hermano," "gonk."
   - Not decided: subtitles off with the transcript corrected by hand, subtitles on in dialogue-heavy scenes, or lines noted down during play.
2. **No HUD, against the hardest difficulty.**
   - The run is on Very Hard. V goes loud in self-defense, and every fight on screen is V's.
   - All of V-media's attributes stay at 3 until The Heist (decided), which means no perks either, since the first perk tier opens at 4.
   - With the health bar and crosshair off, fights are harder to survive. Not decided: whether the HUD stays off in fights or only in dialogue, driving and photo mode.
3. **"Every episode is identical," against the two orders.**
   - The routine records a quest and edits it straight away as one episode.
   - This project plays in one order and tells the story in another: The Streetkid is played first and told after the side gigs.
   - Several things are built in the edit and aren't in the routine: the invented scenes, the crew's new lines as on-screen text over calls and messages, and the photos that cover each hack.
   - So the raw footage has to be kept and labelled, not edited and discarded. No naming scheme is decided.
4. **One save.** This fits the checklist. The V-Jackie save is dropped, so every fight on screen is V's footage.
5. **Game audio only, mic muted.** This fits. The crew's new lines are text only (decided): they are added in the edit as on-screen text and messages, and nobody speaks them. So there are no extra voice tracks to record.
6. **No mods.** Nothing in the checklist needs one.

### What the checklist leaves out

- **Photo-mode stills.** The zine links a photo from every caption, in black on white. The checklist covers video only. File names, folders, the black-on-white conversion and hosting are all undecided (cohesion plan, O10).
- **Shorts: decided.** One per mission, up to 3 minutes, cut as a 90s skate-video part: vertical crop, MiniDV grade, analog texture, fisheye vignette, the game's own music, no narration, and the mission's deaths in its skit break. The rules and notes are in `cyberpunk2077ShortsTreatment.md`. The routine in Part 1 cuts Shorts from one or two "cool moments" marked with Ctrl+F12 instead.
- **The paste's last line** offered a YouTube title, description and playlist template. It isn't included above. Episode numbering waits on what the zine publishes during the side gigs, which is undecided.

### Checked, and not checked

- **Checked:** Steam's marker hotkey is Ctrl+F12, per Steam's support page. Recording start and stop defaults to Ctrl+F11 there; one guide says Shift+F11, so check on the install.
- **Checked:** "Disable Copyrighted Music" is a real setting. It swaps a small number of licensed songs on the radio and in clubs for other tracks. Check whether a song wanted in a scene gets swapped.
- **Not confirmed:** whether Smart Reframe, voice isolation and "Create Subtitles from Audio" need the paid Studio version of DaVinci Resolve. Check Blackmagic's own comparison of the free and Studio versions.
- **Not checked:** every other setting name and value in Part 1. They are as pasted.

### Sources for the notes

- [Steam Support: Game Recording](https://help.steampowered.com/faqs/view/23B7-49AD-4A28-9590)
- [Steam Client Beta forum: background recording length](https://steamcommunity.com/groups/SteamClientBeta/discussions/5/4416424806088831316) (user reports)
- [Steam Client Beta forum: per-game and total limits](https://steamcommunity.com/groups/SteamClientBeta/discussions/5/6324829191798551900) (user reports)
- [Prima Games: Steam Game Recording](https://primagames.com/tips/how-to-use-the-steam-game-recording-feature-on-pc)
- [Tubefilter: Cyberpunk's copyright mode](https://www.tubefilter.com/2020/11/20/cyberpunk-2077-music-youtube-twitch-dmca-streamer-mode/)
- [CineD: DaVinci Resolve free vs Studio](https://www.cined.com/davinci-resolve-an-in-depth-comparison-between-the-free-and-studio-version/)
- [Adorama: DaVinci Resolve free vs Studio](https://www.adorama.com/alc/davinci-resolve-free-vs-paid-studio/)
