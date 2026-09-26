# Draft: a tech tree through the ages

_Status: proposal for review. Nothing here is in the game yet. Existing techs are marked **(existing)**; their effects stay as they are unless noted. The live content is in `GAME_CONTENT.md`. Tables are generated from the formula below, so the numbers are consistent with it._

## Decisions so far

- **×10 per age.** Each age starts at 10 times the cost of the one before, so there are real gaps between the eras. Research speed will come from many sources, including permanent upgrades, so the jumps are there to be climbed.
- **Finish an age to leave it.** An age's capstone can only be researched once **every other tech of that age is done** (repeatable techs count once they have their first level). The capstone then opens the next age.
- **New resources come from the Realm.** The late ages need Machine Parts, Oil, Plastics, Uranium, Silicon and Electronics, each made by a new Realm building that one of the age's techs unlocks.
- **Lab research does not survive resets.** A Lab reset sends the Lab back to Age I, and every age has to be researched again.
- **Achievements make ages easier next time.** Researching every tech of an age once earns that age's achievement, with a lasting bonus (mostly to research speed). Each run climbs the early ages faster than the last.

## Cost formula

```
cost(age, step) = 100 × 10^(age − 1) × 1.25^step
```

- `age` runs from 1 (Foundations) to 9 (Current Age).
- `step` is the tech's position within its age, from 0; the capstone is always last.
- **×10 per age**, **×1.25 per step**: within an age the capstone costs 3–5 times the first tech.
- Numbers are rounded to two significant digits. Repeatable techs use the formula for their first level and keep their own growth per level.

| Age | Name | First tech | Capstone | All techs in the age (first levels) |
| --- | --- | --- | --- | --- |
| I | Foundations | 100 | 750 | 3.3K |
| II | Classical | 1K | 6K | 26K |
| III | Medieval | 10K | 60K | 259K |
| IV | Renaissance | 100K | 380K | 1.5M |
| V | Industrial | 1M | 3.8M | 15M |
| VI | Electric | 10M | 31M | 113M |
| VII | Atomic | 100M | 380M | 1.5B |
| VIII | Information | 1B | 3.8B | 15B |
| IX | Current Age | 10B | 31B | 113B |

## Pacing

Costs grow ×10 per age. Research speed has to grow too, from each age's own research techs, new research buildings, resets and permanent upgrades. The table shows how long an age takes at a given research speed, to help tune those sources. If research speed grows ×4 per age, each age takes about 2.5 times as long as the one before:

| Age | All techs | Research/s during the age | Time |
| --- | --- | --- | --- |
| I | 3.3K | 5 | 11 min |
| II | 26K | 20 | 22 min |
| III | 259K | 80 | 54 min |
| IV | 1.5M | 320 | 1.3 h |
| V | 15M | 1.3K | 3.3 h |
| VI | 113M | 5.1K | 6.1 h |
| VII | 1.5B | 20K | 20.5 h |
| VIII | 15B | 82K | 2.1 days |
| IX | 113B | 328K | 4.0 days |

## The tree

### Age I: Foundations (first tech 100)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Settlements **(existing)** | 100 | — | — | Population growth ×1.1 |
| 1 | Scientific Method **(existing)** | 120 | — | — | Research ×1.25 |
| 2 | Agriculture **(existing)** | 160 | — | Settlements | Food ×2; Farms |
| 3 | Pottery _(new)_ | 200 | 50 Clay | Settlements | Clay ×1.25; Kilns use 25% less Wood |
| 4 | Mining **(existing)** | 240 | 60 Stone | Scientific Method | Mines |
| 5 | Housing **(existing)** | 310 | — | Settlements | Houses; crowding −10% |
| 6 | Warehousing **(existing)** | 380 | 100 Wood | Scientific Method | Warehouses |
| 7 | Basic Machinery **(existing)** | 480 | 40 Planks | Scientific Method | Planks and Bricks ×2 |
| 8 | Forestry **(existing)** | 600 | 200 Wood | Scientific Method | Forest regrows ×2 |
| 9 | **Writing** _(new)_ capstone | 750 | 100 Planks | **every other Age I tech** | Research ×1.5; opens Age II |

### Age II: Classical (first tech 1K)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Metallurgy **(existing)** | 1K | 50 Iron | Writing | Iron ×1.5 |
| 1 | Currency **(existing)** | 1.2K | 50 Gold | Writing | Gold ×1.15; Markets |
| 2 | Geology **(existing)** | 1.6K | 200 Stone | Mining, Writing | Stone ×1.2; Gold Mines |
| 3 | Medicine **(existing)** | 2K | 300 Food | Writing | Crowding −30%; accidents −30% |
| 4 | Cartography **(existing)** repeatable | 2.4K (first level) | — | Writing | +1 land per level, kept through resets |
| 5 | Rationalism **(existing)** repeatable | 3.1K (first level) | — | Writing | Research ×1.3, Mana ×0.8 per level |
| 6 | Aqueducts _(new)_ | 3.8K | 150 Bricks | Medicine | Aqueducts; starvation −25% |
| 7 | Mathematics _(new)_ | 4.8K | — | Writing | Research ×1.5 |
| 8 | **Engineering** **(existing)** capstone | 6K | 200 Planks | **every other Age II tech** | Planks and Bricks ×1.25; opens Age III |

### Age III: Medieval (first tech 10K)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Logistics **(existing)** | 10K | 300 Planks | Engineering | Realm build speed ×1.3 |
| 1 | Occultism **(existing)** | 12K | — | Engineering | Mana ×1.1; Shrines (open Arcana) |
| 2 | Optics **(existing)** | 16K | 100 Bricks | Engineering | All Lab production ×1.1; Glassworks |
| 3 | Guilds _(new)_ | 20K | 200 Gold | Engineering | Realm costs ×0.9; Builders' Guilds ×2 as strong |
| 4 | Sanitation **(existing)** | 24K | 300 Bricks | Medicine, Engineering | Crowding −40%; accidents −20% |
| 5 | Sailing **(existing)** | 31K | 400 Planks | Cartography, Engineering | Food ×1.15 |
| 6 | Arcane Theory **(existing)** | 38K | 60 Essence | Occultism | Essence ×1.3 |
| 7 | Universities _(new)_ | 48K | 200 Bricks | Optics | Research ×1.5; Universities |
| 8 | **Printing** **(existing)** capstone | 60K | 300 Planks | **every other Age III tech** | Research ×1.5 (up from ×1.2); opens Age IV |

### Age IV: Renaissance (first tech 100K)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Navigation **(existing)** | 100K | 60 Glass | Sailing, Printing | Gold ×1.25 |
| 1 | Banking _(new)_ | 120K | 300 Gold | Currency, Printing | Gold ×1.5; Markets ×2 as strong |
| 2 | Scientific Instruments _(new)_ | 160K | 150 Glass | Optics, Printing | Research ×1.5; Observatories ×2 as strong |
| 3 | Expedition **(existing)** repeatable | 200K (first level) | 1K Food | Navigation | +5 land per level, kept through resets |
| 4 | Chemistry _(new)_ | 240K | 100 Glass, 200 Coal | Printing | Coal ×1.5; Glass ×1.25 |
| 5 | Anatomy _(new)_ | 310K | 500 Food | Medicine, Printing | Accidents −25%; starvation −25% |
| 6 | **Enlightenment** _(new)_ capstone | 380K | 200 Gold | **every other Age IV tech** | Research ×2; Mana ×0.9; opens Age V |

### Age V: Industrial (first tech 1M)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Industrialization **(existing)** | 1M | 300 Iron | Enlightenment | Realm costs ×0.85; +8 pollution |
| 1 | Steam Power _(new)_ | 1.2M | 200 Steel | Industrialization | All Realm production ×1.5; +4 pollution |
| 2 | Filtration **(existing)** | 1.6M | 300 Iron | Industrialization, Medicine | Pollution −50% |
| 3 | Railways _(new)_ | 2M | 400 Steel | Steam Power | Realm build speed ×1.5; Warehouse spoilage −50% |
| 4 | Environmental Science **(existing)** | 2.4M | 150 Glass | Forestry, Filtration | Forest regrows ×2; pollution −20%; Parks |
| 5 | Precision Tools _(new)_ | 3.1M | 300 Steel | Steam Power | Workshops and Foundries ×1.5 as strong; **Machine Shops** (new resource: Machine Parts) |
| 6 | **Electricity** _(new)_ capstone | 3.8M | 500 Steel, 100 Machine Parts | **every other Age V tech** | Research ×2; opens Age VI |

### Age VI: Electric (first tech 10M)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Telegraph _(new)_ | 10M | 200 Machine Parts | Electricity | All Lab production ×1.5 |
| 1 | Fertilizers _(new)_ | 12M | 1K Coal | Electricity, Chemistry | Food ×2; +3 pollution |
| 2 | Thaumic Physics **(existing)** | 16M | 20 Aether | Rationalism, Arcane Theory, Electricity | Aether ×2; all Lab production ×1.5 |
| 3 | Vaccines _(new)_ | 20M | 1K Food | Anatomy, Electricity | Accidents −50%; starvation −50% |
| 4 | Combustion Engine _(new)_ | 24M | 300 Machine Parts | Electricity | All Realm production ×1.5; +6 pollution; **Oil Wells** (new resource: Oil) |
| 5 | **Mass Production** _(new)_ capstone | 31M | 500 Machine Parts, 500 Oil | **every other Age VI tech** | Realm costs ×0.7; Mana ×0.9; opens Age VII |

### Age VII: Atomic (first tech 100M)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Automation **(existing)** | 100M | 500 Machine Parts | Mass Production | All Realm production ×1.5 |
| 1 | Radio _(new)_ | 120M | 500 Glass, 200 Machine Parts | Mass Production | Research ×1.5 |
| 2 | Green Revolution _(new)_ | 160M | 2K Food | Fertilizers, Mass Production | Food ×3 |
| 3 | Polymers _(new)_ | 200M | 1K Oil | Mass Production | **Refineries** (new resource: Plastics) |
| 4 | Antibiotics _(new)_ | 240M | 200 Plastics | Vaccines | Accidents −50%; Healing Light ×2 as strong |
| 5 | Radioactivity _(new)_ | 310M | 300 Machine Parts | Mass Production | **Uranium Mines** (new resource: Uranium) |
| 6 | **Nuclear Physics** _(new)_ capstone | 380M | 100 Uranium | **every other Age VII tech** | Research ×2; Mana ×0.8; opens Age VIII |

### Age VIII: Information (first tech 1B)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Semiconductors _(new)_ | 1B | 500 Plastics | Nuclear Physics | **Silicon Works** (new resource: Silicon) |
| 1 | Transistors _(new)_ | 1.2B | 200 Silicon | Semiconductors | **Chip Fabs** (new resource: Electronics) |
| 2 | Globalization _(new)_ | 1.6B | 2K Gold | Nuclear Physics | Gold ×2; +10 land (kept) |
| 3 | Computers _(new)_ | 2B | 100 Electronics | Transistors | Research ×2 |
| 4 | Genetics _(new)_ | 2.4B | 100 Electronics | Computers, Antibiotics | Population growth ×2; accidents −50% |
| 5 | Satellites _(new)_ | 3.1B | 150 Electronics, 1K Steel | Computers | +20 land (kept); Observatories ×2 as strong |
| 6 | **The Internet** _(new)_ capstone | 3.8B | 300 Electronics | **every other Age VIII tech** | All Lab production ×2; Mana ×0.8; opens Age IX |

### Age IX: Current Age (first tech 10B)

| Step | Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- | --- |
| 0 | Renewable Energy _(new)_ | 10B | 300 Electronics, 2K Steel | The Internet | Pollution −90% |
| 1 | Gene Editing _(new)_ | 12B | 300 Electronics | Genetics | Population growth ×2; starvation −75% |
| 2 | Space Flight _(new)_ repeatable | 16B (first level) | 500 Electronics, 2K Steel | Satellites | +25 land per level (kept) |
| 3 | Machine Learning _(new)_ | 20B | 500 Electronics | The Internet | Research ×3 |
| 4 | Quantum Computing _(new)_ | 24B | 800 Electronics | Machine Learning | All Lab production ×2 |
| 5 | **Artificial Intelligence** _(new)_ capstone | 31B | 1K Electronics | **every other Age IX tech** | All production in every world ×3 |

## Age achievements

Reached the first time every tech of an age is researched in one run, capstone included (repeatable techs need one level). Like all achievements they are kept for good, through every reset, and their bonuses stack.

| Age | Achievement | Lasting reward |
| --- | --- | --- |
| I | Out of the Stone Age | Research ×1.25; every Realm run starts with 1 more person |
| II | Classical Education | Research ×1.25; Scholars cost 25% less |
| III | Keepers of Knowledge | Research ×1.5; materials for Lab techs cost 20% less |
| IV | Age of Discovery | Research ×1.5; +5 squares of land |
| V | Industrial Revolution | Research ×1.5; all Realm production ×1.25 |
| VI | Let There Be Light | Research ×2 |
| VII | Splitting the Atom | Research ×2; Realm costs ×0.9 |
| VIII | Information Superhighway | Research ×2; all Lab production ×1.5 |
| IX | Singularity | All production in every world ×2 |

Once all are earned, the research bonuses multiply Research/s by about ×42 (×1.25 × 1.25 × 1.5 × 1.5 × 1.5 × 2 × 2 × 2), or about ×63 counting Information Superhighway's extra ×1.5 to all Lab production. They are the main permanent source of research speed in this draft, alongside Echo-shop upgrades still to be designed. Because they only count for later runs, the first climb through the ages is the slow one.

## New Realm resources

Each comes from a new Realm building, unlocked by a tech in the age that first needs it. Like the other Realm resources they have a storage cap that Warehouses raise, and the raw ones come from deposits that run out.

| Resource | Made by (new building) | Unlocked by | How it works | Storage | Used for |
| --- | --- | --- | --- | --- | --- |
| Machine Parts | Machine Shop | Precision Tools (V) | Turns 1 Steel/s and 0.2 Coal/s into 0.1 Parts/s | 200 | Late Industrial and Electric techs, Warehouses |
| Oil | Oil Well + new job: Drillers | Combustion Engine (VI) | A deposit like the mines: each Oil Well opens up 10K Oil and clears 400 Wood of forest; Drillers pump it (risky work) | 500 | Mass Production, Plastics |
| Plastics | Refinery | Polymers (VII) | Turns 1 Oil/s into 0.2 Plastics/s; +3 pollution | 300 | Atomic and Information techs, Chip Fabs |
| Uranium | Uranium Mine + new job: Uranium Miners | Radioactivity (VII) | A deposit: each mine opens up 1K Uranium; the most dangerous job in the game | 100 | Nuclear Physics, a late power building |
| Silicon | Silicon Works | Semiconductors (VIII) | Refines 2 Stone/s and 0.3 Coal/s into 0.1 Silicon/s | 300 | Transistors, Chip Fabs |
| Electronics | Chip Fab | Transistors (VIII) | Turns 0.5 Silicon/s, 0.1 Plastics/s and 0.05 Gold/s into 0.05 Electronics/s | 100 | Information and Current Age techs |

Electronics sits at the end of the longest production chain in the game: Silicon (refined from Stone and Coal), Plastics (refined from pumped Oil) and mined Gold all feed the Chip Fabs. So the last ages lean on everything the Realm has built up.

## How this fits the existing game

- **Science against magic:** every capstone from Enlightenment on weakens Mana a little (×0.8 to ×0.9), continuing what Rationalism already does. The modern world squeezes Arcana, so players balance Lab progress against their spells.
- **Thaumic Physics** is the one bridge back: modern science that feeds Arcana, now in the Electric age.
- **Existing techs move and get re-costed** into their age. Most get more expensive, for example Engineering 200 → 6K and Printing 800 → 60K. Occultism moves to the Medieval age at 12K (from 10K).
- **Printing** is buffed from ×1.2 to ×1.5 Research as an age capstone.
- **The research tree view** would group its columns by age with an age header, and the Lab tab would show the current age, for example "Age III: Medieval · 6 of 9 techs done".

## Still open

1. **Land techs and resets:** Cartography and Expedition are kept through Lab resets today, so explored land isn't lost. The draft adds three more land techs (Globalization, Satellites, Space Flight). Should those five stay the exception, or be reset like everything else, with land perhaps moved into achievements instead?
2. **Research speed sources:** which new research buildings and Echo-shop upgrades, and in which ages. The pacing table gives the targets.
3. **Tuning:** the achievement rewards and the new buildings' numbers are first guesses.
