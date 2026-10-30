# Roadmap: warehouse, then garage, then desktop

*Status: plan v0.1, 2026-10-30. Times and amounts of money are rough planning ranges, not quotes; get real quotes before committing to anything. Builds on [design.md](design.md).*

Everything only has to fit in one machine at the desktop stage. Until then, each stage can use separate machines, outside services and bought-in materials, as long as it answers its question and, ideally, pays for itself.

## The four stages

| Stage | Where | Question it answers | What you sell | Gate to the next stage | Rough time | Rough money |
|---|---|---|---|---|---|---|
| 0. Bench | Any room or a makerspace | Can we make a book people want, and will they pay for it? | Sample books, pre-orders | 25+ paid pre-orders or 3 signed letters of intent from businesses; samples pass quick water and page-turn tests; aging tests running | 3–6 months | $10k–30k |
| 1. Warehouse | Small industrial unit | Can refuse become a book that meets spec, repeatably, at a known cost? | Durable editions, to readers and businesses | Your own pages match bought film in tests; 1,000 books made; under 20% scrap; known cost per book; repeat business customers | 12–24 months | Hundreds of thousands |
| 2. Garage | One garage | Can the process run on small, cheap machines with garage utilities, operated by a non-engineer? | Small press sets for schools, libraries and makerspaces; licensed local "book mills" | The set runs on one 240 V circuit and a utility sink; a trained non-engineer makes a book; 3 outside sites running | 12–24 months | Low millions (seed round) |
| 3. Desktop | An office, then a home | Can it be one safe, certified appliance at a price people will pay? | The printer, filter cartridges, a content store | A clear certification path; early units working at 10 outside sites | 2–4 years | Tens of millions (venture) |

## Stage 0: Bench (start now)

The goal is a real book in hand and proof that someone pays for it. None of this needs your own film yet.

### Next 90 days

1. **Make pages.** Buy white opaque PET film, plus clear PET film with high recycled content, from a film distributor. Get access to a 1064 nm fiber laser marker (20–50 W) and a CO2 laser cutter, either desktop units or a makerspace's. Test text contrast, where the char forms in the film, and font sizes down to 9 pt.
2. **Make books.** Hand-bind three 20-page samples on rPET rings; at first, cut the rings from thick PET sheet or rod. Then make a full Frankenstein (114 leaves).
3. **Build the typesetting pipeline.** It takes a Project Gutenberg text, typesets it with Typst, and produces one vector file per page side for the laser. I can build this in this repo.
4. **Start aging tests now.** They're the slowest part of the whole project.
   - Cheap start: put film strips in sealed jars over water inside lab ovens at 60, 70 and 85 °C. Pull strips monthly and test how far they stretch before breaking.
   - Credible numbers: send a parallel set to a commercial test lab.
5. **Talk to 30 potential buyers** across the groups below. Bring the sample, and ask what they'd pay, not whether they like it.
6. **Protect the idea before you show it.**
   - Before any public demo or crowdfunding page, talk to a patent attorney about a provisional application covering the page structure and the page-at-a-time stretcher. In the US you have a year after your own public disclosure to file; most other countries give you no time at all.
   - Run a trademark search on "Barrett Press".
7. **Line up partners.**
   - A university polymer lab, for stretcher time, testing and student projects.
   - A local recycler, to learn the price and supply of PET bales.

### Who might buy first

Test all of these; one will pull harder than the rest.

- **Hospitals, care homes, childcare:** books that can be wiped down with disinfectant.
- **Wet places:** boats, beaches, pools, bathrooms, humid-climate libraries.
- **Corporate "bottles to books" programs:** a company's collected bottles become books donated to local schools. That sells to sustainability budgets, and it can fund the warehouse.
- **Heirloom and gift editions:** a book that outlives its owner.
- **Field and remote use:** expeditions and disaster-resilient libraries.

Be ready for two objections:

- **"It's heavy."** It's about twice the weight of a paperback.
- **"It's plastic."** Answer with a take-back promise: any worn book comes back and becomes a new one.

## Stage 1: Warehouse pilot

The goal is the full loop, refuse to bound book, using separate machines. Buy or outsource anything that isn't the core idea; build the parts that are.

### The line

| Step | Machine | First move |
|---|---|---|
| Feedstock | Post-consumer PET bales from a recycling facility, plus bottle drives (good for the story) | Buy bales |
| Shred | Used industrial granulator | Buy used |
| Wash | Friction washer, float-sink tank, dewatering | **Outsource at first:** buy washed post-consumer flake from a plastics reclaimer. Add your own wash line once the water permits are sorted |
| Dry | Crystallizer and desiccant dryer | Buy; this is standard plastics equipment |
| Additive blends | Twin-screw compounder for the cap-polypropylene core blend and the black-tray laser absorber | **Outsource at first** to a toll compounder (a company that mixes to your recipe) |
| Sheet | Small co-extrusion cast line: two extruders, a 3-layer feedblock, a chill roll | Buy used or pilot-scale |
| Stretch | Page-at-a-time stretcher | **Rent** time on a lab stretcher (for example a university's Brückner KARO-type machine) while you **build your own** rig. Your rig is the core IP and the bridge to the garage and desktop stages |
| Print | Industrial fiber laser marker(s) over a conveyor; CO2 laser cutter | Buy |
| Bind and covers | Ring forming and welding jig; heated platen press for cover boards | Build; the press is about the scale of Precious Plastic's open-source sheet press |
| Quality control | Camera and OCR station; tensile tester, melt flow indexer, humidity chambers | Build the OCR station; outsource the formal tests |

### Before you sign a lease

Check with the city and county:

- Zoning for light manufacturing.
- Air permits for extrusion and laser fumes. These are often minor, sometimes exempt.
- Wastewater discharge rules, if you wash on site.
- Fire code for storing baled plastic.
- Workplace safety basics: machine guarding, lasers, hot surfaces, noise.
- Insurance.

### Team

- **Polymer process engineer (the key hire):** extrusion, drying and film.
- **Mechatronics engineer:** the stretcher.
- **Operator/technician.**
- **You:** sales and funding.
- **Part-time or contract:** typesetting and software.

### What you sell

- Durable editions, direct to readers and to businesses.
- "Bottles to books" programs.
- A crowdfunded first edition, once the line can actually deliver it.

## Stage 2: Garage

The goal is the same process, shrunk to machines a school or makerspace can afford and run. Your warehouse stretcher rig becomes the template.

| Warehouse | Garage version | Precedent |
|---|---|---|
| Industrial granulator | Benchtop shredder | Precious Plastic shredder |
| Wash line | Tub washer with float-sink, and a filter that keeps microplastics out of the drain | — |
| Desiccant dryer | Small vacuum dryer | Lab vacuum ovens |
| Co-extrusion line | Two mini extruders with a small feedblock | Desktop filament extruders |
| Lab stretcher | Your compact page stretcher | Your Stage 1 rig |
| Industrial lasers | Desktop fiber laser and desktop CO2 laser in one enclosure with fume extraction | Desktop laser engravers |
| Binding jig | Hand-operated ring welder | — |

### Design constraints

These drive every design choice:

- **Power:** one 240 V circuit plus ordinary outlets.
- **Water:** a utility sink.
- **Fumes and noise:** fumes vented outdoors or filtered; noise a neighbor can live with.
- **Operator:** one trained non-engineer.
- **Price:** a target set early, for example under $25k for the whole set.

### Business

- Sell or lease press sets, with training.
- License local "book mills": a person or group running one in their town.
- Keep the business programs from Stage 1.
- **Decide here** between open hardware and closed:
  - **Open** (like Precious Plastic) builds a community fast.
  - **Closed** protects the desktop business.
  - A common split is an open garage design with a closed desktop.

## Stage 3: Desktop printer

The goal is one enclosed, certified appliance. It's likely to be office-copier size first, then desktop.

### What changes from the garage set

- **Feed:** it takes rinsed clear PET bottles and their caps only, with a filtered hot-water rinse instead of a caustic wash.
- **Laser absorber:** ships as a small pod of recycled black-tray blend that lasts thousands of pages.
- **Everything else in one enclosure:** one or two micro extruders, the stretcher, both lasers, the trimmer and the ring welder.
- **Fume filters:** a cartridge the owner replaces.

### Certification

Budget months for this:

- **Lasers:** US FDA (CDRH) laser-product reporting, even for a fully enclosed Class 1 product.
- **Electrical safety:** UL or ETL listing in the US, CE marking in Europe.
- **Wireless:** FCC and radio rules, if it has wireless.
- **Europe:** RoHS and WEEE.
- **Children's books:** toy-safety testing, including how much metal leaches out, which covers the antimony in PET. That's CPSIA/ASTM F963 in the US and EN 71-3 in the EU.

### Business

- The hardware sale.
- Filter cartridges.
- A content store: public-domain titles free, modern titles licensed from publishers for a fee per print.
- A take-back program.

**The target price decides which company this is.** A $2,000 appliance and a $20,000 office machine need different engineering, sales channels and funding.

## Money by stage

- **Stage 0:** your own money, friends and family, pre-sales.
- **Stage 1:**
  - Grants: circular-economy and recycling programs. If you apply to the federal SBIR/STTR programs, check first that they're open and funded; their authorization has been in flux.
  - Angel investors.
  - Revenue from "bottles to books" programs.
  - A crowdfunded first edition.
- **Stage 2:** equipment sales and leases, grants for school and library installs, a seed round.
- **Stage 3:** venture or strategic investors. Beverage and packaging companies have sustainability budgets and good reasons to want this.

## Unit economics: track these from the first book

Cost per book is the sum of:

- machine hours × hourly machine cost (equipment, rent and maintenance, spread over the machines' life);
- labor minutes × wage;
- energy;
- feedstock (bales or flake);
- consumables (filters, laser wear);
- covers and rings;
- scrap;
- packaging and shipping.

Measure each one in the warehouse. These are the numbers investors will ask for, and the ones the garage and desktop designs have to beat. Current estimates for one Pride and Prejudice: ~120 bottles, ~25–30 kWh and 4–9 machine-hours.

## Risks that could kill it, and how to find out early

| Risk | Early test |
|---|---|
| Page-at-a-time stretching doesn't give uniform, strong film | Stages 0–1: a rented lab stretcher, then your own rig; map thickness and test tensile strength |
| Lifetime falls far short | Start aging tests in Stage 0; decide on the stabilizer from the data |
| Buyers won't pay for a heavier plastic book | Stage 0 pre-orders and letters of intent |
| Backlash that plastic books shed microplastics | Abrasion tests that measure shedding; a take-back program from day one |
| Permits block washing on site | Outsource washing; ask before leasing |
| The desktop can't be made safe and cheap enough | Make the garage stage a real business on its own, so the desktop is upside rather than survival |

## What I can build in this repo next

- **Typesetting pipeline:** Gutenberg text in, one laser file per page side out. Stage 0 needs it.
- **Unit-economics model:** a spreadsheet or script you fill in as you measure.
- **Customer interview script and one-page pitch** for the buyer groups above.
- **Aging-test plan:** sample counts, a pull schedule, and a script to fit the Arrhenius curve.
