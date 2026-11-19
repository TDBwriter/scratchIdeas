# Cyberpunk 2077 Narrative Playthrough: Project Reference

One place to look up what this project is, what has been decided, and where everything lives. Written from an audit of the branch `cyberpunk2077-narrative-playthroughs` on November 10, 2026 (2026:314), and brought up to date on November 16, 2026 (2026:320). Open questions are in `cyberpunk2077CohesionPlan.md`; "Q" numbers below point there.

---

## What it is

### Practically

It is the pre-production package for two linked things:

1. **A serialized, narrated YouTube playthrough of *Cyberpunk 2077*.** The base game with Update 2.5, unmodded, on the hardest difficulty. The footage is cut and narrated, with the crew's new lines shown as on-screen text, so that V, Jackie and T-Bug appear to work every job before The Heist as a crew of three, with invented scenes staged in photo mode filling the six months the game skips.
2. ***Cheap Truth*, a text-only Markdown zine.** One issue per main job, written as Night City street reporting, with each photo present as a caption that links to it.

Recording has started: hours of gameplay, captured with Steam's automatic recording. Played so far: The Streetkid, Practice Makes Perfect, The Rescue, The Ripperdoc, then NCPD jobs. Nothing is edited yet. Not counting this file and the cohesion plan, there are 33 Markdown files (about 51,000 words), one 141-page PDF and a folder of tools:
- a **rulebook** for the zine: a style guide, 50 pass/fail tests and a template;
- a **shooting plan** for Act 1: 61 entries, in a checklist order that isn't play order, with story beats, shot boxes and note space;
- a **character bible:** a file on each of the three, their arcs, 17 scripted scenes (13 numbered, and 4 that tell The Streetkid late), and seeds for 48 of the 51 side entries;
- **draft copy:** one issue and eight interviews;
- a **build reference:** every perk tree and skill track (and a retired build for the dropped V-Jackie save);
- a **recording pipeline:** a settings and export checklist, with notes on where it meets the project's decisions;
- a **Shorts treatment:** a 90s skate-video style for the Shorts, with notes;
- the **tools:** the planning log's source, the issue checker, the masthead shortlist and the original zine's text.

About a quarter of the run is planned in detail (everything up to The Heist). The rest, about 21 issues' worth, has an outline only.

### Artistically

It is street photography and a friendship, carried out inside a corporate shooter, and published as samizdat.

- **A documentary made inside a game.** The player character is a photographer who would rather get the shot than the score. The point of a mission is the frame it leaves behind.
- **An elegy written in advance.** The game gives V and Jackie's partnership 80 seconds of montage and then kills him. This project plays those months out, and the audience knows the ending. Every scene plants something The Heist takes away: the drink, the porch, the name T-Bug never tells.
- **A repair that refuses to cheat.** T-Bug is the character the game forgets; she dies offscreen and nobody mentions her again. The project gives her a presence without changing a single thing she canonically is. The art is in the gaps, and staying faithful is the constraint.
- **A zine with a lineage.** The original *Cheap Truth* (1983-86) was a free, uncopyrighted, pseudonymous sheet that attacked its own field. This one keeps the form and changes the target: whoever profits. Each article follows the money. Beside that ledger it keeps a second record, "the wall": what people make and give with no money in it.
- **An allegory that doesn't announce itself.** It reads as Night City reporting. Underneath, unnamed, it indicts a world run by corporations more than by governments.
- **A puzzle box.** The issue is bracketed by its own citation. The Top Ten runs 0 to 9 and hides lines on the map that cross at the mission and at places in the game's oldest unsolved mystery. The form rewards a reader who looks twice, the way the city rewards a free runner.
- **A witness with no name.** The narrator says "I," saw everything, and is nobody. V has seen the biggest story in Night City and can never sign it.

Its tensions are part of it: a pacifist with a gun, in a shooter; an anti-corporate zine built from a corporation's product; "NOT COPYRIGHTED" stamped on someone else's world; style over substance, with every fact required to be true.

---

## Status at a glance

| Part | State |
|---|---|
| Playthrough recording | Started: hours of footage, with Steam's automatic recording. Played: The Streetkid, Practice Makes Perfect, The Rescue, The Ripperdoc, then NCPD jobs. Viktor is paid back. Steam's automatic recording overwrites old footage unless it is saved (see `cyberpunk2077RecordingPipeline.md`) |
| Decisions on the run itself | Made in conversation; written down in this file and summarized in `cyberpunk2077Playthroughs.md` |
| Act 1 planning log | Complete to The Heist: 61 entries, 141 pages |
| After The Heist | Outline only (the ending and an issue count) |
| Crew bible | Profiles and arcs done to The Heist; 13 numbered scenes and 4 Streetkid scenes drafted; seeds for 48 of the 51 side entries; V's arc open after it |
| Zine rules | Style guide, 50 tests, template: written, with open questions |
| The Streetkid's issue | Drafted as [0], a placeholder number. Passes the scripted structure and voice checks; Top Ten, photos, clue and the sign-off's address, credit and timestamp missing |
| Interviews | 8 drafts; none assigned to an issue |
| Tools | In the repo, in `tools/`. The planning log rebuilds from the copy |
| Recording pipeline | A checklist with notes; several points undecided |

---

## Settled decisions

"Conversation" means the decision was made while planning and was in no file before this one.

### The run

| Decision | Recorded in |
|---|---|
| Lifepath: Streetkid | Crew Dialogue silo, zine rules |
| V is always neutral in the files | Crew Dialogue silo, zine rules |
| Difficulty: the hardest (Very Hard) | Conversation |
| No mods | Conversation; the zine rules mention it in passing |
| The base game with Update 2.5. No Phantom Liberty, so the level cap is 50 and there are 71 attribute points | `cyberpunk2077Playthroughs.md` |
| Every side job, gig, cyberpsycho and NCPD entry in Watson is done before The Heist | Conversation; the planning log lists them |
| NCPD work comes first, so V's name reaches Regina before her gigs start. It's what was played: after The Ripperdoc, the NCPD jobs | Conversation. The planning log keeps its own checklist order (decided), which lists the NCPD jobs (entries 45-58) after the gigs and cyberpsychos |
| One save. The planned second save, V-Jackie, for Jackie's fight clips, is dropped. All the footage is from the one save | Conversation; `cyberpunk2077Playthroughs.md` |
| Edited as a three-person crew up to The Heist. The crew's new lines are text only: on-screen text and messages over calls, which nobody speaks | `Crew-Dialogue.md` |
| Photo mode is used heavily, including to place Jackie in scenes | Conversation; Crew Dialogue silo |
| Ending: the secret ending, a solo raid on Arasaka | Conversation |
| Pipeline: plan, play and record, narrate, publish serially on YouTube | Conversation |
| Every entry gets a full video of its own, each assault site included: 80 before The Heist (72 side entries, 8 main jobs). A few deaths before the success stay in the full video | Conversation; `cyberpunk2077RecordingPipeline.md` |
| Each mission also gets a YouTube Short of up to 3 minutes, cut as a 90s skate-video part: vertical crop, MiniDV grade, analog texture, fisheye vignette, the game's own music, no narration, a camcorder date in YYYY:DDD (the day it's published), a title card over the loading screen with the mission, its minimap location and V's whole profile. Takedowns in Shorts are V's, as played, outside the crew's story. Each opens on the mission's last game over, speeds slow parts with a frame-cutting "skip ahead," builds through skit breaks (cool things V notices, slick takedowns) to the coup de grace, and closes on V moving off into the city. An enemy who killed V before gets flashback slams on the approach. The full videos stay in the straight style | `cyberpunk2077ShortsTreatment.md` |
| "Not leveling": V levels up from XP and every attribute and perk point is banked, so attributes stay at 3. Skills rise by use; equipment is gathered where possible | Conversation; `cyberpunk2077Playthroughs.md` |
| Each mission is a zine issue and an episode | Conversation |
| A zine that appears inside the game is a stretch goal only | Conversation |

### The build

| Decision | Recorded in |
|---|---|
| All of V-media's attributes stay at 3 until The Heist, and V has only the cyberware the game installs. In response to The Heist, V chromes up | `Crew-Dialogue-V.md` |
| After The Heist, V goes from Streetkid sidekick to a one-person powerhouse, melting brains with quickhacks and stacking bodies like Jackie. V hacks openly as V from then on | `Crew-Dialogue-V.md` |
| The build after The Heist: hacking first, Intelligence to 20, other attributes only for perk access; then Reflexes and Cool as needed, with Body and Technical Ability as dump stats; best in class for hacking, free-running and brawling, with weapon and survival perks only if spare | Conversation |
| Tools: wits, a camera, a tomahawk, fists, and a gun V carries for self-defense. Which gun is blank (the first plan named the DA8 Umbra) | `Crew-Dialogue-V.md`, zine rules |
| Cyberware after The Heist: chosen for stealth, free-running and reconnaissance | Conversation |
| Replaced: "near maximum build by The Heist." The build now waits for The Heist | Conversation |
| A Cyberpunk RED character sheet (Media role) that mirrors the game build | Conversation; not yet written |
| Replaced: the creation spread "one point into Intelligence, six into Reflexes." All attributes stay at 3: the 7 creation points were left unspent | Conversation |

### The crew

| Decision | Recorded in |
|---|---|
| V-media: a pacifist, deeply conscientious about the appropriate level of violence; backup to Jackie; a free-running, truth-telling documentarian; the still frame over the score; street art, kindness, community | Zine rules; Crew Dialogue silo |
| V's rule of force, from the first job: V doesn't start violence or take life wantonly; answers escalation by the other party with lethal force; goes loud in self-defense when attacked; keeps the tomahawk for silenced kills if the situation calls for one | `Crew-Dialogue-V.md` |
| After The Heist, V stops holding back: quicker to escalate, readier to kill, close to the first plan's "unhinged after Jackie dies." How the solo Arasaka ending is played is open | `Crew-Dialogue-V.md` |
| Every fight on screen is V's footage. Each fight is credited to Jackie or to V in the edit, decided as it's cut; one credited to Jackie is covered with photos, as the hacks are for T-Bug | `Crew-Dialogue.md`, `Crew-Dialogue-GIGS.md` |
| Roles: Jackie the muscle, T-Bug the brains, V-media the eyes | Crew Dialogue silo |
| T-Bug is on remote comms everywhere the game doesn't put her in the room, which is everywhere but the Afterlife | Crew Dialogue silo |
| The player performs every hack; the edit covers it with a photo V appears to have snapped, and the story credits T-Bug | Crew Dialogue silo |
| T-Bug is a script kiddie with a fixed bag of tricks: she's only shown doing hacks seen in gameplay. Her canon can be played with, not changed | `Crew-Dialogue-T-BUG.md` |
| Jackie calls V "choomie," and "hermano" when it counts | Crew Dialogue silo |
| Two orders. Play order is the game's, with The Streetkid first. Story order tells every side gig first ("Edgerunners 0": every job that can show the crew working together), then The Streetkid, then the road to The Heist. Practice Makes Perfect, The Rescue and The Ripperdoc are told ahead of the side gigs | `Crew-Dialogue.md` |
| The chip: Jackie slots it after the case is damaged; V slots it after Jackie is shot and dying | `Crew-Dialogue-JACKIE.md` |
| No romance in the crew: friendship like brotherhood, and stark differences | `Crew-Dialogue.md` |
| Every gig, however small, carries four moments: one each for V, Jackie and T-Bug and one for the crew, tied to the gig's subject. Each of the 24 assault sites is a gig. Main jobs are carried by their scenes instead | `Crew-Dialogue.md`, `Crew-Dialogue-GIGS.md` |
| How the crew leaves a sealed Watson for The Streetkid is never explained; the lockdown isn't mentioned around it | `Crew-Dialogue-STREETKID-LATE.md` |
| Regina's first call stays in The Ride, where the game plays it, after the videos have shown her gigs. How her gigs begin in the story is open | `Crew-Dialogue-REGINA.md` |
| The two lines scene 1 left behind ("You watch. I'll carry." and "Then somebody should be watching them do it.") go into an early side-gig scene; which one isn't picked | `Crew-Dialogue-SCENES.md` |
| The game's own lines are repeated wherever possible | `Crew-Dialogue.md` |
| Every supporting character who works with V before The Heist is in scope, with unequal time, to serve the crew's development | `Crew-Dialogue-SUPPORTING.md` |
| Invented scenes sit between the game's own beats and never contradict them | Crew Dialogue silo |

### The zine

| Decision | Recorded in |
|---|---|
| Named after, and modeled on, Bruce Sterling's *Cheap Truth* (1983-86) | Zine rules |
| One issue per main job; side content supplies flavor; every issue stands alone | Zine rules |
| An issue runs 1,200 to 2,000 words, as the original did | Zine rules; test A9 |
| "NOT COPYRIGHTED" appears three times per issue: the second line, the sign-off, and the second-to-last line | Zine rules sections 1 and 4 |
| The optional departments are placeholders: not required in every issue, and filled with what makes the most appropriate sense for it. Gripe Time no longer has to be about free-running; the Top Ten still is | Zine rules section 3 |
| An issue uses only the places reachable at that point in the game. Before The Heist that is Watson and a mission's own fixed route, climbed with no added cyberware | Zine rules |
| Issues are numbered in story order, so The Streetkid is no longer issue [0]. Practice Makes Perfect is [0], The Rescue [1], The Ripperdoc [2]. No number after that is set until it's decided what the zine publishes during the side gigs | Zine rules; the issue ledger |
| Main idea: follow the money. How did this come to be, who profited, who paid | Zine rules section 0 |
| The other half: what the street makes and gives with no money in it | Zine rules section 0 |
| Indictment: corporations run the world more than governments; real parallels unnamed; the in-game story first | Zine rules sections 0 and 7 |
| Cyberpsychosis is a running theme; your research on it is pending | Zine rules section 0 |
| Voice: first person, an eyewitness, never the crew; crew never named; style over substance; kind to the street; signed Veritas | Zine rules section 2 |
| DISPATCH stays: a crew member writes under an epithet. It is the one stated exception to "never the crew" | Zine rules sections 2 and 3 |
| Interview with the Dead admits any legend from Cyberpunk 2020 or Cyberpunk RED who is dead, believed dead, or whose fate is unknown by 2077 | `Cheap-Truth-screamsheet-INTERVIEWS.md` |
| Every section ties to the issue's mission | Tests, group E |
| Text only, in basic CommonMark and plain ASCII; photos are caption links; everything black on white | Zine rules sections 8 and 9 |
| The zine and the crew storyline are two silos that stand independently of each other and of the video | This file's map |
| The zine runs a numbered serial built from the NCPD jobs; each part stands alone; "Cops' Cash" is the final reveal, showing the cycle of money and violence that corporate rule keeps turning. It is written in the zine's voice throughout, with no closing "something to do" line | `Cheap-Truth-screamsheet-SERIAL.md` |
| The style guide and template work as pass/fail tests | `Cheap-Truth-screamsheet-TESTS.md` |
| Interviews keep the original zine's voice and presentation. Two of them name real, living people as caricatures: fourth-wall easter eggs that break the "no real names" rule on purpose. They carry no disclaimer. The Kicinski in the CD Projekt piece is Adam | `Cheap-Truth-screamsheet-INTERVIEWS.md` |

---

## *Cheap Truth*: how an issue is built

In order, top to bottom:

1. **Issue ID,** the first line, in IEEE reference format, numbered from 0 in story order, dated `YYYY:DDD`.
   `[0] Veritas, "Who got paid for a car that never moved?" Cheap Truth, no. 0, Night City, 2026:314.`
   (This is The Streetkid's draft. Its [0] is a placeholder: the issue's number isn't set.)
2. **Copyright line:** `NOT COPYRIGHTED ` and a lame joke about the issue.
3. **Masthead:** ASCII art drawing "CHEAP TRUTH [n]", in a face no other issue uses.
4. **Editorial:** a headline, which is the title in the ID, then "EDITORIAL." and one to five sentences.
5. **Lead article:** the main job, under an all-caps headline, answering the three questions.
6. **CHEAP TRUTH TOP TEN,** in every issue: ten places around the mission, numbered 0 to 9.
7. **Up to two optional departments:** Gripe Time, Interview, Interview with the Dead, Bulletin, Dispatch. (Street art has no department: it appears as Top Ten entries.)
8. **Colophon:** address, "Veritas, editing," graphics credit, NOT COPYRIGHTED, a slogan no other issue uses, then a timestamp.
9. **Copyright line again, then the issue ID again,** as the very last line.

### The hidden structures

- **Brackets.** The ID and copyright lines open the file and close it in reverse order.
- **X marks the spot.** In the Top Ten, a line runs through two photo locations, and where two lines cross is a marked spot. The reader isn't told which entries pair up. A Top Ten can mark up to three: for example the mission's location and places in the FF:06:B5 hunt. The other format is "ten finds," where every location is itself a secret.
- **The puzzle.** Ten clues, numbered 0 to 9, walk a player through the FF:06:B5 hunt in the game. They hide in the extra sections. Each is a riddle that stands alone (`Cheap-Truth-screamsheet-CLUES.md`). An eleventh clue points out of the game, to *The Witcher 3*, and is printed too. The seven keypad codes are not printed, so the zine alone doesn't finish the hunt.
- **The four moves** of the Top Ten and Gripe Time: execute the lethargic, police the imitators, shameless self-hype, the anonymous shield.
- **Interview with the Dead.** A legend is called up at the Afterlife by ordering their drink. They talk money and refuse to be claimed by the zine.

### The tests

50 tests in eight groups. An issue ships when all pass.

| Group | Covers | Tests |
|---|---|---|
| A | Structure, length | 11 |
| B | Follow the money | 3 |
| C | Voice and anonymity | 7 |
| D | Standalone accuracy, the serial | 5 |
| E | Mission relevance, the Top Ten, the puzzle, interviews | 9 |
| F | Real-world parallels | 3 |
| G | Photos | 6 |
| H | Markup | 6 |

---

## The crew, in brief

| | In the game | In this project |
|---|---|---|
| **V** | 27, a Streetkid from Night City. The game fixes the story and leaves V's attitude to the player. | V-media. Wants the perfect still frame. Needs to step out from behind the lens. |
| **Jackie Welles** | A Heywood solo, a former Valentino, Mama Welles' son. Wants "the gig of a lifetime." Dies in The Heist. | Wants a seat at the Afterlife. Needs to see that his people are his legacy. His legend is the one they give him at his ofrenda. |
| **T-Bug** | A netrunner with no real name. Picky about contracts; plans to "sail into retirement age." On screen five times. Dies in the net, offscreen. | Wants a porch with no signal. Always on the line, never in the room. Steps into the room once. |

Full detail: one file per character in `Crew-Dialogue/`, with the scenes in `Crew-Dialogue-SCENES.md`.

---

## Numbers

| | |
|---|---|
| Planning-log entries | 61: 1 lifepath, 2 events, 7 main jobs, 9 side jobs, 22 gigs, 6 cyberpsychos, 14 NCPD |
| Full videos before The Heist | 80: the 72 side entries (each assault site its own) and the 8 main jobs from The Streetkid to The Heist |
| Planning-log pages | 141 |
| Projected issues | About 28-29: 8 to The Heist, 1 interlude, about 17 in Act 2, 3 for the secret ending. Phantom Liberty is not in this playthrough. |
| Issues drafted | 1 (about 1,000 words) |
| Zine tests | 50 |
| Crew scenes | 17: scenes 2 to 14 (scene 1 is retired) and 4 that tell The Streetkid late |
| Side entries before The Heist | 51: 22 gigs, 9 side jobs, 6 cyberpsychos, 14 NCPD. 48 have seeds |
| Gigs that carry the four moments | 72, counting each of the 24 assault sites as its own gig: 288 moments |
| Level cap | 50, with 71 attribute points (no Phantom Liberty) |
| Interview drafts | 8 (460-700 words each) |
| The six-month montage | About 80 seconds, 79 cuts, 15 locations |
| FF:06:B5 hunt | About 8 stages; 14 if each keypad code counts |
| Original *Cheap Truth* | Issues 1-17 and a Sturgeon special, 1983-86; about 1,500 words each |

---

## File map

The project is in three parts. The two silos each stand on their own.

### The *Cheap Truth* silo: `Cheap-Truth-screamsheet/`

The screamsheet V fictionally publishes. It needs nothing from the video or the crew's storyline.

| File | What it is | State |
|---|---|---|
| `Cheap-Truth-screamsheet.md` | The rules: main idea, pattern, voice, departments, colophon, standalone rules, toolkit, real-world rules, photos, markup | Written; open questions inside |
| `Cheap-Truth-screamsheet-ISSUES.md` | The ledger: one row per issue, plus the registers of mastheads, slogans and jokes used | Started; one issue |
| `Cheap-Truth-screamsheet-ISSUE-00.md` | The Streetkid's issue, drafted as [0] | Draft; number and file name are placeholders |
| `Cheap-Truth-screamsheet-TEMPLATE.md` | A blank issue | Current |
| `Cheap-Truth-screamsheet-TESTS.md` | The 50 pass/fail tests | Written; IDs out of order (A1b, A1c, C1b, E4b; D5 sits before D3), and renumbering waits until the rules stop changing |
| `Cheap-Truth-screamsheet-INTERVIEWS.md` | The Interview with the Dead department: rules, legends, index of drafts | Written |
| `Cheap-Truth-screamsheet-INTERVIEW-<name>.md` | Eight interview drafts, each with its canon notes | Drafts; unassigned |
| `Cheap-Truth-screamsheet-CLUES.md` | The FF:06:B5 hunt's steps and ten clues | Drafted; unchecked in game |
| `Cheap-Truth-screamsheet-SERIAL.md` | A six-part story built from the NCPD scanner jobs, with an optional seventh on Regina | Outline; the notes at each scene are unread |

### The Crew Dialogue silo: `Crew-Dialogue/`

Our own storyline for V, Jackie and T-Bug, 100% compatible with what the game shows. It needs nothing from the screamsheet.

| File | What it is | State |
|---|---|---|
| `Crew-Dialogue.md` | The rules of the storyline: the [GAME]/[OURS] line, the relationships, the four moments per gig, the two orders, staging, the crew's arc, the game's own lines, rules for writing scenes | Written |
| `Crew-Dialogue-V.md` | V: in the game, in our storyline, behavior, voice, never, open | Written to The Heist |
| `Crew-Dialogue-JACKIE.md` | Jackie: the same | Written to The Heist |
| `Crew-Dialogue-T-BUG.md` | T-Bug: the same, with her canon rules and repertoire of tricks | Written to The Heist |
| `Crew-Dialogue-SCENES.md` | Scenes 2 to 14, with dialogue. Scene 1 is retired | Drafted |
| `Crew-Dialogue-STREETKID-LATE.md` | The Streetkid told late: what the footage fixes, the three cuts, scenes A to D | Drafted |
| `Crew-Dialogue-GAPS.md` | What the game doesn't show: what players discuss, the montage's frames, existing quests to recreate | Written |
| `Crew-Dialogue-GIGS.md` | The 51 side entries before The Heist, and the four moments each gig carries; seeds for the 22 gigs, 9 side jobs, 6 cyberpsychos and 11 NCPD jobs | Seeds drafted; the 24 assault sites are unfilled |
| `Crew-Dialogue-SUPPORTING.md` | The supporting cast before The Heist, with what the game shows of each | Index; one character developed |
| `Crew-Dialogue-REGINA.md` | Regina Jones: in the game, in our storyline, behavior, voice, with the crew | Written |
| `Crew-Dialogue-NCPD.md` | The road to Regina: the five-beat arc the NCPD jobs carry | Drafted; the notes at each scene are unread |

### The playthrough and the project, at the repo root

| File | What it is | State |
|---|---|---|
| `cyberpunk2077ProjectReference.md` | This file | Current |
| `cyberpunk2077CohesionPlan.md` | The audit: decisions needed, contradictions, gaps, order of work | Current |
| `cyberpunk2077Playthroughs.md` | One entry per playthrough, from the branch's first template. V-media's entry is filled in from the settled decisions | Current |
| `cyberpunk2077PerksAndSkills.md` | Flow charts and tables of every perk tree and skill track (patch 2.x) | Complete; Update 2.5's six dual-wield perks are added, and the rest hasn't been rechecked against 2.5 |
| `cyberpunk2077RecordingPipeline.md` | The recording and export checklist as pasted, with separate notes on where it meets other decisions | Checklist unchanged; notes list what is undecided |
| `cyberpunk2077ShortsTreatment.md` | The 90s skate-video treatment as uploaded, with notes on how it applies to the Shorts | Treatment unchanged; decisions and checks in the notes |
| `cyberpunk2077JackieBuild.md` | The build for the V-Jackie save: dual pistols on the base game with Update 2.5 | Retired: the V-Jackie save is dropped |
| `cyberpunk2077PreHeistPlanningLog.pdf` | The print-and-write shooting plan for Act 1 | Complete to The Heist; its source is in `tools/planning-log/` |

### The tools: `tools/`

| Folder | What it is |
|---|---|
| `tools/planning-log/` | The planning log's data and builder, with its fonts. Rebuilds the PDF |
| `tools/issue-checker/` | The script behind the scripted zine tests in groups A and H |
| `tools/mastheads/` | The shortlist of 407 FIGlet faces that draw the masthead within 100 columns |
| `tools/cheap-truth-original/` | Machine-read text of the original zine, one file per scanned page |

`tools/README.md` says how to run each one. **Still outside the repo:** the scans of the original zine.

---

## Glossary

- **V-media:** this playthrough's V, the photographer and zine-maker. Also the name of the main save.
- **V-Jackie:** a second save, planned to be played in Jackie's style for his fight clips. Dropped.
- **Veritas:** the zine's signature. Never identified as V on the page.
- **[GAME] and [OURS]:** in the crew files, what the game shows and what the playthrough invents.
- **Main job, side job, gig, NCPD scanner, cyberpsycho sighting:** the game's own mission types.
- **The Heist:** the main job where Jackie and T-Bug die. The end of Act 1 and of detailed planning.
- **The montage:** the game's 80-second cutscene covering V and Jackie's first six months.
- **Watson lockdown:** the game keeps V inside the Watson district until The Heist.
- **Issue ID:** an issue's own IEEE-style citation, its first and last line.
- **Brackets:** the ID and copyright lines open an issue and close it in reverse order. (Pairing Top Ten entries 0-9, 1-8 and so on was an earlier idea. Any two photo locations can now make a line, and the reader isn't told which two.)
- **Play order and story order:** the order the game is played in, and the order the videos tell it in. The planning log follows neither: its order is a checklist.
- **Edgerunners 0:** the first stretch of story order: every side gig, cut to look as if the crew ran it together.
- **The mission's location:** the quest marker that starts the job, or where the article's smoking gun is.
- **FF:06:B5:** a code on a statue in Corpo Plaza and the multi-year player hunt it started. As a color code it's magenta, which a black-on-white zine can't print.
- **The ledger and the wall:** who took, and who was here. The zine's two halves of the truth.
- **The four moves:** the original zine's habits, reused in the Top Ten and Gripe Time.
- **Colophon:** the sign-off block at the foot of an issue.
- **Ofrenda:** the memorial altar for Jackie in the side job Heroes.
- **Cyberpunk 2020 and Cyberpunk RED:** the tabletop games the setting comes from. RED's Media role is the model for V-media.
