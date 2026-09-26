# Draft: a tech tree through the ages

_Status: proposal for review. Nothing here is in the game yet. Existing techs are marked **(existing)**; their effects stay as they are unless noted. The live content is in `GAME_CONTENT.md`._

## The idea

The Lab's research is split into nine **ages**, from the first village to the present day. Each age ends in a **capstone** tech that opens the next one, so the tree reads as a history of the Realm. Costs rise **exponentially from age to age**, and research speed from each age's own techs rises more slowly, so every age takes noticeably longer than the one before.

## Cost formula

Every tech's Research cost is set by its age and its place within the age:

```
cost(age, step) = 100 × 8^(age − 1) × 1.25^step
```

- `age` runs from 1 (Foundations) to 9 (Current Age).
- `step` is the tech's position in its age, from 0 (entry techs) to about 7 (the capstone).
- **×8 per age:** the first tech of an age costs 8 times the first tech of the age before.
- **×1.25 per step:** within an age, the capstone costs about 5 times the entry techs.

| Age | Name | Base cost (step 0) | Capstone (step 7) |
| --- | --- | --- | --- |
| I | Foundations | 100 | ~480 |
| II | Classical | 800 | ~3.8K |
| III | Medieval | 6.4K | ~31K |
| IV | Renaissance | 51K | ~250K |
| V | Industrial | 410K | ~2M |
| VI | Electric | 3.3M | ~16M |
| VII | Atomic | 26M | ~130M |
| VIII | Information | 210M | ~1B |
| IX | Current Age | 1.7B | ~8B |

The costs in the tables below are this formula, rounded to friendly numbers. Materials paid when a tech is started follow the Realm's own progression: early ages ask for Wood, Stone and Food, later ones for Steel, Glass and Gold, and the last three ages for new resources (see Open questions).

## Pacing: research speed has to keep up

Costs grow ×8 per age. If each age's techs, buildings and resets raise Research/s by about **×3**, each age takes about **2.7× as long** as the last. That is the "rapidly harder" feel, without walls that can't be climbed.

Each age's techs add up to roughly 20× its base cost, so an age takes about `20 × base ÷ Research/s`:

| Age | All techs in the age | Research/s during the age (target) | Time to clear the age (rough) |
| --- | --- | --- | --- |
| I | ~2K | 5 | 7 min |
| II | ~16K | 15 | 18 min |
| III | ~130K | 50 | 45 min |
| IV | ~1M | 150 | 2 h |
| V | ~8M | 500 | 4.5 h |
| VI | ~65M | 1.5K | 12 h |
| VII | ~500M | 5K | 1.2 days |
| VIII | ~4B | 15K | 3 days |
| IX | ~35B | 50K | 8 days |

Echo-shop upgrades and resets are expected to shorten the later ages a lot. The research multipliers in the tables are sized to hit roughly these targets.

## The tree

### Age I: Foundations (base 100)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Settlements **(existing)** | 50 | — | — | Population growth ×1.1 |
| Scientific Method **(existing)** | 50 | — | — | Research ×1.25 |
| Agriculture **(existing)** | 100 | — | Settlements | Food ×2, Farms |
| Pottery _(new)_ | 100 | 50 Clay | Settlements | Clay ×1.25; Kilns use 25% less Wood |
| Mining **(existing)** | 120 | 60 Stone | Scientific Method | Mines |
| Housing **(existing)** | 150 | — | Settlements | Houses, crowding −10% |
| Warehousing **(existing)** | 150 | 100 Wood | Scientific Method | Warehouses |
| Basic Machinery **(existing)** | 150 | 40 Planks | Scientific Method | Planks and Bricks ×2 |
| Forestry **(existing)** | 250 | 200 Wood | Scientific Method | Forest regrows ×2 |
| **Writing** _(new, capstone)_ | 480 | 100 Planks | Agriculture, Mining | Research ×1.5; opens Age II |

### Age II: Classical (base 800)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Metallurgy **(existing, re-costed)** | 800 | 50 Iron | Writing | Iron ×1.5 |
| Currency **(existing, re-costed)** | 800 | 50 Gold | Writing | Gold ×1.15, Markets |
| Geology **(existing, re-costed)** | 1K | 200 Stone | Mining, Writing | Stone ×1.2, Gold Mines |
| Medicine **(existing, re-costed)** | 1.2K | 300 Food | Writing | Crowding −30%, accidents −30% |
| Cartography **(existing, repeatable)** | 800, ×2 per level | — | Writing | +1 land each, kept through resets |
| Rationalism **(existing, repeatable)** | 1.2K, ×1.6 per level | — | Writing | Research ×1.3, Mana ×0.8 each |
| Aqueducts _(new)_ | 1.6K | 150 Bricks | Medicine | Aqueducts; starvation −25% |
| Mathematics _(new)_ | 2K | — | Writing | Research ×1.5 |
| **Engineering** **(existing, capstone)** | 3.8K | 200 Planks | Geology, Metallurgy, Mathematics | Planks and Bricks ×1.25; opens Age III |

### Age III: Medieval (base 6.4K)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Logistics **(existing, re-costed)** | 6.4K | 300 Planks | Engineering | Realm build speed ×1.3 |
| Occultism **(existing, re-costed from 10K)** | 6.4K | — | Engineering | Mana ×1.1; lets the Realm raise a Shrine (opens Arcana) |
| Optics **(existing, re-costed)** | 8K | 100 Bricks | Engineering | All Lab production ×1.1, Glassworks |
| Guilds _(new)_ | 8K | 200 Gold | Engineering | Realm costs ×0.9; Builders' Guild ×2 as strong |
| Sanitation **(existing, re-costed)** | 10K | 300 Bricks | Medicine, Engineering | Crowding −40%, accidents −20% |
| Sailing **(existing, re-costed)** | 10K | 400 Planks | Cartography, Engineering | Food ×1.15 |
| Arcane Theory **(existing, re-costed)** | 12K | 60 Essence | Occultism | Essence ×1.3 |
| Universities _(new)_ | 16K | 200 Bricks | Optics | Research ×1.5; University building |
| **Printing** **(existing, capstone)** | 31K | 300 Planks | Universities | Research ×1.5 (up from ×1.2); opens Age IV |

### Age IV: Renaissance (base 51K)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Navigation **(existing, re-costed)** | 51K | 60 Glass | Sailing, Printing | Gold ×1.25 |
| Banking _(new)_ | 51K | 300 Gold | Currency, Printing | Gold ×1.5; Market ×2 as strong |
| Scientific Instruments _(new)_ | 64K | 150 Glass | Optics, Printing | Research ×1.5; Observatories ×2 as strong |
| Expedition **(existing, repeatable)** | 64K, ×1.3 per level | 1K Food | Navigation | +5 land each, kept through resets |
| Chemistry _(new)_ | 80K | 100 Glass, 200 Coal | Printing | Coal ×1.5; Glass ×1.25 |
| Anatomy _(new)_ | 100K | 500 Food | Medicine, Printing | Accidents −25%, starvation −25% |
| **Enlightenment** _(new, capstone)_ | 250K | 200 Gold | Scientific Instruments, Chemistry | Research ×2; Mana ×0.9; opens Age V |

### Age V: Industrial (base 410K)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Industrialization **(existing, re-costed)** | 410K | 300 Iron | Enlightenment | Realm costs ×0.85, +8 pollution |
| Steam Power _(new)_ | 500K | 200 Steel | Industrialization | All Realm production ×1.5; +4 pollution |
| Filtration **(existing, re-costed)** | 640K | 300 Iron | Industrialization, Medicine | Pollution −50% |
| Railways _(new)_ | 800K | 400 Steel | Steam Power | Realm build speed ×1.5; Warehouse spoilage −50% |
| Environmental Science **(existing, re-costed)** | 800K | 150 Glass | Forestry, Filtration | Forest regrows ×2, pollution −20%, Parks |
| Precision Tools _(new)_ | 1M | 300 Steel | Steam Power | Workshops and Foundries ×1.5 as strong |
| **Electricity** _(new, capstone)_ | 2M | 500 Steel, 300 Glass | Railways, Precision Tools | Research ×2; opens Age VI |

### Age VI: Electric (base 3.3M)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Telegraph _(new)_ | 3.3M | 500 Steel | Electricity | All Lab production ×1.5 |
| Fertilizers _(new)_ | 3.3M | 1K Coal | Electricity, Chemistry | Food ×2; +3 pollution |
| Thaumic Physics **(existing, re-costed)** | 4M | 20 Aether | Rationalism, Arcane Theory, Electricity | Aether ×2, all Lab production ×1.5 |
| Vaccines _(new)_ | 5M | 1K Food | Anatomy, Electricity | Accidents −50%, starvation −50% |
| Combustion Engine _(new)_ | 6.4M | 800 Steel | Electricity | All Realm production ×1.5; +6 pollution |
| **Mass Production** _(new, capstone)_ | 16M | 1K Steel | Combustion Engine, Telegraph | Realm costs ×0.7; Mana ×0.9; opens Age VII |

### Age VII: Atomic (base 26M)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Automation **(existing, re-costed)** | 26M | 1K Steel | Mass Production | All Realm production ×1.5 |
| Radio _(new)_ | 26M | 500 Glass | Mass Production | Research ×1.5 |
| Green Revolution _(new)_ | 40M | 2K Food | Fertilizers, Mass Production | Food ×3 |
| Plastics _(new)_ | 50M | new: Oil | Mass Production | Opens a Refinery (Coal → Plastics) |
| Antibiotics _(new)_ | 64M | 500 Glass | Vaccines | Accidents −50%; Healing Light ×2 as strong |
| **Nuclear Physics** _(new, capstone)_ | 130M | new: Uranium | Radio, Automation | Research ×2; Mana ×0.8; opens Age VIII |

### Age VIII: Information (base 210M)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Transistors _(new)_ | 210M | new: Silicon | Nuclear Physics | Opens Chip Fabs (Glass + Gold → Electronics) |
| Computers _(new)_ | 300M | Electronics | Transistors | Research ×2 |
| Globalization _(new)_ | 300M | 5K Gold | Nuclear Physics | Gold ×2; +10 land (kept) |
| Genetics _(new)_ | 400M | Electronics | Computers, Antibiotics | Population growth ×2; accidents −50% |
| Satellites _(new)_ | 500M | Electronics, Steel | Computers | +20 land (kept); Observatories ×2 as strong |
| **The Internet** _(new, capstone)_ | 1B | Electronics | Computers | All Lab production ×2; Mana ×0.8; opens Age IX |

### Age IX: Current Age (base 1.7B)

| Tech | Research | Materials | Needs | Effect |
| --- | --- | --- | --- | --- |
| Renewable Energy _(new)_ | 1.7B | Electronics, Steel | The Internet | Pollution −90% |
| Gene Editing _(new)_ | 2B | Electronics | Genetics | Population growth ×2; starvation −75% |
| Space Flight _(new, repeatable)_ | 2.5B, ×1.5 per level | Steel, Electronics | Satellites | +25 land each (kept) |
| Machine Learning _(new)_ | 3B | Electronics | The Internet | Research ×3 |
| Quantum Computing _(new)_ | 4B | Electronics | Machine Learning | All Lab production ×2 |
| **Artificial Intelligence** _(new, capstone)_ | 8B | Electronics | Machine Learning, Quantum Computing | All production in every world ×3; achievement: "Singularity" |

## How this fits the existing game

- **Science against magic:** every capstone from Enlightenment on weakens Mana a little (×0.8 to ×0.9), continuing what Rationalism already does. The modern world squeezes Arcana, so players balance Lab progress against their spells.
- **Thaumic Physics** is the one bridge back: modern science that feeds Arcana, now placed in the Electric age.
- **Existing techs move and get re-costed** into their age. Most get more expensive (for example Engineering 200 → 3.8K, Printing 800 → 31K). Occultism gets cheaper (10K → 6.4K) because it now sits in the Medieval age.
- **Printing** is buffed from ×1.2 to ×1.5 Research as an age capstone.
- **The research tree view** would group columns by age with an age header, and the Lab tab would show the current age ("Age III: Medieval").

## Open questions

1. **New resources for the last three ages:** Oil, Plastics, Uranium, Silicon and Electronics don't exist yet. Each needs a producer building (for example a Refinery or a Chip Fab), a storage cap and a place in the Realm's economy. Alternatively, the late ages could use only existing resources in larger amounts, which is simpler but less flavourful.
2. **Are 9 ages and ~8 days of play the right length?** The ×8 per age and ×1.25 per step can be tuned: ×6 per age makes the tree roughly half as long, and ×10 per age makes it much longer.
3. **Research speed buildings:** late ages need Research/s in the thousands. That needs either more research buildings (a Research Institute or Laboratory Complex per age), stronger Scholars, or Echo-shop research upgrades.
4. **Resets:** should reaching a new age be kept through Lab resets, like Cartography and Expeditions, so a reset doesn't send you back to the Stone Age? One option is to keep capstones but not the other techs.
5. **Achievements:** one per age reached, for example "Industrial Revolution" for opening Age V.
