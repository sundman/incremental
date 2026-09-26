# Incremental Worlds: game content

_Generated from `src/engine/content.ts` by `npm run docs`. Do not edit by hand: a test fails when this file is out of date._

## Worlds

Three worlds that feed and hinder each other. Resetting a world earns Echoes to spend in the Echo shop.

| World | About | How it opens |
| --- | --- | --- |
| Realm | Feed your people, put them to work, and raise buildings. | Open from the start. |
| Lab | Fund scholars and push the tech tree. | Build a Library in the Realm. It is made of Planks and Bricks, so it needs a Sawmill and a Kiln first. |
| Arcana | Draw on Mana and discover stranger magic. | Open the Lab and research Occultism, then build a Shrine in the Realm. |

## Realm rules

- A Realm run starts with 2 people, 50 Food and housing for 3.
- People arrive at 3/min while there is free housing, each eating 10 Food to move in.
- Everyone eats 0.1 Food/s. Without Food, one person starves every 30s (less when some Food still comes in); starvation never takes the last 2.
- Growth is divided by 1 + 0.02 × crowding and by 1 + 0.03 × pollution.
- The Realm has 20 squares of land; every building level takes one.
- Every worker has a chance each second of dying at work (see Jobs).
- A summoned demon horde starts at 1 and doubles every 3m 00s, until only 2 people are left.
- Storage is capped per resource; production past the cap is lost. Goods kept in Warehouses slowly spoil.
- On a Realm reset, the forest grows by 1% of the Wood cut that run per Rich Earth level.

## Resources

| Resource | World | Storage | Echo value | Appears with |
| --- | --- | --- | --- | --- |
| Wood | Realm | 1K | 1 | — |
| Stone | Realm | 1K | 1.5 | — |
| Food | Realm | 1K | 1 | — |
| Clay | Realm | 500 | 2 | Clay Pit |
| Planks | Realm | 500 | 4 | Sawmill |
| Bricks | Realm | 500 | 5 | Kiln |
| Iron | Realm | 300 | 6 | Mine |
| Coal | Realm | 300 | 5 | Coal Mine |
| Steel | Realm | 200 | 25 | Blast Furnace |
| Glass | Realm | 150 | 20 | Glassworks |
| Gold | Realm | 100 | 60 | Gold Mine |
| Runestone | Realm | 100 | 80 | Runesmith |
| Machine Parts | Realm | 200 | 40 | Machine Shop |
| Oil | Realm | 500 | 30 | Oil Well |
| Plastics | Realm | 300 | 60 | Refinery |
| Uranium | Realm | 100 | 200 | Uranium Mine |
| Silicon | Realm | 300 | 80 | Silicon Works |
| Electronics | Realm | 100 | 400 | Chip Fab |
| Research | Lab | Unlimited | 2 | — |
| Mana | Arcana | 300 | 1.5 | — |
| Essence | Arcana | Unlimited | 15 | Condenser |
| Fire Essence | Arcana | Unlimited | 40 | Fire Altar |
| Life Essence | Arcana | Unlimited | 40 | Life Spring |
| Shadow Essence | Arcana | Unlimited | 60 | Shadow Well |
| Time Essence | Arcana | Unlimited | 150 | Time Loom |
| Aether | Arcana | Unlimited | 120 | Aether Rift |

## Deposits

Realm resources are dug from deposits that run out. Buildings open up more.

| Deposit | Resource | Starting size | Refills on its own | Opened up by |
| --- | --- | --- | --- | --- |
| 🌲 Forest | Wood | 8K | 0.25/s (slowed by pollution) | Oil Well −400, Uranium Mine −400, Quarry −500, Clay Pit −300, Mine −400, Coal Mine −400, Gold Mine −400 |
| 🪨 Stone quarries | Stone | 0 | No | Quarry +5K |
| 🟫 Clay beds | Clay | 0 | No | Clay Pit +3K |
| ⚫ Coal seams | Coal | 0 | No | Coal Mine +4K |
| ⛏️ Iron veins | Iron | 0 | No | Mine +3K |
| 🪙 Gold seams | Gold | 0 | No | Gold Mine +500 |
| 🛢️ Oil fields | Oil | 0 | No | Oil Well +10K |
| ☢️ Uranium ore | Uranium | 0 | No | Uranium Mine +1K |

## Jobs

| Job | Makes | Per worker | Accident risk | Needs | Also |
| --- | --- | --- | --- | --- | --- |
| Woodcutters | Wood | 0.5/s | 0.5 deaths/h (0.83%/min) | — | — |
| Stonecutters | Stone | 0.4/s | 1 death/h (1.67%/min) | Quarry | — |
| Farmers | Food | 0.6/s | 0.2 deaths/h (0.33%/min) | — | — |
| Diggers | Clay | 0.3/s | 0.5 deaths/h (0.83%/min) | Clay Pit | — |
| Miners | Iron | 0.2/s | 2 deaths/h (3.33%/min) | Mine | Mana/s ×0.98 (Arcana) |
| Colliers | Coal | 0.25/s | 2 deaths/h (3.33%/min) | Coal Mine | Essence/s ×0.99 (Arcana) |
| Prospectors | Gold | 0.05/s | 1 death/h (1.67%/min) | Gold Mine | Research/s ×0.99 (Lab) |
| Drillers | Oil | 0.2/s | 1.5 deaths/h (2.5%/min) | Oil Well | — |
| Uranium Miners | Uranium | 0.02/s | 4 deaths/h (6.67%/min) | Uranium Mine | — |

## Realm buildings: Homes and health

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Hut | 10 Wood, 10 Food | ×4 per level | 5s (×1.05 per level) | ∞ | — | +2 housing; +1 crowding (slows growth) |
| House | 30 Planks, 20 Bricks | ×1.35 per level | 45s (×1.05 per level) | ∞ | Sawmill, Kiln, Housing (Lab) | +5 housing; +2 crowding (slows growth) |
| Well | 30 Stone, 10 Wood | ×1.8 per level | 5s (×1.05 per level) | 5 | Hut | Population growth ×1.1; Work accidents −3%; Starvation −20% |
| Aqueduct | 150 Stone, 60 Bricks | ×1.6 per level | 2m 00s (×1.05 per level) | 5 | Well, Aqueducts (Lab) | Crowding −15% |
| Park | 60 Wood, 40 Stone, 40 Food | ×1.6 per level | 15s (×1.05 per level) | 5 | Well, Environmental Science (Lab) | Pollution −10% |
| Tavern | 40 Planks, 100 Food | ×1.5 per level | 45s (×1.05 per level) | ∞ | House | +1.2 people/min growth; Uses 0.02 Gold/s |

## Realm buildings: Food and forest

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Farm | 20 Wood | ×1.3 per level | 5s (×1.05 per level) | ∞ | Agriculture (Lab) | +0.3 Food/s per worker |
| Irrigation | 50 Planks, 80 Stone | ×1.35 per level | 2m 00s (×1.05 per level) | ∞ | Farm, Engineering (Lab) | +0.4 Food/s per worker |
| Lumber Camp | 25 Wood, 10 Iron | ×1.3 per level | 5s (×1.05 per level) | ∞ | Forestry (Lab) | +0.2 Wood/s per worker |
| Forester's Lodge | 50 Wood, 30 Stone | ×1.5 per level | 15s (×1.05 per level) | 10 | Lumber Camp | Forest regrows +0.25 Wood/s |

## Realm buildings: Quarries and mines

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Quarry | 35 Wood | ×1.8 per level | 5s (×1.05 per level) | ∞ | — | +0.15 Stone/s per worker; Stone quarries holds +5K Stone; Forest holds −500 Wood |
| Clay Pit | 40 Wood, 20 Stone | ×1.8 per level | 15s (×1.05 per level) | ∞ | Quarry | +0.1 Clay/s per worker; Clay beds holds +3K Clay; Forest holds −300 Wood |
| Mine | 60 Wood, 80 Stone | ×1.35 per level | 15s (×1.05 per level) | ∞ | Quarry, Mining (Lab) | +0.05 Iron/s per worker; Iron veins holds +3K Iron; Forest holds −400 Wood |
| Coal Mine | 60 Planks, 100 Stone | ×1.35 per level | 45s (×1.05 per level) | ∞ | Mine, Sawmill | +0.05 Coal/s per worker; +2 pollution (slows growth); Coal seams holds +4K Coal; Forest holds −400 Wood |
| Gold Mine | 300 Stone, 150 Planks | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Mine, Geology (Lab) | +0.02 Gold/s per worker; Gold seams holds +500 Gold; Forest holds −400 Wood |
| Oil Well | 200 Steel, 50 Machine Parts | ×1.5 per level | 2m 00s (×1.05 per level) | ∞ | Combustion Engine (Lab) | +0.05 Oil/s per worker; Oil fields holds +10K Oil; Forest holds −400 Wood |
| Uranium Mine | 500 Steel, 200 Machine Parts | ×1.6 per level | 5m 00s (×1.05 per level) | ∞ | Radioactivity (Lab) | +0.01 Uranium/s per worker; Uranium ore holds +1K Uranium; Forest holds −400 Wood |

## Realm buildings: Workshops and industry

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Workshop | 40 Wood, 25 Stone | ×2.5 per level | 15s (×1.05 per level) | 10 | Quarry | Wood/s ×1.15; Stone/s ×1.15; Clay/s ×1.15; Iron/s ×1.15; Woodcutters' accidents +10%; Stonecutters' accidents +10%; Diggers' accidents +10%; Miners' accidents +10% |
| Sawmill | 80 Wood, 30 Stone | ×1.35 per level | 15s (×1.05 per level) | ∞ | Workshop | +0.1 Planks/s; Uses 1 Wood/s |
| Kiln | 120 Stone, 15 Planks | ×1.35 per level | 15s (×1.05 per level) | ∞ | Clay Pit, Sawmill | +0.1 Bricks/s; +1 pollution (slows growth); Uses 1 Clay/s, 0.5 Wood/s |
| Foundry | 150 Bricks, 40 Iron | ×3 per level | 2m 00s (×1.05 per level) | 10 | Mine, Kiln | All Realm production ×1.2; +2 pollution (slows growth) |
| Blast Furnace | 200 Bricks, 100 Iron | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Coal Mine, Metallurgy (Lab) | +0.25 Steel/s; +3 pollution (slows growth); Uses 2.5 Iron/s, 0.5 Coal/s |
| Glassworks | 150 Bricks, 50 Coal | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Kiln, Coal Mine, Optics (Lab) | +0.2 Glass/s; +2 pollution (slows growth); Uses 2 Stone/s, 0.3 Coal/s |
| Runesmith | 200 Stone, 100 Planks | ×1.4 per level | 5m 00s (×1.05 per level) | ∞ | Rune Lore (Arcana) | +0.05 Runestone/s; Uses 1 Stone/s, 0.1 Essence/s |
| Machine Shop | 150 Steel, 300 Bricks | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Blast Furnace, Precision Tools (Lab) | +0.1 Machine Parts/s; Uses 1 Steel/s, 0.2 Coal/s |
| Refinery | 300 Steel, 100 Machine Parts | ×1.5 per level | 5m 00s (×1.05 per level) | ∞ | Oil Well, Polymers (Lab) | +0.2 Plastics/s; +3 pollution (slows growth); Uses 2 Oil/s |
| Silicon Works | 500 Steel, 100 Plastics | ×1.5 per level | 5m 00s (×1.05 per level) | ∞ | Semiconductors (Lab) | +0.1 Silicon/s; +2 pollution (slows growth); Uses 2 Stone/s, 0.3 Coal/s |
| Chip Fab | 800 Steel, 200 Plastics, 100 Silicon | ×1.6 per level | 10m 00s (×1.05 per level) | ∞ | Silicon Works, Refinery, Transistors (Lab) | +0.05 Electronics/s; Uses 0.5 Silicon/s, 0.1 Plastics/s, 0.05 Gold/s |
| Golem Works | 200 Steel, 50 Runestone | ×1.8 per level | 10m 00s (×1.05 per level) | 10 | Blast Furnace, Runesmith, Animation (Arcana), Steam Power (Lab) | All Realm production ×1.15; Realm build speed ×1.1; Mana/s ×0.93 (Arcana) |

## Realm buildings: Town

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Warehouse | 600 Wood, 600 Stone | Then: 1.5K Wood, 1K Stone, 400 Planks → 1.2K Planks, 800 Bricks → 1.5K Bricks, 600 Iron, 400 Glass → 900 Steel, 600 Glass → 1.2K Steel, 800 Glass, 300 Gold → 1.3K Steel, 400 Gold, 500 Runestone; ×1.1 per level after | 45s (×1.05 per level) | ∞ | Warehousing (Lab) | +100% Realm storage; Goods in Warehouses spoil +0.02%/s |
| Market | 100 Planks, 60 Bricks | ×1.8 per level | 45s (×1.05 per level) | 5 | House, Currency (Lab) | Realm costs ×0.95 |
| Builders' Guild | 60 Planks, 40 Bricks | ×1.6 per level | 45s (×1.05 per level) | 10 | Sawmill, Kiln | Realm build speed ×1.15 |

## Realm buildings: Learning and faith

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Library | 60 Planks, 40 Bricks | ×1.6 per level | 45s (×1.05 per level) | ∞ | Sawmill, Kiln | +0.5 Research/s (Lab); Opens Lab; Kept for good; the tech resets, so each run can add more |
| Printing Press | 150 Planks, 30 Steel | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Printing (Lab) | +1 Research/s (Lab); -0.9 Mana/s (Arcana) |
| University | 300 Bricks, 50 Glass, 20 Gold | ×1.6 per level | 5m 00s (×1.05 per level) | 10 | Library, Universities (Lab) | All Lab production ×1.15 (Lab); Mana/s ×0.95 (Arcana) |
| Observatory | 40 Glass, 100 Bricks | ×1.5 per level | 5m 00s (×1.05 per level) | 10 | Optics (Lab) | +1.5 Research/s (Lab); Aether/s ×1.05 (Arcana) |
| Shrine | 120 Wood, 150 Stone | ×1.3 per level | 45s (×1.05 per level) | ∞ | Workshop, Occultism (Lab) | +0.3 Mana/s (Arcana); Opens Arcana |
| Church | 120 Bricks, 40 Glass | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Shrine | +1 Mana/s (Arcana); -0.9 Research/s (Lab) |
| Cathedral | 400 Bricks, 80 Glass, 40 Gold | ×1.8 per level | 10m 00s (×1.05 per level) | 5 | Shrine, Glassworks | All Arcana production ×1.2 (Arcana); Research/s ×0.95 (Lab) |
| Ley Anchor | 30 Runestone, 100 Bricks | ×2 per level | 5m 00s (×1.05 per level) | 5 | Runesmith | Mana/s ×1.1 (Arcana) |

## Lab buildings

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Scholar | 500 Food | ×1.5 per level | 5s (×1.05 per level) | ∞ | — | +0.3 Research/s; Uses 0.2 Food/s; Takes 1 idle Realm person |
| Laboratory | 30 Planks, 20 Iron | ×1.25 per level | 15s (×1.05 per level) | ∞ | Scholar | +1.5 Research/s; All Arcana production ×0.97 (Arcana) |
| Lab Assistants | 25 Gold | ×1.6 per level | 15s (×1.05 per level) | 10 | Scholar | Research/s ×1.1; Uses 0.2 Food/s |

## Arcana buildings

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Mana Well | 10 Mana | ×1.15 per level | 5s (×1.05 per level) | ∞ | — | +0.4 Mana/s |
| Mana Cistern | 60 Mana | ×1.3 per level | 15s (×1.05 per level) | ∞ | Mana Well | Stores +250 Mana |
| Ley Vault | 250 Mana, 40 Essence | ×2.5 per level | 45s (×1.05 per level) | 5 | Mana Cistern, Condenser | Mana storage ×1.5 |
| Condenser | 50 Mana | ×1.2 per level | 15s (×1.05 per level) | ∞ | Mana Well | +0.1 Essence/s; Uses 1 Mana/s |
| Focus Crystal | 100 Mana, 10 Essence | ×2.5 per level | 45s (×1.05 per level) | 10 | Condenser | Mana/s ×1.25 |
| Enchanted Tools | 25 Essence | ×3 per level | 45s (×1.05 per level) | 5 | Condenser | All Realm production ×1.25 (Realm) |
| Aether Rift | 500 Mana, 100 Essence | ×2 per level | 2m 00s (×1.05 per level) | ∞ | Condenser | +0.05 Aether/s; Research/s ×0.85 (Lab); Uses 0.5 Essence/s |
| Aether Lens | 5 Aether | ×3 per level | 5m 00s (×1.05 per level) | 5 | Aether Rift | All Arcana production ×1.5 |
| Fire Altar | 400 Mana, 40 Essence | ×1.4 per level | 45s (×1.05 per level) | ∞ | Pyromancy | +0.1 Fire Essence/s; Uses 1 Essence/s |
| Life Spring | 300 Mana, 40 Essence | ×1.4 per level | 45s (×1.05 per level) | ∞ | Vitalism | +0.1 Life Essence/s; Uses 1 Essence/s |
| Shadow Well | 800 Mana, 100 Essence | ×1.5 per level | 2m 00s (×1.05 per level) | ∞ | Umbramancy | +0.1 Shadow Essence/s; Uses 1 Essence/s |
| Time Loom | 300 Essence, 20 Aether | ×1.6 per level | 5m 00s (×1.05 per level) | ∞ | Chronomancy | +0.05 Time Essence/s; Uses 1 Essence/s, 0.02 Aether/s |

## Lab research: Age I, Foundations

Research streams into the tech you pick; other costs are paid once, when a tech is first started. Research is split into nine ages, each costing about 10 times the one before (100 × 10^(age − 1) × 1.25^step). The last tech of an age needs all the others and opens the next age. Lab research resets with the Lab. Researching every tech of this age once earns the achievement Out of the Stone Age.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Settlements | 100 Research | 1 | — | Population growth ×1.1 (Realm) |
| Scientific Method | 130 Research | 1 | — | Research/s ×1.25 |
| Agriculture | 160 Research | 1 | Settlements | Food/s ×2 (Realm) |
| Pottery | 200 Research, 50 Clay | 1 | Settlements | Clay/s ×1.25 (Realm); Bricks/s ×1.1 (Realm) |
| Mining | 240 Research, 60 Stone | 1 | Scientific Method | — |
| Housing | 310 Research | 1 | Settlements | Crowding −10% (Realm) |
| Warehousing | 380 Research, 100 Wood | 1 | Scientific Method | — |
| Basic Machinery | 480 Research, 40 Planks | 1 | Scientific Method | Planks/s ×2 (Realm); Bricks/s ×2 (Realm) |
| Forestry | 600 Research, 200 Wood | 1 | Scientific Method | Forest regrows ×2 (Realm) |
| Writing | 750 Research, 100 Planks | 1 | Every other Age I tech | Research/s ×1.5 |

## Lab research: Age II, Classical

Researching every tech of this age once earns the achievement Classical Education.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Metallurgy | 1K Research, 50 Iron | 1 | Writing | Iron/s ×1.5 (Realm) |
| Currency | 1.3K Research, 50 Gold | 1 | Writing | Gold/s ×1.15 (Realm) |
| Geology | 1.6K Research, 200 Stone | 1 | Mining, Writing | Stone/s ×1.2 (Realm); +0.05 Iron/s per worker (Realm) |
| Medicine | 2K Research, 300 Food | 1 | Writing | Crowding −30% (Realm); Work accidents −30% (Realm) |
| Cartography | 2.4K Research | 10 (cost ×2 each) | Writing | +1 square of land (Realm); Kept for good; the tech resets, so each run can add more |
| Rationalism | 3.1K Research | 10 (cost ×1.6 each) | Writing | Research/s ×1.3; Mana/s ×0.8 (Arcana) |
| Aqueducts | 3.8K Research, 150 Bricks | 1 | Medicine | Starvation −25% (Realm) |
| Mathematics | 4.8K Research | 1 | Writing | Research/s ×1.5 |
| Engineering | 6K Research, 200 Planks | 1 | Every other Age II tech | Planks/s ×1.25 (Realm); Bricks/s ×1.25 (Realm) |

## Lab research: Age III, Medieval

Researching every tech of this age once earns the achievement Keepers of Knowledge.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Logistics | 10K Research, 300 Planks | 1 | Engineering | Realm build speed ×1.3 (Realm) |
| Occultism | 13K Research | 1 | Engineering | Mana/s ×1.1 (Arcana) |
| Optics | 16K Research, 100 Bricks | 1 | Engineering | All Lab production ×1.1 |
| Guilds | 20K Research, 200 Gold | 1 | Engineering | Realm costs ×0.9 (Realm); Realm build speed ×1.1 (Realm) |
| Sanitation | 24K Research, 300 Bricks | 1 | Medicine, Engineering | Crowding −40% (Realm); Work accidents −20% (Realm) |
| Sailing | 31K Research, 400 Planks | 1 | Cartography, Engineering | Food/s ×1.15 (Realm) |
| Arcane Theory | 38K Research, 60 Essence | 1 | Occultism | Essence/s ×1.3 (Arcana) |
| Universities | 48K Research, 200 Bricks | 1 | Optics | Research/s ×1.5 |
| Printing | 60K Research, 300 Planks | 1 | Every other Age III tech | Research/s ×1.5 |

## Lab research: Age IV, Renaissance

Researching every tech of this age once earns the achievement Age of Discovery.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Navigation | 100K Research, 60 Glass | 1 | Sailing, Printing | Gold/s ×1.25 (Realm) |
| Banking | 130K Research, 300 Gold | 1 | Currency, Printing | Gold/s ×1.5 (Realm) |
| Scientific Instruments | 160K Research, 150 Glass | 1 | Optics, Printing | Research/s ×1.5 |
| Expedition | 200K Research, 1K Food | 30 (cost ×1.3 each) | Navigation | +5 squares of land (Realm); Kept for good; the tech resets, so each run can add more |
| Chemistry | 240K Research, 100 Glass, 200 Coal | 1 | Printing | Coal/s ×1.5 (Realm); Glass/s ×1.25 (Realm) |
| Anatomy | 310K Research, 500 Food | 1 | Medicine, Printing | Work accidents −25% (Realm); Starvation −25% (Realm) |
| Enlightenment | 380K Research, 200 Gold | 1 | Every other Age IV tech | Research/s ×2; Mana/s ×0.9 (Arcana) |

## Lab research: Age V, Industrial

Researching every tech of this age once earns the achievement Industrial Revolution.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Industrialization | 1M Research, 300 Iron | 1 | Enlightenment | Realm costs ×0.85 (Realm); Essence/s ×0.85 (Arcana); +8 pollution (slows growth) (Realm) |
| Steam Power | 1.3M Research, 200 Steel | 1 | Industrialization | All Realm production ×1.5 (Realm); +4 pollution (slows growth) (Realm) |
| Filtration | 1.6M Research, 300 Iron | 1 | Industrialization, Medicine | Pollution −50% (Realm) |
| Railways | 2M Research, 400 Steel | 1 | Steam Power | Realm build speed ×1.5 (Realm); Warehouse spoilage −50% (Realm) |
| Environmental Science | 2.4M Research, 150 Glass | 1 | Forestry, Filtration | Forest regrows ×2 (Realm); Pollution −20% (Realm) |
| Precision Tools | 3.1M Research, 300 Steel | 1 | Steam Power | All Realm production ×1.2 (Realm) |
| Electricity | 3.8M Research, 500 Steel, 100 Machine Parts | 1 | Every other Age V tech | Research/s ×2 |

## Lab research: Age VI, Electric

Researching every tech of this age once earns the achievement Let There Be Light.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Telegraph | 10M Research, 200 Machine Parts | 1 | Electricity | All Lab production ×1.5 |
| Fertilizers | 13M Research, 1K Coal | 1 | Electricity, Chemistry | Food/s ×2 (Realm); +3 pollution (slows growth) (Realm) |
| Thaumic Physics | 16M Research, 20 Aether | 1 | Rationalism, Arcane Theory, Electricity | Aether/s ×2 (Arcana); All Lab production ×1.5 |
| Vaccines | 20M Research, 1K Food | 1 | Anatomy, Electricity | Work accidents −50% (Realm); Starvation −50% (Realm) |
| Combustion Engine | 24M Research, 300 Machine Parts | 1 | Electricity | All Realm production ×1.5 (Realm); +6 pollution (slows growth) (Realm) |
| Mass Production | 31M Research, 500 Machine Parts, 500 Oil | 1 | Every other Age VI tech | Realm costs ×0.7 (Realm); Mana/s ×0.9 (Arcana) |

## Lab research: Age VII, Atomic

Researching every tech of this age once earns the achievement Splitting the Atom.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Automation | 100M Research, 500 Machine Parts | 1 | Mass Production | All Realm production ×1.5 (Realm) |
| Radio | 130M Research, 500 Glass, 200 Machine Parts | 1 | Mass Production | Research/s ×1.5 |
| Green Revolution | 160M Research, 2K Food | 1 | Fertilizers, Mass Production | Food/s ×3 (Realm) |
| Polymers | 200M Research, 1K Oil | 1 | Mass Production | — |
| Antibiotics | 240M Research, 200 Plastics | 1 | Vaccines | Work accidents −50% (Realm) |
| Radioactivity | 310M Research, 300 Machine Parts | 1 | Mass Production | — |
| Nuclear Physics | 380M Research, 100 Uranium | 1 | Every other Age VII tech | Research/s ×2; Mana/s ×0.8 (Arcana) |

## Lab research: Age VIII, Information

Researching every tech of this age once earns the achievement Information Superhighway.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Semiconductors | 1B Research, 500 Plastics | 1 | Nuclear Physics | — |
| Transistors | 1.3B Research, 200 Silicon | 1 | Semiconductors | — |
| Globalization | 1.6B Research, 2K Gold | 1 | Nuclear Physics | Gold/s ×2 (Realm) |
| Computers | 2B Research, 100 Electronics | 1 | Transistors | Research/s ×2 |
| Genetics | 2.4B Research, 100 Electronics | 1 | Computers, Antibiotics | Population growth ×2 (Realm); Work accidents −50% (Realm) |
| Satellites | 3.1B Research, 150 Electronics, 1K Steel | 1 | Computers | +20 squares of land (Realm); Kept for good; the tech resets, so each run can add more |
| The Internet | 3.8B Research, 300 Electronics | 1 | Every other Age VIII tech | All Lab production ×2; Mana/s ×0.8 (Arcana) |

## Lab research: Age IX, Current Age

Researching every tech of this age once earns the achievement Singularity.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Renewable Energy | 10B Research, 300 Electronics, 2K Steel | 1 | The Internet | Pollution −90% (Realm) |
| Gene Editing | 13B Research, 300 Electronics | 1 | Genetics | Population growth ×2 (Realm); Starvation −75% (Realm) |
| Space Flight | 16B Research, 500 Electronics, 2K Steel | 20 (cost ×1.5 each) | Satellites | +25 squares of land (Realm); Kept for good; the tech resets, so each run can add more |
| Machine Learning | 20B Research, 500 Electronics | 1 | The Internet | Research/s ×3 |
| Quantum Computing | 24B Research, 800 Electronics | 1 | Machine Learning | All Lab production ×2 |
| Artificial Intelligence | 31B Research, 1K Electronics | 1 | Every other Age IX tech | All Realm production ×3 (Realm); All Lab production ×3; All Arcana production ×3 (Arcana) |

## Arcana discoveries

| Name | Cost | Time | Needs | Effects |
| --- | --- | --- | --- | --- |
| Rune Lore | 200 Mana, 20 Essence | 45s | Condenser | Essence/s ×1.1 |
| Geomancy | 400 Mana, 60 Essence | 45s | Rune Lore | — |
| Pyromancy | 60 Essence, 200 Mana | 45s | Condenser | — |
| Vitalism | 60 Essence, 200 Mana | 45s | Condenser | — |
| Umbramancy | 150 Essence | 2m 00s | Summon Demons | — |
| Chronomancy | 200 Essence, 10 Aether | 5m 00s | Aether Rift | — |

## Arcana spells

Learn a spell once, then switch it on and off. Only one can be on at a time (Multicast adds more).

| Name | Cost | Time | Needs | Effects |
| --- | --- | --- | --- | --- |
| Summon Demons | 300 Mana, 30 Essence | 45s | Condenser | All Arcana production +20%; Kills 6/hour people (Realm) |
| Fertility Rite | 150 Mana | 15s | Mana Well | Population growth ×1.3 (Realm); Uses 1 Mana/s while on |
| Haste | 400 Mana, 40 Essence | 45s | Condenser | Arcana build speed ×1.2; Realm build speed ×1.2 (Realm); Lab build speed ×1.2 (Lab); Uses 2 Mana/s, 0.1 Essence/s while on |
| Animation | 100 Essence, 20 Aether | 5m 00s | Rune Lore, Aether Rift | All Arcana production ×1.2; Uses 1 Essence/s while on |
| Earthsong | 80 Essence | 45s | Geomancy | Stone quarries refill +3 Stone/s (Realm); Clay beds refill +2 Clay/s (Realm); Uses 0.5 Essence/s while on |
| Forge Fire | 20 Fire Essence | 45s | Fire Altar | Steel/s ×1.5 (Realm); Bricks/s ×1.3 (Realm); Glass/s ×1.3 (Realm); Uses 0.1 Fire Essence/s while on |
| Bountiful Harvest | 15 Life Essence | 45s | Life Spring | Food/s ×1.5 (Realm); Uses 0.1 Life Essence/s while on |
| Healing Light | 40 Life Essence | 2m 00s | Life Spring | Deaths ×0.5 (Realm); Population growth ×1.2 (Realm); Uses 0.2 Life Essence/s while on |
| Shadow Labor | 30 Shadow Essence | 2m 00s | Shadow Well | All Realm production ×1.3 (Realm); Population growth ×0.7 (Realm); Uses 0.15 Shadow Essence/s while on |
| Time Warp | 20 Time Essence | 5m 00s | Time Loom | Realm build speed ×1.5 (Realm); Arcana build speed ×1.5; Lab build speed ×1.5 (Lab); Uses 0.05 Time Essence/s while on |
| Deep Time | 30 Time Essence, 200 Essence | 5m 00s | Time Loom, Geomancy | Coal seams refill +2 Coal/s (Realm); Uses 0.05 Time Essence/s while on |
| Quickened Minds | 30 Time Essence | 5m 00s | Time Loom | All Lab production ×1.4 (Lab); Uses 0.05 Time Essence/s while on |

## Echo shop

Upgrades bought with Echoes. They survive every reset.

| Upgrade | Effect | Cost | Max level |
| --- | --- | --- | --- |
| Head Start: Realm | Each Realm run starts with +2 Huts. | 1 Echoes, ×2 per level | 5 |
| Head Start: Arcana | Each Arcana run starts with +2 Mana Wells. | 1 Echoes, ×2 per level | 5 |
| Head Start: Lab | Each Lab run starts with +2 Scholars. | 1 Echoes, ×2 per level | 5 |
| Resonance: Realm | Realm production x1.1, permanently. | 2 Echoes, ×1.6 per level | ∞ |
| Resonance: Arcana | Arcana production x1.1, permanently. | 2 Echoes, ×1.6 per level | ∞ |
| Resonance: Lab | Lab production x1.1, permanently. | 2 Echoes, ×1.6 per level | ∞ |
| Dampening | Harmful effects between worlds are 10% weaker. | 3 Echoes, ×2 per level | 5 |
| Amplify | Helpful effects between worlds are 10% stronger. | 3 Echoes, ×2 per level | 10 |
| Echo Attunement | +10% Echoes from every reset. | 5 Echoes, ×2 per level | ∞ |
| Swift Hands | Everything builds 10% faster, in every world. | 2 Echoes, ×1.8 per level | ∞ |
| Master Builders | Each world can work on one more building, discovery or tech at the same time (up to 5). | 3 Echoes, ×2 per level | 4 |
| Rich Earth | On a Realm reset, the forest grows by 1% of the Wood cut from it that run, per level. | 1 Echoes, ×1.12 per level | 50 |
| Multicast | Keep one more Arcana spell on at the same time. | 25 Echoes, ×4 per level | 3 |
| Retained Knowledge | Lab resets keep your most expensive tech (one more per level). | 5 Echoes, ×3 per level | 3 |

## Achievements

Reached once, kept for good.

| Achievement | Goal | Reward |
| --- | --- | --- |
| A Proper Village | Have 10 people in the Realm at once. | Every Realm run starts with 2 more people. |
| I Can't See the Forest or All the Trees | Clear the whole forest away with Quarries, Clay Pits and mines, so it cannot hold a single tree. | The forest is 2,000 Wood bigger, and every Realm run starts with it full. |
| Not an Inch to Spare | Use every square of the Realm's land for buildings. | 5 more squares of land, for good. |
| A Hundred Graves | Have 100 people die in a single Realm run: at work, of hunger or to demons. | The Realm's population grows 10% faster, for good. |
| Out of the Stone Age | Research every tech of the Foundations age (Age 1) in one run. | Research ×1.25; every Realm run starts with 1 more person. |
| Classical Education | Research every tech of the Classical age (Age 2) in one run. | Research ×1.25; the Realm's population grows 10% faster. |
| Keepers of Knowledge | Research every tech of the Medieval age (Age 3) in one run. | Research ×1.5; Realm buildings go up 10% faster. |
| Age of Discovery | Research every tech of the Renaissance age (Age 4) in one run. | Research ×1.5; 5 more squares of land. |
| Industrial Revolution | Research every tech of the Industrial age (Age 5) in one run. | Research ×1.5; all Realm production ×1.25. |
| Let There Be Light | Research every tech of the Electric age (Age 6) in one run. | Research ×2. |
| Splitting the Atom | Research every tech of the Atomic age (Age 7) in one run. | Research ×2; Realm costs ×0.9. |
| Information Superhighway | Research every tech of the Information age (Age 8) in one run. | Research ×2; all Lab production ×1.5. |
| Singularity | Research every tech of the Current Age age (Age 9) in one run. | All production in every world ×2. |
