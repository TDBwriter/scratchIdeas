# Cyberpunk 2077 Narrative Playthrough: Project Reference

One place to look up what this project is, what has been decided, and where everything lives. Written from an audit of the branch `cyberpunk2077-narrative-playthroughs` on November 10, 2026 (2026:314). Open questions are in `cyberpunk2077CohesionPlan.md`; "Q" numbers below point there.

---

## What it is

### Practically

It is the pre-production package for two linked things:

1. **A serialized, narrated YouTube playthrough of *Cyberpunk 2077*.** Unmodded, on the hardest difficulty. The footage is cut and voiced so that V, Jackie and T-Bug appear to work every job before The Heist as a crew of three, with invented scenes staged in photo mode filling the six months the game skips.
2. ***Cheap Truth*, a text-only Markdown zine.** One issue per main job, written as Night City street reporting, with each photo present as a caption that links to it.

Today it is documents only. Nothing has been recorded. Not counting this audit's two files, there are 17 Markdown files (about 27,000 words) and one 141-page PDF:
- a **rulebook** for the zine: a style guide, 49 pass/fail tests and a template;
- a **shooting plan** for Act 1: 61 ordered entries with story beats, shot boxes and note space;
- a **character bible:** a file on each of the three, their arcs, and 14 scripted scenes;
- **draft copy:** one issue and eight interviews;
- a **build reference:** every perk tree and skill track.

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

Its tensions are part of it: a pacifist in a shooter; an anti-corporate zine built from a corporation's product; "NOT COPYRIGHTED" stamped on someone else's world; style over substance, with every fact required to be true.

---

## Status at a glance

| Part | State |
|---|---|
| Playthrough recording | Not started |
| Decisions on the run itself | Made in conversation; first written down in this file |
| Act 1 planning log | Complete to The Heist: 61 entries, 141 pages |
| After The Heist | Outline only (the ending and an issue count) |
| Crew bible | Profiles and arcs done to The Heist; 14 scenes drafted; V's arc open after it |
| Zine rules | Style guide, 49 tests, template: written, with open questions |
| Issue [0] | Drafted. Passes the scripted structure and voice checks; Top Ten, photos and clue missing |
| Interviews | 8 drafts; none assigned to an issue |
| Tools | In a session folder, not in the repo |

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
| Every side job, gig, cyberpsycho and NCPD entry in Watson is done before The Heist | Conversation; the planning log lists them |
| NCPD work comes first, so V's name reaches Regina before her gigs start | Conversation; the planning log's order |
| Two saves: V-media, and V-Jackie to capture Jackie's play style | Conversation; Crew Dialogue silo |
| Edited as a three-person crew up to The Heist, with Jackie's and T-Bug's voices laid over calls and messages | Conversation; Crew Dialogue silo |
| Photo mode is used heavily, including to place Jackie in scenes | Conversation; Crew Dialogue silo |
| Ending: the secret ending, a solo raid on Arasaka | Conversation |
| Pipeline: plan, play and record, narrate, publish serially on YouTube | Conversation |
| Each mission is a zine issue and an episode | Conversation |
| A zine that appears inside the game is a stretch goal only | Conversation |

### The build

| Decision | Recorded in |
|---|---|
| Hacking first: Intelligence to 20, other attributes only for perk access | Conversation |
| Then Reflexes and Cool as needed; Body and Technical Ability are dump stats | Conversation |
| Best in class for hacking, free-running and brawling; weapon and survival perks only if spare | Conversation |
| Tools: wits, a camera, a tomahawk and fists. No gun | Crew Dialogue silo, zine rules |
| Cyberware chosen for stealth, free-running and reconnaissance | Conversation |
| Near maximum build by The Heist | Conversation |
| A Cyberpunk RED character sheet (Media role) that mirrors the game build | Conversation; not yet written |
| Creation spread: "one point into Intelligence, six into Reflexes" (conflicts with the creation cap; Q12) | Conversation |

### The crew

| Decision | Recorded in |
|---|---|
| V-media: always a pacifist, deeply conscientious about the appropriate level of violence; backup to Jackie; a free-running, truth-telling documentarian; the still frame over the score; street art, kindness, community | Zine rules; Crew Dialogue silo |
| The first plan's "unhinged after Jackie dies" is replaced by "always a pacifist"; how the solo Arasaka ending is played is open | Cohesion plan |
| Roles: Jackie the muscle, T-Bug the brains, V-media the eyes | Crew Dialogue silo |
| T-Bug is on remote comms everywhere the game doesn't put her in the room, which is everywhere but the Afterlife | Crew Dialogue silo |
| The player performs every hack; the edit covers it with a photo V appears to have snapped, and the story credits T-Bug | Crew Dialogue silo |
| T-Bug is a script kiddie with a fixed bag of tricks: she's only shown doing hacks seen in gameplay. Her canon can be played with, not changed | `Crew-Dialogue-T-BUG.md` |
| The run-up to The Heist is "Edgerunners 0": The Streetkid first, then every job that can show the crew working together; order undecided | Zine rules |
| Jackie calls V "choomie," and "hermano" when it counts | Crew Dialogue silo |
| Invented scenes sit between the game's own beats and never contradict them | Crew Dialogue silo |

### The zine

| Decision | Recorded in |
|---|---|
| Named after, and modeled on, Bruce Sterling's *Cheap Truth* (1983-86) | Zine rules |
| One issue per main job; side content supplies flavor; every issue stands alone | Zine rules |
| Main idea: follow the money. How did this come to be, who profited, who paid | Zine rules section 0 |
| The other half: what the street makes and gives with no money in it | Zine rules section 0 |
| Indictment: corporations run the world more than governments; real parallels unnamed; the in-game story first | Zine rules sections 0 and 7 |
| Cyberpsychosis is a running theme; your research on it is pending | Zine rules section 0 |
| Voice: first person, an eyewitness, never the crew; crew never named; style over substance; kind to the street; signed Veritas | Zine rules section 2 |
| Every section ties to the issue's mission | Tests, group E |
| Text only, in basic CommonMark and plain ASCII; photos are caption links; everything black on white | Zine rules sections 8 and 9 |
| The zine and the crew storyline are two silos that stand independently of each other and of the video | This file's map |
| The style guide and template work as pass/fail tests | `Cheap-Truth-screamsheet-TESTS.md` |
| Interviews keep the original zine's voice and presentation. Two of them name real, living people as caricatures: fourth-wall easter eggs that break the "no real names" rule on purpose | `Cheap-Truth-screamsheet-INTERVIEWS.md` |

---

## *Cheap Truth*: how an issue is built

In order, top to bottom:

1. **Issue ID,** the first line, in IEEE reference format, numbered from 0, dated `YYYY:DDD`.
   `[0] Veritas, "Who got paid for a car that never moved?" Cheap Truth, no. 0, Night City, 2026:314.`
2. **Copyright line:** `NOT COPYRIGHTED ` and a lame joke about the issue.
3. **Masthead:** ASCII art drawing "CHEAP TRUTH [n]", in a face no other issue uses.
4. **Editorial:** a headline, which is the title in the ID, then "EDITORIAL." and one to five sentences.
5. **Lead article:** the main job, under an all-caps headline, answering the three questions.
6. **CHEAP TRUTH TOP TEN,** in every issue: ten places around the mission, numbered 0 to 9.
7. **Up to two optional departments:** Gripe Time, Street Art, Interview, Interview with the Dead, Bulletin, Dispatch.
8. **Colophon:** address, "Veritas, editing," graphics credit, NOT COPYRIGHTED, a slogan no other issue uses, then a timestamp.
9. **Copyright line again, then the issue ID again,** as the very last line.

### The hidden structures

- **Brackets.** The ID and copyright lines open the file and close it in reverse order.
- **X marks the spot.** In the Top Ten, a line runs through two photo locations, and where two lines cross is a marked spot. A Top Ten can mark up to three: for example the mission's location and places in the FF:06:B5 hunt. The other format is "ten finds," where every location is itself a secret.
- **The puzzle.** Ten clues, numbered 0 to 9, walk a player through the FF:06:B5 hunt in the game. They hide in the extra sections. Each is a riddle that stands alone (`Cheap-Truth-screamsheet-CLUES.md`).
- **The four moves** of the Top Ten and Gripe Time: execute the lethargic, police the imitators, shameless self-hype, the anonymous shield.
- **Interview with the Dead.** A legend is called up at the Afterlife by ordering their drink. They talk money and refuse to be claimed by the zine.

### The tests

49 tests in eight groups. An issue ships when all pass.

| Group | Covers | Tests |
|---|---|---|
| A | Structure | 10 |
| B | Follow the money | 3 |
| C | Voice and anonymity | 7 |
| D | Standalone accuracy | 4 |
| E | Mission relevance, the Top Ten, the puzzle, interviews | 10 |
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
| Planning-log pages | 141 |
| Projected issues | About 28-29: 8 to The Heist, 1 interlude, about 17 in Act 2, 3 for the secret ending. Phantom Liberty would add about 11 or more. |
| Issues drafted | 1 (about 1,000 words) |
| Zine tests | 49 |
| Crew scenes | 14 |
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
| `Cheap-Truth-screamsheet-ISSUE-00.md` | Issue [0], The Streetkid | Draft |
| `Cheap-Truth-screamsheet-TEMPLATE.md` | A blank issue | Current |
| `Cheap-Truth-screamsheet-TESTS.md` | The 49 pass/fail tests | Written; IDs need reordering |
| `Cheap-Truth-screamsheet-INTERVIEWS.md` | The Interview with the Dead department: rules, legends, index of drafts | Written |
| `Cheap-Truth-screamsheet-INTERVIEW-<name>.md` | Eight interview drafts, each with its canon notes | Drafts; unassigned |
| `Cheap-Truth-screamsheet-CLUES.md` | The FF:06:B5 hunt's steps and ten clues | Drafted; unchecked in game |

### The Crew Dialogue silo: `Crew-Dialogue/`

Our own storyline for V, Jackie and T-Bug, 100% compatible with what the game shows. It needs nothing from the screamsheet.

| File | What it is | State |
|---|---|---|
| `Crew-Dialogue.md` | The rules of the storyline: the [GAME]/[OURS] line, Edgerunners 0, staging, the crew's arc, rules for writing scenes | Written |
| `Crew-Dialogue-V.md` | V: in the game, in our storyline, behavior, voice, never, open | Written to The Heist |
| `Crew-Dialogue-JACKIE.md` | Jackie: the same | Written to The Heist |
| `Crew-Dialogue-T-BUG.md` | T-Bug: the same, with her canon rules and repertoire of tricks | Written to The Heist |
| `Crew-Dialogue-SCENES.md` | The 14 scenes, with dialogue | Drafted |
| `Crew-Dialogue-GAPS.md` | What the game doesn't show: what players discuss, the montage's frames, existing quests to recreate | Written |
| `Crew-Dialogue-GIGS.md` | The 51 side entries before The Heist, and the four moments each gig carries; seeds for the 22 gigs | Seeds drafted |

### The playthrough and the project, at the repo root

| File | What it is | State |
|---|---|---|
| `cyberpunk2077ProjectReference.md` | This file | Current |
| `cyberpunk2077CohesionPlan.md` | The audit: decisions needed, contradictions, gaps, order of work | Current |
| `cyberpunk2077Playthroughs.md` | The branch's seed file | Empty template |
| `cyberpunk2077PerksAndSkills.md` | Flow charts and tables of every perk tree and skill track (patch 2.x) | Complete |
| `cyberpunk2077PreHeistPlanningLog.pdf` | The print-and-write shooting plan for Act 1 | Complete to The Heist; its source is not in the repo |

**Outside the repo,** in the session's scratch folder: the planning log's builder and data, the issue checker, the ASCII-face shortlist, and the scans and text of the original zine.

---

## Glossary

- **V-media:** this playthrough's V, the photographer and zine-maker. Also the name of the main save.
- **V-Jackie:** the second save, played in Jackie's style to capture footage for him.
- **Veritas:** the zine's signature. Never identified as V on the page.
- **[GAME] and [OURS]:** in the crew files, what the game shows and what the playthrough invents.
- **Main job, side job, gig, NCPD scanner, cyberpsycho sighting:** the game's own mission types.
- **The Heist:** the main job where Jackie and T-Bug die. The end of Act 1 and of detailed planning.
- **The montage:** the game's 80-second cutscene covering V and Jackie's first six months.
- **Watson lockdown:** the game keeps V inside the Watson district until The Heist.
- **Issue ID:** an issue's own IEEE-style citation, its first and last line.
- **Brackets:** pairing from the outside in. The ID and copyright lines; Top Ten entries 0-9, 1-8 and so on.
- **The mission's location:** the quest marker that starts the job, or where the article's smoking gun is.
- **FF:06:B5:** a code on a statue in Corpo Plaza and the multi-year player hunt it started. As a color code it's magenta, which a black-on-white zine can't print.
- **The ledger and the wall:** who took, and who was here. The zine's two halves of the truth.
- **The four moves:** the original zine's habits, reused in the Top Ten and Gripe Time.
- **Colophon:** the sign-off block at the foot of an issue.
- **Ofrenda:** the memorial altar for Jackie in the side job Heroes.
- **Cyberpunk 2020 and Cyberpunk RED:** the tabletop games the setting comes from. RED's Media role is the model for V-media.
