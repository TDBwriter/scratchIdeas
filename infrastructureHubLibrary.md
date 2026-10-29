# The Library: A Modern Alexandria

Companion to `infrastructureHubMission.md`. The Level -1 data center becomes a **modern Library of Alexandria**. It holds the wealth of human learning and makes it available to the world as training data, as a place to evaluate AI agents, and as a public library. It is how the mission exports knowledge: over fiber, rather than by sending people abroad.

**Bottom line:**
- **The original library's lesson is fragility.** It was one building, and that building is gone. A modern one must be a **network**. Port-au-Prince originates and curates the collection, and full copies live with independent partners on other continents. A city on an active fault, in a hurricane belt, and under armed-group pressure is the worst possible place to keep the *only* copy.
- **Lawful and open matters more than sheer size.** The library's lasting value is a lawful, provenance-tracked collection that anyone may use. In *Bartz v. Anthropic*, a US court found training on lawfully purchased books to be fair use, but not keeping a central library of pirated copies; the case then settled. Elsewhere the law differs and is still unsettled. A library built on pirated material would lose its legitimacy.
- **Its unique contribution is what the world lacks:**
  - Kreyòl and other low-resource languages.
  - Knowledge of tropical climates, disasters, and sanitation.
  - Evaluation of AI agents under the conditions most of humanity lives in.

---

## 1. What the library holds

| Collection | Contents | Basis |
|---|---|---|
| **Open commons mirror** | Wikipedia in all languages, Project Gutenberg, arXiv, open-access journals, OpenStreetMap, government works, open web-crawl data | Mirrored under each source's license; publisher opt-outs honored |
| **Haitian and Caribbean heritage** | Digitized archives, newspapers, music, art, and oral histories, many damaged in 2010 | Partnerships with Haitian institutions and the Digital Library of the Caribbean, building on the Smithsonian's post-earthquake cultural recovery work |
| **Kreyòl language commons** | Text, recorded speech, translation pairs, and teaching materials | Created by paid Haitian contributors under a community data license (see Section 6) |
| **The teaching city's own knowledge** | Every open-source design, curriculum, manual, and research dataset from the hub | De-identified and approved by the ethics board |
| **Donated and licensed collections** | Works given or licensed explicitly for training and evaluation by authors, publishers, universities, and governments | Signed permissions, recorded for each item |

**Never held:**
- **Pirated works.**
- **Personal data,** including the hub ledger and clinic records, which stay behind the firewall.
- **Security-sensitive details** of the hub's nuclear and physical protection systems, which IAEA physical protection rules require keeping confidential.
- **Works whose creators have opted out.**

## 2. Three services

### Open training data
- **Curated, documented, versioned datasets.** Every item carries its license, its source, and a cryptographic hash, a digital fingerprint that proves it hasn't been altered.
- **A registry of opt-outs that is always honored.** The EU AI Act requires general-purpose AI model providers to respect text-and-data-mining opt-outs and to publish summaries of their training content. The library's provenance records make both easy for anyone who uses it.
- **Equal terms for everyone.** A student in Port-au-Prince and a frontier AI lab get the same access to the collections. There are no exclusive deals, and no one can buy priority.
- **The collections are free; services are paid.** High-income clients pay market rates for space, power, computing, and hosted evaluation, and that revenue funds free energy for locals (see `infrastructureHubEconomics.md`). Paying never buys a better score.

### Agentic evaluation
- **Benchmarks drawn from real tasks in low-resource settings:**
  - Kreyòl clinic intake.
  - Microgrid dispatch.
  - Routing sanitation collection.
  - Translating health guidance.
  - Disaster logistics.

  These run in sandboxed simulations of the hub's systems ("digital twins") built from synthetic data, never real records.
- **Safety testing in low-resource languages.** Research in 2023 showed that safety guardrails could be bypassed by translating harmful prompts into low-resource languages. The library tests models in Kreyòl and other underserved languages.
- **Integrity of the evaluations themselves:**
  - Test sets are kept private so models can't train on them.
  - Results are public.
  - The evaluator is independent, so no lab can buy a score.
- **Sandboxes are fully isolated.** Evaluation clusters are physically and network-separated from the utility and reactor control systems. **AI agents never touch live infrastructure.** This extends the reactor's one-way data rule to the whole building.

### Public library
- **An offline copy at every station and resource center,** using the same approach as offline Wikipedia readers such as Kiwix. The library keeps working when the internet doesn't, and the copies refresh nightly over the hub's own fiber.
- **Open courseware** for every track at the College.
- **Research computing time,** with a reserved share for researchers from low-income countries.

## 3. Built to last

- **"Lots of copies keep stuff safe."** This is the principle behind Stanford's long-running LOCKSS preservation program.
  - **At least three full copies on three continents,** held by independent institutions under different laws and exposed to different hazards.
  - **No two copies on the same fault line or in the same hurricane belt.**
- **Mirrors need maintenance money.** Egypt's Bibliotheca Alexandrina became the Internet Archive's first external backup, covering more than 10 billion web pages from 1996 to 2007. More recent reports suggest the mirror may now be largely offline. A mirror without an upkeep budget decays, the same lesson as Haiti's abandoned facilities. The endowment funds every partner copy's upkeep.
- **Storage chosen by how long it must last:**

| Tier | Medium | Holds | Lifespan |
|---|---|---|---|
| **Hot** | Disk and flash | Active datasets and evaluation workloads | Replaced about every 5 years |
| **Cold** | Magnetic tape (LTO) | The full preservation copy. Tape draws no power while stored. | About 30 years, migrated to new tape on a schedule |
| **Deep** | Archival film or glass | The core collection | Centuries. The precedent is the Arctic World Archive in Svalbard, which holds GitHub's 2020 Arctic Code Vault on film. |

- **Integrity built in:**
  - Every item has a cryptographic hash.
  - The changelog can only be added to, never edited.
  - Mirrors cross-check each other's hashes, so no single authority can quietly alter or erase anything. This is the archive's version of the Multi-Key Council.
  - Legal takedowns are published openly, in the manner of the Lumen database, and removed items stay listed in the log.

## 4. Connectivity: Haiti can't be the world's download server yet

- **Haiti's connection to the internet has been fragile.** In 2010 its only direct fiber link was the BDSNi cable to the Bahamas, with 1.92 Tbps of design capacity, and the 2010 earthquake destroyed its Port-au-Prince terminal. A Digicel-led cable added a second link in 2012. Current capacity is unconfirmed.
- **Haiti is the origin, curation, and evaluation node.** Bulk distribution runs from the partner mirrors, which are better connected.
  - New collections reach the mirrors over fiber where there is capacity, and by shipped storage arrays where there isn't. Shipping drives is how petabytes usually move anyway.
- **A new subsea cable** lands at the North Campus, as the Port-au-Prince plan already calls for, with routes kept physically separate.
- **Evaluation needs little bandwidth.** Agents run where the computers are, and only results travel.

## 5. Computing and power

- **Storage:** start at about 10–20 PB across the network and grow past 100 PB. The Port-au-Prince copy holds the core collection plus the Haitian, Caribbean, and Kreyòl originals.
- **Computing:** the evaluation and dataset-processing cluster fits inside the data center's 20–50 MW budget. Its waste heat goes to the digesters and to hot water, as already planned.
- **Colocation for paying clients** adds 30–60 MW beyond that. It is interruptible: in a power shortage, client load is shed before any local supply.
- **Scheduling follows the energy:** batch jobs run at night on surplus reactor power and at midday on solar, matching the hub's day and night shifts.

## 6. Governance and ethics

- **A Library Board, separate from the Multi-Key Council.** It includes librarians, scholars, language-community representatives, and partner institutions. It sets and publishes the collection policy.
- **Neutrality.** The library removes material only on legal grounds or under the exclusions above. The hub's operators can't remove items for political reasons, and the mirrors abroad would make any such removal visible.
- **Kreyòl speakers control their language data.** Content contributed by the community is open by default for education and public-interest research. Commercial use follows terms the community sets, and the proceeds go to the endowment. **Precedents:**
  - Te Hiku Media wrote its Kaitiakitanga License to keep Māori language data under Māori control.
  - Masakhane shows community-led language technology for African languages.
- **Fair pay for data work.** Annotators, transcribers, and translators are paid professional wages. Anyone who reviews harmful content gets mental-health support. **The counter-example:** in 2023, TIME reported that Kenyan workers labeling harmful content for ChatGPT's safety training were paid less than $2 an hour.
- **The firewall:**
  - Library systems never connect to the hub's operational data.
  - Research data is de-identified through the ethics board.
  - Evaluation sandboxes are isolated from live systems.

## 7. A new professional track

**Library and data science:** librarians, archivists, digitization technicians, data curators, machine-learning engineers, AI evaluators, and Kreyòl linguists and annotators.

**What Haiti can teach the world:** how to build lawful, open collections and evaluations for a low-resource language. That template can serve every underrepresented language community.

## 8. Changes to the build order

- **Phase 1** (needs only people, laptops, and solar):
  - Start the Kreyòl language commons.
  - Put offline library copies in the stations.
  - Begin digitizing Haitian archives.
- **Phase 2:** set up partner mirrors abroad **before** the Port-au-Prince copy holds any unique originals, so everything is copied out first.
- **Phase 3:** open the library and evaluation cluster at Level -1, along with the rest of the data center.
- **Phase 4 and later:** build the deep archive and the full evaluation center.

## Sources
- [Bibliotheca Alexandrina (Wikipedia)](https://en.wikipedia.org/wiki/Bibliotheca_Alexandrina)
- [Brewster Kahle, "Universal Access to All Knowledge" (Long Now)](https://longnow.org/ideas/brewster-kahle--e2-80-9cuniversal-access-to-all-knowledge-e2-80-9d)
- [Internet Archive (Archive Team wiki)](https://wiki.archiveteam.org/index.php/Internet_Archive)
- [Status of the Bibliotheca Alexandrina mirror (Archivarix; unverified)](https://echo.archivarix.net/es/archive/bibliotheca-alexandrina)
- [BDSNi (Wikipedia)](https://en.wikipedia.org/wiki/BDSNi)
- [Digicel leads a project to reconnect Haiti to the global internet (Lightwave)](https://www.lightwaveonline.com/network-design/high-speed-networks/article/16664795/digicel-leads-project-to-reconnect-haiti-to-the-global-internet)
- [Haiti moves forward with the Fibralink submarine cable network (Fierce Network)](https://www.fierce-network.com/telecom/haiti-moves-forward-fibralink-submarine-cable-network)
- [AI copyright cases in 2026 (Norton Rose Fulbright)](https://www.nortonrosefulbright.com/en/knowledge/publications/ce8eaa5f/ai-in-litigation-series-an-update-on-ai-copyright-cases-in-2026)
- [Courts agree: AI training ruled fair use in Bartz and Kadrey (Public Knowledge)](https://publicknowledge.org/courts-agree-ai-training-ruled-as-fair-use-in-bartz-v-anthropic-and-kadrey-v-meta/)
- [AI training data copyright lawsuits tracker](https://ailawsuittracker.com/issues/training-data-copyright/)
- [Bartz v. Anthropic $1.5bn settlement (Vircon Legal)](https://virconlegal.com/bartz-v-anthropic-1-5-billion-copyright-settlement-turkish-law)
