# Cheap Truth: the screamsheet

V's screamsheet. **One issue per main job**, published after that main job is complete; the main job is the issue's lead article. **Side jobs, gigs, cyberpsycho sightings and NCPD hustles supply the flavor**: the departments, bulletins and Top Ten items around the lead. Every issue stands alone, so it stays accurate no matter what order the missions are played in.

**This silo stands on its own.** *Cheap Truth* is the screamsheet V fictionally publishes. It needs nothing from the video or from the crew's storyline, and those don't depend on it.

**Files**
- `Cheap-Truth-screamsheet.md`: this file, the rules.
- `Cheap-Truth-screamsheet-ISSUES.md`: the ledger of issues, and the registers of mastheads, slogans and jokes already used.
- `Cheap-Truth-screamsheet-ISSUE-<nn>.md`: one file per issue. An issue has to be its own file, because its ID is the file's first and last line.
- `Cheap-Truth-screamsheet-TEMPLATE.md`: a blank issue.
- `Cheap-Truth-screamsheet-TESTS.md`: the pass/fail tests.
- `Cheap-Truth-screamsheet-INTERVIEWS.md`: the Interview with the Dead department, with one `Cheap-Truth-screamsheet-INTERVIEW-<name>.md` file per draft.
- `Cheap-Truth-screamsheet-CLUES.md`: the FF:06:B5 clues.
- `Cheap-Truth-screamsheet-SERIAL.md`: a multi-part story built from the NCPD scanner jobs.

**Order.** The Streetkid is the first mission toward The Heist, so it is issue [0]. The order of the rest is undecided.

**Who makes it.** V-media: a street kid with a camera, just trying to survive, make friends and make art. A pacifist, free-running, truth-telling documentarian who cares more about the perfect still frame than the perfect score. Always deeply conscientious about the appropriate level of violence: backup to Jackie, working with wits, a camera, a tomahawk and fists. Into street art (graffiti, mixed media, film, music, protest), kindness and community. The zine is made the way V-media lives: by hand, free, passed along. (On the page, the narrator never names or speaks as V-media; see §2.)

Modeled on the original *Cheap Truth* (Austin, Texas, 1983–1986), edited by "Vincent Omniaveritas" (Bruce Sterling): free, photocopied, **NOT COPYRIGHTED**. V is kept neutral throughout. (In the game a male V's full name is Vincent, which gives the title a second layer; a female V is Valerie.)

---

## 0. The main idea: follow the money

**Every article tells a story of following the money.** Each one answers three questions:

1. **How did this come to be?** The chain of deals, debts and decisions behind the situation.
2. **Who profited?** Before the mission, and after it reset things. Profit can be eddies, power, cover or silence.
3. **Who paid the price?**

*Cui bono?* ("who benefits?") sits beside *omnia veritas* ("all truth").

**The other half of the truth: what the street makes anyway.** Following the money shows who takes. *Cheap Truth* also shows what people make and give with no money in it: street art (graffiti, mixed media, film, music, protest), kindness, friendship, community, and just getting through the night. The ledger tells who took. The wall tells who was here. Telling the truth means telling both.

- **Running themes:** survival, friendship, art, kindness and community, told by a street kid who would rather get the shot than the score.
- **Cyberpsychosis is a running theme.** Every cyberpsycho story asks who was profiting from that person before they broke, and who profits from it after.
- **V's arc ends with the ledger turned on V.** After The Heist, V becomes the asset others profit from. The final issue follows the money to V.
- **The in-game story comes first.** Most readers will take *Cheap Truth* as Night City reporting and nothing more, and every issue has to work that way.
- **Underneath, the real world shows through,** the way the game itself echoes it. Night City money trails parallel real ones (see §7).
- **The indictment:** the world is run by corporations more than by governments. Night City is not exaggerating that. It is the plain version.

---

## 1. The pattern

Every issue has these parts, in this order.

| # | Part | Original *Cheap Truth* | *Cheap Truth* 2077 |
|---|---|---|---|
| 1 | **Masthead** | "CHEAP TRUTH" plus the issue number, redrawn every issue in a different display face (angled rub-down letters, stencil, outline, op-art, stacked vertically, boxed letters) | **ASCII art**, a different face every issue (FIGlet fonts plus hand-built layouts: stacked, vertical, boxed, glitched), drawing "CHEAP TRUTH [n]". **Above it, first thing on the page,** the issue ID as a plain-text line, then the copyright line (see below). |
| 2 | **EDITORIAL.** | Opens nearly every issue. 1–5 sentences in a direct voice that set the issue's conceit, sometimes with a quoted tagline. *"Hi. You want to know the truth. We want to tell it to you."* | **A headline, then EDITORIAL.** The headline is the issue's title in its ID. First-person eyewitness voice (see §2). |
| 3 | **Lead feature** | An ALL-CAPS headline (a pun, tabloid style, or a mock news headline), then the piece | The mission's news: how it came to be, who profited, who paid (see §0) |
| 4 | **Departments** | Recurring: **CHEAP TRUTH TOP TEN** (numbered capsules), **INTERVIEW** (Q&A, sometimes with the dead), **GRIPE TIME**, **BULLETIN**, correspondent dispatches | **TOP TEN in every issue**, plus 0–2 others, Gripe Time among them (see §3) |
| 5 | **Images** | Black-and-white found images (engravings, technical diagrams, op-art, silhouettes) dropped into gaps, often running off the edge | **Key photos for every piece** (photo-mode shots and stills captured in play) that carry its story. The zine is **text only**: each photo appears as its caption, and the caption is a link to the photo. ASCII art for the masthead and small decorations (see §8, §9). |
| 6 | **Colophon** | A fixed formula, a new slogan each issue (see §4) | Same formula, V's details. After it, the copyright line and then the issue ID close the file (see below). |

**Length:** the originals ran about 1,200–2,000 words, typically about 1,500, on one sheet printed both sides.

**Issue ID.** The first line of every issue is its own reference in **standard IEEE format**, numbered from **0**: the first main-job issue is `[0]`, the next `[1]`, and so on. **The title is the editorial's headline** (IEEE style: in quotes, first word and proper nouns capitalized). The date is the real-world publication date as **`YYYY:DDD`**: the year, a colon, then the day of the year in three digits (January 1 is `001`, December 31 is `365`, or `366` in a leap year). For example, November 10, 2026 is `2026:314`.

> `[0] Veritas, "<editorial headline>," Cheap Truth, no. 0, Night City, <YYYY:DDD>.`

**Copyright line.** The next line, between the issue ID and the ASCII art, is `NOT COPYRIGHTED ` followed by a lame joke about this issue.

> `NOT COPYRIGHTED <lame joke about this issue>`

**Brackets.** The file closes with the same two lines in reverse order: the copyright line, then the issue ID as **the very last line**. The two pairs bracket the issue. Both copies of each line are identical.

> ```
> [0] Veritas, "<editorial headline>," Cheap Truth, no. 0, Night City, <YYYY:DDD>.
>
> NOT COPYRIGHTED <lame joke>
>
> ...the issue...
>
> NOT COPYRIGHTED <lame joke>
>
> [0] Veritas, "<editorial headline>," Cheap Truth, no. 0, Night City, <YYYY:DDD>.
> ```

---

## 2. Voice

**From the original**
- **Direct address.** It talks to the reader: *"You want to know the truth."*
- **Mock-serious conceits** to open. Issue #3 claims black marketeers are selling *Cheap Truth* "at astronomical prices, some going as high as twelve to thirteen cents."
- **Blunt verdicts.** Capsules end in one hard line: *"Makes more sense than the movie."*
- **Vivid creature metaphors.** *"As American SF lies in a reptilian torpor, its small, squishy cousin, Fantasy, creeps gecko-like across the bookstands."*
- **Tabloid headlines.** *"SF WRITER EATS OWN FOOT TO SURVIVE!"* · *"PUBLIC SHUDDERS AT 'BEST OF THE YEAR'"*
- **A one-line closer** that ends a piece: *"Physician, heal thyself."*
- **Contributors with epithets**, introduced fresh each time: *"CHEAP TRUTH stalwart Sue Denim sharpens her lance and charges the windmill."* · *"guest agitatrix Hunilla de Cholo."*
- **A target.** The original went after the science fiction establishment. *Cheap Truth* 2077 goes after **whoever profits**, wherever the money leads (see §0).

**Night City's voice**
- **First person, eyewitness.** The writer says "I" and tells events as if they watched them happen: across the bar, from the street, through a lens.
- **Never the crew's point of view.** The "I" is never anyone in the crew. No crew member's thoughts or feelings, no "we" doing the job, nothing only the crew could know (their plans, their private talk). The crew is never named.
- **Style over substance.** Cyberpunk 2020's first tenet, applied to the language: attitude, image and rhythm carry the telling. Style governs how it's said. What's said still has to be true (§5).
- **Kind to the street, hard on the ledger.** Hard words go to whoever profits. Never mock anyone for being poor, chromed, desperate or broken. The jokes punch up.
- **The camera, not the gun.** Violence is reported plainly, never celebrated. The narrator is there for the shot, not the score.
- **A photographer's eye.** The narrator notices what a still frame would catch: light, faces, walls, the art on the street.
- Slang: *choom, choomba, eddies, chrome/chromed, output, virtu, flatline, gonk.*
- Profanity is fine.
- Signed **Veritas**.

---

## 3. Departments

Every issue runs the **CHEAP TRUTH TOP TEN**. Add none, one or two of the others; **GRIPE TIME** is one of them.

### Top Ten and Gripe Time: the pattern

The Top Ten, and Gripe Time when it runs, are about **free-running life in Night City** and about **the puzzle**. Together they use the original's four moves, with hard words aimed up (§2: kind to the street).

1. **Execute the lethargic.** The original called the Nebula ballot "a list of stuff that Mom and Dad said it was okay to read" (#5) and handed out verdicts like "Heartening indication that Niven may escape total artistic collapse" (#1). *2077:* trash the dead, safe, paid-for Night City: corp-approved art, places you pay to see, views sold back to the street.
2. **Police the imitators.** The original predicted "pale imitations" of a book it loved (#11) and, in its "sophomore class" satire (#15), mocked its own crowd too: "the kids who wear leather and those funny sunglasses because they would like to think it makes them look tough like real punks." *2077:* call out the fakes: corp ads dressed as street art, chrome worn for the look, the legend business. The zine's own scene included.
3. **Shameless self-hype.** Sterling, as Omniaveritas, reviewed his own story: "Bruce Sterling's 'Cicada Queen' shows this ambitious writer manfully wrestling..." (#6). The zine pushed its friends' novels for the Nebula (#10). *2077:* Veritas hypes the zine's own shots and spots without shame, and never says who took them.
4. **The anonymous shield.** Everyone wrote under a pen name, so they could say what would have cost them in publishing. *2077:* say what would get you flatlined, signed Veritas, crew never named.

**The puzzle.** The extra sections (the Top Ten, the interviews, Gripe Time and the rest) carry hidden clues that walk a player through the FF:06:B5 hunt inside the game. Each clue stands alone. The clues, and where each can hide, are in `Cheap-Truth-screamsheet-CLUES.md`.

**Still open:** which issue carries which clue; whether the step that needs *The Witcher 3* is in.

### The departments

- **CHEAP TRUTH TOP TEN**: ten places around this mission's story: iconic spots, preem photo locations, brilliant art. Night City shown by a free runner who can go anywhere. Each entry gives the place and its district, the shot, the way up, the art if there is any, and a one-line verdict, with a caption linked to the photo taken there.
  `0. [PLACE]. [district]. [the shot]. [the way up]. [the art, if any]. [verdict]`

  **X marks the spot.** The ten places can point at hidden spots on the map.

  - **A line** runs through two of the photo locations.
  - **An X** is where two such lines cross. The X is the marked spot.
  - **A Top Ten can mark up to three spots:** for example the mission's location, a place in the FF:06:B5 hunt, and one more.
  - A marked spot is never one of the ten.
  - **Two dimensions are required.** Height is optional and ambitious: a free runner chooses each place's height (street, balcony, roof, billboard), so a line can also pass through a spot at its real height. The game shows no coordinates or altitude without mods, so heights are estimates.

  **Or: ten finds.** Instead of drawing lines, each of the ten locations is itself something special: a unique item, a secret, an easter egg. If one entry gets this treatment, all ten do.

  **The mission's location** is one of two points: where the quest marker sits to start the job, or where the smoking gun the lead article discusses happened or can be found.

  **What the geometry asks.** One spot takes four places: two chosen freely, and two more each held to a line through the spot. Three spots take six lines and ten places make five pairs, so either a place serves two lines or one line passes through two spots. A far-off spot is harder: a small error in a photo's position swings a distant crossing a long way.

  **Still open:** how the reader is told which two places make a line (fixed pairs, such as neighbours 0-1 and brackets 0-9, or pairs named by a clue elsewhere in the issue); how close a line must pass to count; whether the issue prints the map.
- **STREET ART** (working name): the art found along this mission's route: graffiti, murals, posters, mixed media, film, music, protest. A photo of each, where it was, and who made it, if that's known.
- **INTERVIEW**: a Q&A with someone from the mission.
- **INTERVIEW WITH THE DEAD**: a dead, or believed dead, Cyberpunk 2020 legend, called up at the Afterlife by ordering their drink. It follows the original's pattern (Lovecraft in #3, Chandler in #11, the editor's own "post-mortem" in #17): the dead talk money and refuse to be claimed by the zine. Never the crew. Every interview keeps the original's voice and presentation, including its editorial "we." Two fourth-wall easter eggs interview living, real people as caricatures. The rules and the list of legends are in `Cheap-Truth-screamsheet-INTERVIEWS.md`.
- **GRIPE TIME**: a rant about free-running life in Night City, using the four moves above. The original ran one Gripe Time (#9), in the voice of a fictional editor complaining about ungrateful writers.
- **BULLETIN**: short items and rumors.
- **DISPATCH**: a piece credited to a crew member under an epithet (Jackie, T-Bug).

---

## 4. Colophon

Original formula:

> CHEAP TRUTH, 809-C West 12th Street, Austin, Texas 78701. Vincent Omniaveritas, editing. Todd Refinery, graphics. NOT COPYRIGHTED. "Nothing Better To Do"

*Cheap Truth* 2077 formula:

> CHEAP TRUTH, [in-world address]. Veritas, editing. [name], graphics. NOT COPYRIGHTED. "[slogan for this issue]"
> Veritas - [timestamp, in your draft's format]

Slogans from the original, for reference:
"Xerox pirates, start your engines!" · "SERVING SF THROUGH SAMIZDAT" · "Xerox pirates, to the barricades!" · "Nothing Better To Do" · "The Truth Cannot Be Copyrighted" · "It is better to do something than to be someone" · "Get Nineties!" · "Bored with the Apocalypse" · "The More Things Stay The Same, The More They Change" · "Where Mutation Is the Norm" · "Smugglers in the Marketplace of Ideas" · "Think globally, act locally" · "When the going gets weird, the weird turn pro" · "Ars Longa, Vita Brevis"

---

## 5. Standalone rules

These keep each issue accurate whatever the playing order.

1. **The issue ID is the IEEE reference, numbered from 0** in main-job order. It's fixed to the main job, never "the 12th issue we've put out."
2. **Only write what this mission guarantees.** Check what the game guarantees by that mission. For example, V's Kiroshi eyes only exist from The Ripperdoc on; T-Bug is only known from Practice Makes Perfect or The Rescue on.
3. **No references to other issues.** No "last issue," "next time," "as we reported," and no running counts ("our third gig this week"). *The one exception:* the serial's parts are numbered as parts of a larger story. Each still has to stand on its own if the others aren't read (`Cheap-Truth-screamsheet-SERIAL.md`).
4. **No running totals.** Leave out Street Cred, V's level, and V's total eddies. Report only this mission's own payout.
5. **Introduce people every time**, with a short epithet, as the original did. Any issue may be someone's first.
6. **The timestamp is when the mission was completed,** in the world's time (the game is set in 2077).
7. **Report what actually happened in the game as played**: the choices made, the route taken, who walked away.

---

## 6. Toolkit: the original's tools, applied

The original rarely complained head-on. It took an institution, recast it through a frame you could picture, and let the frame do the arguing. Each frame below is paired with Night City material from the pre-Heist missions.

### Frames

| Original frame | Original example | *Cheap Truth* 2077 frame | Pre-Heist material |
|---|---|---|---|
| **Sick or decaying animal** | "American SF lies in a reptilian torpor" (#1) | **Night City as a body being parted out**: harvested, chromed, rejected | Scavengers keeping Sandra Dorsett on ice (The Rescue) · cyberpsychos · Viktor's €$21,000 bill for new eyes |
| **The ghetto** | "Ghettos are insular places" (#9) | **Watson under lockdown**, literally walled off by the NCPD | The cordon on the drive home (The Rescue) · nobody leaves Watson until The Heist |
| **Smokestack industry** | "publishing remains a smokestack industry" (#5) | **Night City's media and medicine as rusting industries** | Regina's station, FTF Radio, swallowed by News 54 · Trauma Team's platinum tier ("the only kind of love Night City guarantees") |
| **Mom and Dad / the Dean's Office** | "stuff that Mom and Dad said it was okay to read" (#5) · "SON OF KENT STATE" (#10) | **Corps and the NCPD as parents and campus police** | Arasaka's Konpeki Plaza · NCPD cordons · an NCPD officer pushed off her own case (Woman of La Mancha) |
| **Junk food for the brain** | "Junk food for the brain. And what's more, he's proud of it." (#8) | **Braindance, Glitter, and vending-machine dinners** | The Glitter lab (The Heisenberg Principle) · a message about Glitter (Ticket to the Major Leagues) · the Burrito XXL in V's building |
| **Tabloid headline** | "SF WRITER EATS OWN FOOT TO SURVIVE!" (#11) | **Merc-economy tabloid** | Fixers, payouts, drop points · the "PTSD Shield – Policy Lapsed" message (Demons of War) |
| **Cold War / samizdat** | KGB agents scalping *Cheap Truth* at twelve cents (#3) · "SERVING SF THROUGH SAMIZDAT" | **Corp war, and a zine passed hand to hand in Watson** | Militech's convoy and the Maelstrom (The Pickup) · Arasaka (The Heist) |
| **The underground network** | "a globe-spanning network of CHEAP TRUTH shills and xerox pirates" (#2) · "All you need is something to say, and a xerox." (#17) | **Street kids as a network**: art, friends and favors passed hand to hand, with no money in it | Two thieves who met at gunpoint and became friends (The Streetkid) |
| **Turning on itself** | "all movements… tend to breed storm troopers" (#9) · the editor's staged death (#17) | **Turning on merc culture and the legend business, including V's own** | The Afterlife, where legends are made · a crew chasing "the gig of a lifetime" |

### Devices

| Device | Original | *Cheap Truth* 2077 |
|---|---|---|
| **Pen names with labels** | "guest grump Sue Denim" · "guest agitatrix Hunilla de Cholo" · "Our New York correspondent" | Veritas, editing. Crew dispatches under labels (to be named), e.g. a Heywood correspondent, a voice from the net |
| **Fake news with a place line** | "'NODE ZERO' DEMOLISHED! (Austin, Texas November 1986)" | The **news section**: headline, place line, report |
| **Mock interviews** | Lovecraft, Raymond Chandler, the editor himself | **Interview with the Dead**: Cyberpunk 2020 legends called up at the Afterlife (see `Cheap-Truth-screamsheet-INTERVIEWS.md`). Or the shards cyberpsychos leave behind (e.g. "Farewell," Six Feet Under) |
| **Top Ten with verdicts** | "Makes more sense than the movie." · a recommended list with knives in the verdicts | **CHEAP TRUTH TOP TEN**: iconic places, photo spots and art around the mission, rated by a free runner who can go anywhere, using the four moves (§3) |
| **A new slogan each issue** | "Xerox pirates, start your engines!" | A new slogan in each colophon (bank below) |

### Slogan bank (2077 drafts)

"Shard pirates, start your engines!" · "SERVING WATSON THROUGH SAMIZDAT" · "The Truth Cannot Be Chromed" · "Not Copyrighted. Not Insured." · "Unvetted by NetWatch" · "Eddies Optional" · "Pass It On Before It Flatlines"

### Target

The original's primary target was its own field: the science fiction establishment. *Cheap Truth* 2077's target is **whoever profits** (§0). The frames above are ways of telling those stories: the body parted out, the walled-off ghetto, the rusting industry, corps as parents, junk food, the tabloid, corp war, the underground network, and turning the lens on V. The zine's love goes to the street: the people surviving it and the art they leave on it.

---

## 7. Real-world commentary

Primarily, *Cheap Truth* tells the in-game story. Underneath, the way the game itself echoes the real world, it highlights the parallels.

**How the original did it.** It hooked science fiction to the news of its day, by name:
- the Strategic Defense Initiative and the Geneva arms talks: *"SF notions dominate the current Geneva arms talks"* (#13, "POP AGITPROP")
- the Nebula Awards falling on the anniversary of the Kent State shootings (#10, "SON OF KENT STATE")
- Brezhnev-era Soviet fiction, credited *"courtesy of Novosti Press Agency"* (#10)
- MTV and rock video, word processors and videotex (#5)
- Waldenbooks and the spread of chain bookstores (#4)
- Arthur C. Clarke's commercial for *OMNI* magazine (#8)

**How *Cheap Truth* 2077 does it**
- **The in-game story first.** Every issue reads complete as Night City reporting. Most readers will see only that, and that's fine.
- **Woven in, not set apart.** The parallels sit inside the in-game story. There is no separate real-world section.
- **Unnamed.** Real events are never named. Readers who see the likeness find it themselves. Interpretation stays open. *The one exception:* the fourth-wall interviews, easter eggs that name real people on purpose (see `Cheap-Truth-screamsheet-INTERVIEWS.md`).
- **Real indictments.** They are allegories, but not soft ones. Each parallel indicts how the modern corporate world actually works: corporations run things more than governments do.

**Note:** keeping events unnamed lowers the risk. Still avoid details that would point unmistakably at a specific real person.

---

## 8. Imagery

*Cheap Truth* is a vehicle for the photography. **Every piece needs key photos that tell its story.**

**Linked, not embedded.** The zine is Markdown-styled text only. No photo appears on the page. Each photo is its caption, and the caption text is a link to the photo: `[Two kids wake on the pavement, unpaid.](<link to the photo>)`.

- **A lead photo per piece.** It should tell the story on its own, so a reader who only opens the photos still gets it.
- **Supporting photos follow the money:** one for how it came to be, one for who profited, one for who paid.
- **Small pieces get one photo each.** Each Top Ten entry links the photo taken at that place. Each bulletin item links a photo of its subject.
- **Captions:** short, in the eyewitness voice, and they don't name the crew. **The caption is the link.** It has to read well as a line of text, because for most readers it's all they'll see until they click.
- **Sources:** photo-mode shots (free camera, lighting, added characters) and stills captured during play. Many beats are scripted scenes, so check in the game where photo mode is available, and capture during play.
- **The still frame over the score.** The lead photo is the point of the issue, the way the payout is the point of a gig.
- **Shoot the art.** Graffiti, murals, posters, buskers and protest signs along each mission's route are subjects in their own right.
- **ASCII art** is for the masthead and small decorations, not for the story photos. It's the only picture that sits on the page.

- **Black on white.** The whole zine is black on white: the photos, the type, the ASCII art. It's the look of the photocopied original.

**Still open**
- **Where the photos live:** a folder next to each issue, or a host. The link is either a path or a URL.
- **Crew in photos:** the text keeps the crew anonymous. In the photos: shown openly, or kept anonymous (from behind, in silhouette, out of focus, cropped)?
- **Photo conversion:** grayscale, or pure black and white (hard threshold, or a halftone dot pattern like a photocopy)?

---

## 9. Markup

Every issue is a Markdown file written in the most basic Markdown there is, so any browser-side renderer shows it the same way.

- **Text only.** No embedded images (no `![...](...)`). Every photo is its caption, linked: `[caption](photo link)`.
- **CommonMark only.** Use: `#` and `##` headings, paragraphs, `*italic*`, `**bold**`, numbered lists and `-` lists, `---` rules, fenced code blocks, and `[text](link)` links.
- **Nothing beyond it.** No raw HTML, comments included (a renderer in safe mode prints them as text). No tables, footnotes, task lists, strikethrough, or trailing-space line breaks. No underline headings (`===` or `---` under a line of text).
- **Plain ASCII characters.** Straight quotes, `-` for every dash, no `·` or `→`. A page served without a declared encoding can garble anything else.
- **A blank line between every block.** A `---` directly under a line of text turns that line into a heading, and two lines with no blank line between them run together.
- **ASCII art goes in fenced code blocks** (three backticks), so its spacing and backslashes survive.

---

Sources: [FANAC.org — Cheap Truth scans](https://fanac.org/fanzines/Cheap_Truth/) · [Wikipedia — Cheap Truth](https://en.wikipedia.org/wiki/Cheap_Truth) · [SF Encyclopedia — Cheap Truth](https://www.sf-encyclopedia.com/entry/cheap_truth) · [Wikipedia — V (Cyberpunk 2077)](https://en.wikipedia.org/wiki/V_(Cyberpunk_2077))
