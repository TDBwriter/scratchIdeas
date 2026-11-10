# CHEAP TRUTH — Issue Tests

Pass/fail tests for every finished issue. Each test is worded so an issue can clearly fail it. **[auto]** = can be checked by script. **[read]** = a reader checks it.

An issue ships only when every test passes.

---

## A. Structure
| ID | Test | How to check |
|---|---|---|
| A1 | The masthead is ASCII art drawing "CHEAP TRUTH [n]", where n is the issue number. | **[auto]** characters are plain ASCII; **[read]** the art is legible |
| A1b | The first line of the issue, above the masthead, is the issue ID as a valid IEEE reference: `[n] Veritas, "<editorial headline>," Cheap Truth, no. n, Night City, <YYYY:DDD>.` n starts at 0 and follows main-job order; the title matches the editorial's headline (IEEE capitalization); the date is the real-world publication date as `YYYY:DDD` (year, then the day of the year in three digits, 001 to 365 or 366). | **[auto]** pattern match; n matches the issue's place in main-job order |
| A1c | The next line after the issue ID (skipping blank lines), before the masthead, is `NOT COPYRIGHTED ` followed by a joke about this issue. | **[auto]** the line starts `NOT COPYRIGHTED `; **[read]** the joke ties to this issue |
| A2 | The masthead's face is not used in any other issue. | **[auto]** compare against the other issues |
| A3 | After the masthead comes the editorial: a headline, then **EDITORIAL.** | **[auto]** |
| A4 | The lead article is this issue's main job, under an ALL-CAPS headline. | **[read]** |
| A5 | The sign-off matches: `CHEAP TRUTH, <address>. Veritas, editing. <name>, graphics. NOT COPYRIGHTED. "<slogan>"` then `Veritas - <timestamp>`. | **[auto]** |
| A6 | The slogan is not used in any other issue. | **[auto]** |
| A7 | The file closes with the copyright line, then the issue ID as the very last line. Both are identical to the opening two lines. | **[auto]** |
| A8 | Every issue has a CHEAP TRUTH TOP TEN. | **[auto]** |

## B. Follow the money
| ID | Test | How to check |
|---|---|---|
| B1 | Every article answers all three: **how did this come to be, who profited (before and after), who paid.** | **[read]** point to the sentence for each. Any one missing fails. |
| B2 | Every cyberpsycho item says who profited before the break and who profits after. | **[read]** |
| B3 | The issue shows at least one thing someone made or gave with no money in it (street art, music, film, protest, a kindness, a friendship), from this mission or its assigned side content. | **[read]** point to it |

## C. Voice and anonymity
| ID | Test | How to check |
|---|---|---|
| C1 | The writer speaks in the first person ("I") and tells events as an eyewitness, as if watching them happen. | **[auto]** "I" appears outside quotes; **[read]** events are told as seen |
| C1b | The "I" is never in the crew: no crew member's thoughts or feelings, no "we" doing the job, nothing only the crew could know (their plans, their private talk). | **[read]**; **[auto]** flags *we / us / our* outside quotes for review |
| C2 | The crew is never named, in text or captions (V, Vincent, Valerie, Jackie, Welles, T-Bug). | **[auto]** |
| C3 | Every person is introduced with a short label at first mention. | **[read]** |
| C4 | Style over substance: attitude, image and rhythm carry the language. In every paragraph a reviewer can point to the line doing it. | **[read]** |
| C5 | Kind to the street: no joke or verdict mocks anyone for being poor, chromed, desperate or broken. Hard words go to whoever profits. | **[read]** |
| C6 | Violence is reported, never celebrated. | **[read]** |

## D. Standalone accuracy
| ID | Test | How to check |
|---|---|---|
| D1 | No references to other issues ("last issue," "next issue," "next time," "as we reported," "again"). | **[auto]** |
| D2 | No running totals (Street Cred, level, V's total eddies). | **[auto]** |
| D3 | Nothing beyond what the main job's *Requires* guarantees. | **[read]** against the planning log |
| D4 | Every claim matches the game and this playthrough. Anything unconfirmed is cut. | **[read]** against sources and footage |

## E. Mission relevance
| ID | Test | How to check |
|---|---|---|
| E1 | Every element (editorial, each department item, gripe, slogan, art) ties to this issue's main job or to side content assigned to it. | **[read]** for each element, name its tie |
| E2 | Side content appears only in the issue it's assigned to. | **[read]** against the assignment list |
| E3 | Every Top Ten entry is a place around this mission's story (an iconic spot, a photo location or a piece of art), names its district, and gives a way up that works in the game. | **[read]**, checked in game |
| E4 | The Top Ten is numbered 0 to 9. On the 2D map, the line through each neighbour pair (0-1, 2-3, 4-5, 6-7, 8-9) passes through the mission's location: the quest marker where the job starts, or where the smoking gun the lead article discusses happened or can be found. | **[read]** plotted on the in-game map |
| E4c | On the 2D map, the line through each bracket pair (0-9, 1-8, 2-7, 3-6, 4-5) passes through this issue's FF:06:B5 location. Neither target is one of the ten. | **[read]** plotted on the in-game map |
| E4b | *Optional, doesn't block shipping.* In 3D, each line also passes through its target at the target's height. | **[read]** heights estimated in game |
| E5 | The Top Ten, and Gripe Time if it runs, are about free-running life in Night City. | **[read]** |
| E6 | The issue carries exactly one clue of the FF:06:B5 hunt, in the Top Ten, or in Gripe Time if it runs. The riddle stands alone, and it is the right clue for this issue's place in the hunt's order. | **[read]** against the clue list |
| E7 | The Top Ten, with Gripe Time if it runs, uses all four moves: execute the lethargic, police the imitators, shameless self-hype, the anonymous shield. Hard words aim up. | **[read]** point to each |
| E8 | *If an Interview with the Dead runs:* the subject is a Cyberpunk 2020 character dead or believed dead by 2077, never the crew; the tie to this mission is named; the facts match canon; it follows the money; the dead refuse to be claimed by the zine. | **[read]** against `INTERVIEWS_WITH_THE_DEAD.md` |

## F. Real-world parallels
| ID | Test | How to check |
|---|---|---|
| F1 | No real-world person, company or event is named. | **[read]** with **[auto]** spot-checks |
| F2 | The issue reads complete as Night City reporting. A reader with no real-world knowledge loses nothing. | **[read]** |
| F3 | At least one real-world parallel sits under the surface, and the reviewer can name it. | **[read]** |

## G. Imagery
| ID | Test | How to check |
|---|---|---|
| G1 | Every piece has at least one key photo, linked from its caption. | **[read]** |
| G2 | The lead photo tells the lead story alone. Open it without the text: can a viewer say what happened? | **[read]** |
| G3 | The lead article links photos for how it came to be, who profited, and who paid. | **[read]** |
| G4 | Each Top Ten entry links the photo taken at that place; each bulletin item links a photo of its subject. | **[read]** |
| G5 | Everything is black on white: no color. | **[auto]** on the photo files |
| G6 | Every caption is a working link to its photo, and reads well as plain text. | **[auto]** links resolve; **[read]** the caption alone |

## H. Markup
| ID | Test | How to check |
|---|---|---|
| H1 | CommonMark only: no raw HTML (comments included), tables, footnotes, task lists, strikethrough or underline headings. | **[auto]** render with a strict CommonMark renderer, HTML off; nothing prints as raw markup |
| H2 | Plain ASCII characters only. | **[auto]** |
| H3 | A blank line between every block; no trailing-space line breaks. | **[auto]** |
| H4 | All ASCII art sits in fenced code blocks. | **[auto]** plus **[read]** |
| H5 | Opened in a browser, the rendered page shows every heading, list, rule, code block and link, with nothing garbled. | **[read]** |
| H6 | Text only: no embedded images (`![`). Every photo is a caption link. | **[auto]** |

## Not yet decided (these can't be tested until they are)
- **Length:** the original ran about 1,200–2,000 words per issue.
- **"Article":** do the editorial, Top Ten capsules and bulletin items each count as articles under B1?
- **Side-content assignment rule** (needed for E2).
- **Pacifism after The Heist** (needed for C6 in later issues): does the zine's voice stay pacifist when V doesn't?
- **Top Ten targets** (needed for E4 and E4c): which target sits between its pairs (only one can); which FF:06:B5 location each issue targets; how close a line must pass to count; whether the issue prints the map with the lines.
- **The puzzle** (needed for E6): how many clues, whether the Witcher 3 step is in, where each clue sits, which issues carry them.
- **Crew in photos** and **photo conversion** (grayscale, threshold, halftone).
