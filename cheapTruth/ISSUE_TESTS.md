# CHEAP TRUTH — Issue Tests

Pass/fail tests for every finished issue. Each test is worded so an issue can clearly fail it. **[auto]** = can be checked by script. **[read]** = a reader checks it.

An issue ships only when every test passes.

---

## A. Structure
| ID | Test | How to check |
|---|---|---|
| A1 | The masthead is ASCII art drawing "CHEAP TRUTH [n]", where n is the issue number. | **[auto]** characters are plain ASCII; **[read]** the art is legible |
| A1b | The first line of the issue, above the masthead, is the issue ID as a valid IEEE reference: `[n] Veritas, "<editorial headline>," Cheap Truth, no. n, Night City, <Mon. DD, YYYY>.` n starts at 0 and follows main-job order; the title matches the editorial's headline (IEEE capitalization); the date is the real-world publication date. | **[auto]** pattern match; n matches the issue's place in main-job order |
| A1c | The next line after the issue ID (skipping blank lines), before the masthead, is `NOT COPYRIGHTED ` followed by a joke about this issue. | **[auto]** the line starts `NOT COPYRIGHTED `; **[read]** the joke ties to this issue |
| A2 | The masthead's face is not used in any other issue. | **[auto]** compare against the other issues |
| A3 | After the masthead comes the editorial: a headline, then **EDITORIAL.** | **[auto]** |
| A4 | The lead article is this issue's main job, under an ALL-CAPS headline. | **[read]** |
| A5 | The sign-off matches: `CHEAP TRUTH, <address>. Veritas, editing. <name>, graphics. NOT COPYRIGHTED. "<slogan>"` then `Veritas - <timestamp>`. | **[auto]** |
| A6 | The slogan is not used in any other issue. | **[auto]** |
| A7 | The file closes with the copyright line, then the issue ID as the very last line. Both are identical to the opening two lines. | **[auto]** |

## B. Follow the money
| ID | Test | How to check |
|---|---|---|
| B1 | Every article answers all three: **how did this come to be, who profited (before and after), who paid.** | **[read]** point to the sentence for each. Any one missing fails. |
| B2 | Every cyberpsycho item says who profited before the break and who profits after. | **[read]** |

## C. Voice and anonymity
| ID | Test | How to check |
|---|---|---|
| C1 | The writer speaks in the first person ("I") and tells events as an eyewitness, as if watching them happen. | **[auto]** "I" appears outside quotes; **[read]** events are told as seen |
| C1b | The "I" is never in the crew: no crew member's thoughts or feelings, no "we" doing the job, nothing only the crew could know (their plans, their private talk). | **[read]**; **[auto]** flags *we / us / our* outside quotes for review |
| C2 | The crew is never named, in text or captions (V, Vincent, Jackie, Welles, T-Bug). | **[auto]** |
| C3 | Every person is introduced with a short label at first mention. | **[read]** |
| C4 | Style over substance: attitude, image and rhythm carry the language. In every paragraph a reviewer can point to the line doing it. | **[read]** |

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

## F. Real-world parallels
| ID | Test | How to check |
|---|---|---|
| F1 | No real-world person, company or event is named. | **[read]** with **[auto]** spot-checks |
| F2 | The issue reads complete as Night City reporting. A reader with no real-world knowledge loses nothing. | **[read]** |
| F3 | At least one real-world parallel sits under the surface, and the reviewer can name it. | **[read]** |

## G. Imagery
| ID | Test | How to check |
|---|---|---|
| G1 | Every piece has at least one key image. | **[read]** |
| G2 | The lead image tells the lead story alone. Cover the text: can a viewer say what happened? | **[read]** |
| G3 | The lead article has images for how it came to be, who profited, and who paid. | **[read]** |
| G4 | Each Top Ten and bulletin item has a thumbnail. | **[read]** |
| G5 | Everything is black on white: no color. | **[auto]** on the image files |

## H. Markup
| ID | Test | How to check |
|---|---|---|
| H1 | CommonMark only: no raw HTML (comments included), tables, footnotes, task lists, strikethrough or underline headings. | **[auto]** render with a strict CommonMark renderer, HTML off; nothing prints as raw markup |
| H2 | Plain ASCII characters only. | **[auto]** |
| H3 | A blank line between every block; no trailing-space line breaks. | **[auto]** |
| H4 | All ASCII art sits in fenced code blocks. | **[auto]** plus **[read]** |
| H5 | Opened in a browser, the rendered page shows every heading, list, rule, code block and image, with nothing garbled. | **[read]** |

## Not yet decided (these can't be tested until they are)
- **Length:** the original ran about 1,200–2,000 words per issue.
- **"Article":** do the editorial, Top Ten capsules and bulletin items each count as articles under B1?
- **Side-content assignment rule** (needed for E2).
- **Crew in photos** and **photo conversion** (grayscale, threshold, halftone).
