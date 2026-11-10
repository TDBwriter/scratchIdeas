# Cyberpunk 2077 Narrative Playthrough: Cohesion Plan

Audit of every project file on the branch `cyberpunk2077-narrative-playthroughs`, as of November 10, 2026 (2026:314), commit `d999b6b`. The companion file `cyberpunk2077ProjectReference.md` says what the project is. This file says what has to happen for the documents to agree with each other and be usable for production.

## What the audit found

1. **The playthrough itself is not written down.** The seed file `cyberpunk2077Playthroughs.md` is still an empty template. The difficulty, the build, the weapons, the two saves, the ending and the YouTube pipeline exist only in the planning conversation. The reference file now records them, marked as such.
2. **Thirteen decisions are holding up everything downstream.** Five of them block recording. They're listed below with their options. (Several have since been decided; see the next section.)
3. **The documents contradict each other in 22 places.** Most trace back to those decisions. Seven are mechanical fixes.
4. **The working tools are not in the repo.** The planning log's source, the issue checker and the original zine's text live in a session scratch folder that disappears when this session ends. Without the source, the 141-page planning log can't be regenerated or updated.
5. **Nothing exists past The Heist.** The planning log, the crew scenes and the arcs all stop there, and about 21 of the projected 28-29 issues come after it.
6. **Issue [0] passes every scripted check on structure and voice, and fails on content:** its Top Ten is all placeholders, it has no photos and no puzzle clue, and its Gripe Time is off-topic.

## Decided since the audit

- **V is always neutral** in every file (Q1).
- **V is always a pacifist,** deeply conscientious about the appropriate level of violence: backup to Jackie, using wits, a camera, a tomahawk and fists. No gun (Q2).
- **The player does every hack; the story credits T-Bug.** The edit covers each hack with a photo V appears to have snapped. T-Bug is a script kiddie who only uses tricks seen in gameplay (Q3).
- **The Streetkid is the first mission toward The Heist.** The rest of the run-up, "Edgerunners 0," is every job that can show the crew working together. Its order is undecided (part of Q4).
- **The Top Ten is "X marks the spot":** two lines through pairs of photo locations cross at a marked spot, up to three spots. Or all ten locations are themselves finds (part of Q7).
- **The extra sections carry the hidden clues.** A ten-clue list is drafted in `Cheap-Truth-screamsheet-CLUES.md` (part of Q7).
- **The two real-people interviews are fourth-wall easter eggs** and break the "no real names" rule on purpose (part of Q8).

- **Two silos (Q13).** The zine lives in `Cheap-Truth-screamsheet/` and the crew's storyline in `Crew-Dialogue/`, each standing on its own, with a file per crew member. This also fixed X4 (the anonymity line), X12 (the issue file's number) and X18 (the style guide's title), and started the issue ledger (O3).

**New questions these raise**
- **After The Heist, who does the story credit with the hacks?** T-Bug is dead and the player still hacks.
- **How is the ending played?** The first plan ended in a solo raid on Arasaka by an "unhinged" V. V is now always a pacifist.
- **The game still makes you pick a body and a voice** for V at character creation, even though the files stay neutral.

---

## 1. Decisions that need you

Ordered by how much each one touches. Each lists the options without a recommendation.

### Blocks recording

**Q1. Who is V on screen? Decided.** V is always neutral in the files. The game still asks for a body and a voice at creation.

**Q2. What does "pacifist" allow, and does it end at The Heist? Decided.** V is always a pacifist, deeply conscientious about the appropriate level of violence, with wits, a camera, a tomahawk and fists, and no gun. I've read "always" as covering the time after The Heist too. Still open: how the solo Arasaka ending is played.

**Q3. Who does the hacking on screen? Decided.** The player performs every hack. The edit covers it with a photo V appears to have snapped, and the story credits T-Bug, who only uses tricks seen in gameplay. Still open: who is credited after she dies.

**Q4. Which missions get an issue, and in what order?**
- **Decided so far:** The Streetkid is first. The run-up to The Heist is every job that can show the crew working together. The order is undecided.
- **Now:** "one issue per main job," numbered from 0 "in main-job order." But:
  - The Streetkid is issue [0], and it's a lifepath mission, not a main job.
  - Practice Makes Perfect is optional and undecided.
  - The Information and The Pickup can be played in either order.
  - Act 2's three branches can be played in any order.
  - Love Like Fire, the interlude played as Johnny, is undecided.
  - Phantom Liberty is undecided. It adds about 11 shared main jobs plus an ending branch.
- **Options:** fix one canonical list now / number by the order you actually play / number by act and position (for example 2.07).
- **Touches:** every issue ID after the first change (each ID is printed twice per issue); the puzzle's clue order; the total count; the level cap and build if Phantom Liberty is in.

**Q5. When is an issue published, given what V can reach?**
- **Now:** "published after each main job." But Watson is locked down until The Heist. Issue [0] is set in Heywood, the Afterlife opens at The Heist, and the known FF:06:B5 sites are in Corpo Plaza and the Badlands.
- **Options:**
  - Publish on time, using only what's reachable. Issue [0]'s Top Ten would have to come from the prologue's fixed route (check in game).
  - Shoot photos on a separate scouting save with the whole map open. That bends the "this playthrough only" rule.
  - Hold issues until their places open. That breaks "after each mission."
- **Touches:** the Top Ten of all 7-8 pre-Heist issues; interview photos; the release schedule.

### Blocks writing issues

**Q6. How is side content assigned to issues?**
- **Now:** undecided. Before The Heist there are 9 side jobs, 22 gigs, 6 cyberpsychos and 14 NCPD entries to place in 7-8 issues.
- **Options:** by play order (it goes in the next main job's issue) / by distance to the main job's location / by theme, assigned by hand in a ledger.
- **Touches:** test E2; Top Ten places; the departments; 51 planning-log entries.

**Q7. How does the FF:06:B5 puzzle run? Partly decided.**
- **Decided:** the extra sections carry the clues. The Top Ten marks up to three spots with crossing lines, or all ten places are finds. Ten clues are drafted in `Cheap-Truth-screamsheet-CLUES.md`.
- **Still open:**
  - which issue carries which clue;
  - whether the step that needs *The Witcher 3* is printed;
  - how the reader is told which two places make a line;
  - how close a line must pass;
  - whether the map is printed;
  - whether the seven keypad codes are given outright.
- **To know:** before The Heist only the first clue can be followed, because every other place in the hunt is outside Watson.
- **Touches:** the Top Ten of every issue; tests E4 and E6; scouting time.

**Q8. Real people, voices and rights.**
- **Real people: decided.** The Pondsmith and CD Projekt interviews are fourth-wall easter eggs and break test F1 on purpose. Still open: which Kiciński, Michał or Adam.
- **Voices:** the 14 crew scenes are new dialogue for V, Jackie and T-Bug. How are they performed? Options: on-screen text and messages only / your own voice or hired actors / synthetic voices. Cloning the game actors' voices would need their consent and carries a rights risk.
- **Rights:** "NOT COPYRIGHTED" can only cover your own text and ASCII art. Footage and photos fall under CD Projekt's fan-content terms, which also govern monetization.
- **Touches:** test F1; every invented scene; the channel's risk.

**Q9. What is an episode, and how does it tie to an issue?**
- **Now:** "each mission will be a zine and an episode," and nothing more.
- **Open:** one episode per issue or several; where the invented scenes sit; whether the video's narrator is the zine's eyewitness "I"; where the zine is published; where the photos are hosted, since every caption links to one.
- **Touches:** test G6; the pipeline; issue length.

### Blocks finishing issues

**Q10. The issue's fixed parts.**
- Length: the original ran 1,200-2,000 words. Issue [0] is about 1,000 with a blank Top Ten.
- What counts as an "article" for the three follow-the-money questions (test B1).
- "NOT COPYRIGHTED" now appears three times: top, colophon, bottom.
- The colophon's address, graphics credit and timestamp. You said you'd describe a fictional date pattern. The game shows no calendar date, so the in-world day can't be read off the screen.
- How the final issue "follows the money to V" when the crew is never named.

**Q11. Which departments exist, and who qualifies?**
- **Interview with the Dead:** the rule says Cyberpunk 2020 characters who are dead or believed dead. Drafts exist for Trace Santiago (a Cyberpunk RED character) and for Spider Murphy and Miriam Night (fates not found). Open the rule, or cut the drafts?
- **DISPATCH:** defined as a piece credited to a crew member. That contradicts "never the crew's point of view." Keep, change to uncredited correspondents, or cut?
- **STREET ART:** overlaps the Top Ten, which now covers art.

**Q12. The build.**
- "One point into Intelligence, six into Reflexes" at creation doesn't fit the perks file, which reports a creation cap of 6 per attribute from a base of 3.
- Brawling and boxing lean on Body, and Body is a dump stat.
- The DA8 Umbra and tomahawk depend on Q2.
- Free-running cyberware (a double jump) decides which Top Ten "ways up" exist, and when.
- The Cyberpunk RED sheet that mirrors the build isn't written down.

**Q13. Repo layout. Decided.** Two silos, `Cheap-Truth-screamsheet/` and `Crew-Dialogue/`, each independent. The playthrough files stay at the repo root for now.

---

## 2. Contradictions between documents

File names and line numbers in this table are from before the files were reorganized into silos. The reference file's map shows where everything is now.

| # | Where | The conflict | Fix |
|---|---|---|---|
| X1 | `cyberpunk2077Playthroughs.md` | Still the empty template; no decision is recorded | Fill from the reference file, or replace it |
| X2 | Journeys lines 43, 134, 389 | V-media "won't carry a gun," against the first plan's DA8 Umbra and tomahawk | Resolved: no gun; wits, camera, tomahawk, fists |
| X3 | Profiles line 106; Journeys line 16 | "V does the hands-on hacking," against "T-Bug appears to do the hacking" | Resolved: the player hacks, the story credits T-Bug |
| X4 | Journeys line 49 | What V saw at The Heist is "the reason Cheap Truth is anonymous," but the zine is anonymous from issue [0] | Resolved: reworded, with no mention of the zine |
| X5 | Style guide lines 138, 194; template line 62 | DISPATCH and "crew dispatches," against "never the crew's point of view" | Q11 |
| X6 | Style guide section 0 | "The final issue follows the money to V," against "the crew is never named" | Q10 |
| X7 | Tests E6; style guide section 3 | One clue in every issue, against 8-14 clues over 28-29 issues | Resolved: ten clues, placed by a ledger |
| X8 | Style guide intro and section 5 | "One issue per main job," against issue [0] being a lifepath mission; "main-job order" isn't unique | Q4 |
| X9 | Style guide intro | "Published after that main job," against the Watson lockdown | Q5 |
| X10 | Tests F1; style guide section 7 | No real person named, against two interviews with living people | Resolved: a written exception for the fourth-wall interviews |
| X11 | Interviews rule 1 | Cyberpunk 2020 and dead, against drafts for Trace Santiago, Spider Murphy and Miriam Night | Q11 |
| X12 | `issues/01-the-streetkid.md` | The file is "01"; the issue is [0] | Resolved: now `Cheap-Truth-screamsheet-ISSUE-00.md` |
| X13 | Style guide section 5, rule 6 | "The timestamp is when the mission was completed, in the world's time," but the game shows no calendar date | Q10 |
| X14 | Issue [0] | "Got lunch" and Padre's contact were cut as unconfirmed; both are sourced in the planning log | Mechanical: restore, on your yes |
| X15 | Issue [0] | Top Ten placeholders print the hidden pairing ("FF:06:B5 line with 9"); Gripe Time is about debt, not free-running | Draft state; clears when the issue is written |
| X16 | Interviews rule 7 | Says "images"; photos are now caption links | Mechanical |
| X17 | `ISSUE_TESTS.md` | IDs out of order (A1b, A1c, A8 after A7, E4c before E4b) | Mechanical, once, with an old-to-new table, after the decisions land |
| X18 | `STYLE_GUIDE.md` title | "Voice & Pattern Guide" now also covers the puzzle, imagery and markup | Resolved: now `Cheap-Truth-screamsheet.md`, "Cheap Truth: the screamsheet" |
| X19 | Ten files | Open questions sit in about ten places under four different headings | One decisions register (O2) |
| X20 | Perks file; the build plan | Creation spread against the creation cap; boxing against dumping Body | Q12 |
| X21 | Style guide sections 1 and 4 | "NOT COPYRIGHTED" three times per issue | Q10 |
| X22 | Journeys, Jackie's arc | Quotes "Your way's harder," but no scene contains the line | Mechanical: write the scene or cut the line |

---

## 3. Gaps in organization

What's missing for the plan to be carried out.

| # | Gap | Why it matters |
|---|---|---|
| O1 | **No charter.** | Nothing states the project's settled decisions in one place. The reference file starts this. |
| O2 | **No decisions register.** | Open questions are scattered, and nothing records what was decided, when, and what it replaced. |
| O3 | **No issue ledger.** (Started: `Cheap-Truth-screamsheet-ISSUES.md`.) | No table of issue number, mission, title, masthead face, slogan, joke, clue, FF:06:B5 site, departments, side content, episode and status. Tests A2, A6, E2 and E6 all need one. |
| O4 | **No build document.** | The level-by-level build, cyberware and RED sheet are unrecorded (Q12). |
| O5 | **Nothing past The Heist.** | No mission order, planning log, scenes or arcs for about three-quarters of the run. |
| O6 | **No production pipeline.** | Saves (V-media, V-Jackie, maybe a scouting save), capture settings, a per-mission capture checklist, the edit, voice and publishing steps. |
| O7 | **No in-game checklist.** | About fifteen "check in game" items are spread across the crew files and the zine files. Examples: whether photo mode can place Jackie and T-Bug; which montage locations can be reached. |
| O8 | **Tools outside the repo.** | The planning log's builder and data, the issue checker behind the scripted tests, the shortlist of 366 ASCII faces, and the text of the original zine that every quote comes from. All are in a session folder that is deleted when the session ends. |
| O9 | **No registries for the "never reused" tests.** | Mastheads (A2), slogans (A6) and copyright jokes have nothing to be checked against. |
| O10 | **No photo convention.** | File names, folders, the black-on-white conversion and hosting are undefined, and every caption needs a link target. |
| O11 | **No Top Ten layout tool.** | Finding ten real places that satisfy both pairings by eye isn't practical (Q7). |
| O12 | **No cross-index.** | Crew scenes, planning-log entries and issues don't reference each other. |
| O13 | **Source quality isn't marked.** | Some facts rest on fan wikis or scraped blogs. They're noted in place but not collected. |
| O14 | **Cyberpsychosis research is pending.** | You said you'd gather it. Test B2 and every cyberpsycho item wait on it. |

---

## 4. Layout

Decided: two silos, each independent of the other and of the video.

```
Cheap-Truth-screamsheet/     the zine V fictionally publishes
  Cheap-Truth-screamsheet.md             the rules
  Cheap-Truth-screamsheet-ISSUES.md      the ledger and registers
  Cheap-Truth-screamsheet-ISSUE-00.md    one file per issue
  Cheap-Truth-screamsheet-TEMPLATE.md
  Cheap-Truth-screamsheet-TESTS.md
  Cheap-Truth-screamsheet-INTERVIEWS.md  plus one INTERVIEW-<name> file per draft
  Cheap-Truth-screamsheet-CLUES.md
Crew-Dialogue/               our storyline, compatible with the game
  Crew-Dialogue.md                       the rules and the crew's arc
  Crew-Dialogue-V.md  -JACKIE.md  -T-BUG.md
  Crew-Dialogue-SCENES.md
  Crew-Dialogue-GAPS.md
(repo root)                  the playthrough: perks, planning log, this plan, the reference
```

**Still without a home:** the playthrough's own documents (build, mission order, pipeline, in-game checklist), a decisions register, photos, and the tools.

---

## 5. Order of work

**Step 0. Save the tools (no decision needed).** Copy the planning-log builder and data, the issue checker, the ASCII-face shortlist and the original zine's text into the repo. This is the only item with a deadline: the session folder doesn't survive the session.

**Step 1. Decisions.** Q1-Q5 first, since they block recording. Then Q6-Q9, then Q10-Q13.

**Step 2. Mechanical cleanup (no decision needed).**
- Done: the anonymity line (X4), the style guide's title (X18), the issue file's number (X12), "images" in the interview rules (X16), and the start of the ledger (O3).
- X14: restore "got lunch" and Padre's contact in issue [0].
- X22: write or cut "Your way's harder."
- Start a decisions register by collecting every open item from the files, leaving a pointer behind in each.
- Start the in-game checklist the same way.

**Step 3. Apply the decisions.** Each answer in Step 1 becomes edits to the files named in its "Touches" line, plus a dated row in the register. Renumber the tests (X17) and rename the issue file (X12) here, once.

**Step 4. Write what's missing.** The build document (O4), the pipeline (O6), the photo convention (O10), the Top Ten layout tool (O11), the cross-index (O12).

**Step 5. One pass in the game.** Work through the in-game checklist before recording starts, and write the answers back into the files.

**Step 6. Take issue [0] to passing.** Scout its Top Ten, write its clue if it has one, shoot and link its photos, and run all 49 tests.

**Step 7. Extend past The Heist.** Mission order, planning log, scenes and arcs for the rest of the run (O5).
