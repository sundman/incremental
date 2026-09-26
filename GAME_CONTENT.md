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
| 🌲 Forest | Wood | 8K | 0.25/s (slowed by pollution) | Quarry −500, Clay Pit −300, Mine −400, Coal Mine −400, Gold Mine −400 |
| 🪨 Stone quarries | Stone | 0 | No | Quarry +5K |
| 🟫 Clay beds | Clay | 0 | No | Clay Pit +3K |
| ⚫ Coal seams | Coal | 0 | No | Coal Mine +4K |
| ⛏️ Iron veins | Iron | 0 | No | Mine +3K |
| 🪙 Gold seams | Gold | 0 | No | Gold Mine +500 |

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

## Realm buildings

| Building | Cost | Cost growth | Build time | Max | Needs | Effects (each) |
| --- | --- | --- | --- | --- | --- | --- |
| Hut | 10 Wood, 10 Food | ×4 per level | 5s (×1.05 per level) | ∞ | — | +2 housing; +1 crowding (slows growth) |
| Warehouse | 600 Wood, 600 Stone | Then: 1.5K Wood, 1K Stone, 400 Planks → 1.2K Planks, 800 Bricks → 1.5K Bricks, 600 Iron, 400 Glass → 900 Steel, 600 Glass → 1.2K Steel, 800 Glass, 300 Gold → 1.3K Steel, 400 Gold, 500 Runestone; ×1.1 per level after | 45s (×1.05 per level) | ∞ | Warehousing (Lab) | +100% Realm storage; Goods in Warehouses spoil +0.02%/s |
| Farm | 20 Wood | ×1.3 per level | 5s (×1.05 per level) | ∞ | Agriculture (Lab) | +0.3 Food/s per worker |
| Lumber Camp | 25 Wood, 10 Iron | ×1.3 per level | 5s (×1.05 per level) | ∞ | Forestry (Lab) | +0.2 Wood/s per worker |
| Forester's Lodge | 50 Wood, 30 Stone | ×1.5 per level | 15s (×1.05 per level) | 10 | Lumber Camp | Forest regrows +0.25 Wood/s |
| Quarry | 35 Wood | ×1.8 per level | 5s (×1.05 per level) | ∞ | — | +0.15 Stone/s per worker; Stone quarries holds +5K Stone; Forest holds −500 Wood |
| Clay Pit | 40 Wood, 20 Stone | ×1.8 per level | 15s (×1.05 per level) | ∞ | Quarry | +0.1 Clay/s per worker; Clay beds holds +3K Clay; Forest holds −300 Wood |
| Workshop | 40 Wood, 25 Stone | ×2.5 per level | 15s (×1.05 per level) | 10 | Quarry | Wood/s ×1.15; Stone/s ×1.15; Clay/s ×1.15; Iron/s ×1.15 |
| Sawmill | 80 Wood, 30 Stone | ×1.35 per level | 15s (×1.05 per level) | ∞ | Workshop | +0.1 Planks/s; Uses 1 Wood/s |
| Kiln | 120 Stone, 15 Planks | ×1.35 per level | 15s (×1.05 per level) | ∞ | Clay Pit, Sawmill | +0.1 Bricks/s; +1 pollution (slows growth); Uses 1 Clay/s, 0.5 Wood/s |
| House | 30 Planks, 20 Bricks | ×1.35 per level | 45s (×1.05 per level) | ∞ | Sawmill, Kiln, Housing (Lab) | +5 housing; +2 crowding (slows growth) |
| Mine | 60 Wood, 80 Stone | ×1.35 per level | 15s (×1.05 per level) | ∞ | Quarry, Mining (Lab) | +0.05 Iron/s per worker; Iron veins holds +3K Iron; Forest holds −400 Wood |
| Coal Mine | 60 Planks, 100 Stone | ×1.35 per level | 45s (×1.05 per level) | ∞ | Mine, Sawmill | +0.05 Coal/s per worker; +2 pollution (slows growth); Coal seams holds +4K Coal; Forest holds −400 Wood |
| Foundry | 150 Bricks, 40 Iron | ×3 per level | 2m 00s (×1.05 per level) | 10 | Mine, Kiln | All Realm production ×1.2; +2 pollution (slows growth) |
| Market | 100 Planks, 60 Bricks | ×1.8 per level | 45s (×1.05 per level) | 5 | House, Currency (Lab) | Realm costs ×0.95 |
| Builders' Guild | 60 Planks, 40 Bricks | ×1.6 per level | 45s (×1.05 per level) | 10 | Sawmill, Kiln | Realm build speed ×1.15 |
| Well | 30 Stone, 10 Wood | ×1.8 per level | 5s (×1.05 per level) | 5 | Hut | Population growth ×1.1; Work accidents −3%; Starvation −20% |
| Park | 60 Wood, 40 Stone, 40 Food | ×1.6 per level | 15s (×1.05 per level) | 5 | Well, Environmental Science (Lab) | Pollution −10% |
| Tavern | 40 Planks, 100 Food | ×1.5 per level | 45s (×1.05 per level) | ∞ | House | +1.2 people/min growth; Uses 0.02 Gold/s |
| Library | 60 Planks, 40 Bricks | ×1.6 per level | 45s (×1.05 per level) | ∞ | Sawmill, Kiln | +0.5 Research/s (Lab); Opens Lab; Kept for good; the tech resets, so each run can add more |
| Shrine | 120 Wood, 150 Stone | ×1.3 per level | 45s (×1.05 per level) | ∞ | Workshop, Occultism (Lab) | +0.3 Mana/s (Arcana); Opens Arcana |
| Irrigation | 50 Planks, 80 Stone | ×1.35 per level | 2m 00s (×1.05 per level) | ∞ | Farm, Engineering (Lab) | +0.4 Food/s per worker |
| Aqueduct | 150 Stone, 60 Bricks | ×1.6 per level | 2m 00s (×1.05 per level) | 5 | Well, Engineering (Lab) | Crowding −15% |
| Blast Furnace | 200 Bricks, 100 Iron | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Coal Mine, Metallurgy (Lab) | +0.25 Steel/s; +3 pollution (slows growth); Uses 2.5 Iron/s, 0.5 Coal/s |
| Glassworks | 150 Bricks, 50 Coal | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Kiln, Coal Mine, Optics (Lab) | +0.2 Glass/s; +2 pollution (slows growth); Uses 2 Stone/s, 0.3 Coal/s |
| Gold Mine | 300 Stone, 150 Planks | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Mine, Geology (Lab) | +0.02 Gold/s per worker; Gold seams holds +500 Gold; Forest holds −400 Wood |
| Printing Press | 150 Planks, 30 Steel | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Printing (Lab) | +1 Research/s (Lab); -0.9 Mana/s (Arcana) |
| Church | 120 Bricks, 40 Glass | ×1.4 per level | 2m 00s (×1.05 per level) | ∞ | Shrine | +1 Mana/s (Arcana); -0.9 Research/s (Lab) |
| Observatory | 40 Glass, 100 Bricks | ×1.5 per level | 5m 00s (×1.05 per level) | 10 | Optics (Lab) | +1.5 Research/s (Lab); Aether/s ×1.05 (Arcana) |
| University | 300 Bricks, 50 Glass, 20 Gold | ×1.6 per level | 5m 00s (×1.05 per level) | 10 | Library, Printing (Lab) | All Lab production ×1.15 (Lab); Mana/s ×0.95 (Arcana) |
| Cathedral | 400 Bricks, 80 Glass, 40 Gold | ×1.8 per level | 10m 00s (×1.05 per level) | 5 | Shrine, Glassworks | All Arcana production ×1.2 (Arcana); Research/s ×0.95 (Lab) |
| Runesmith | 200 Stone, 100 Planks | ×1.4 per level | 5m 00s (×1.05 per level) | ∞ | Rune Lore (Arcana) | +0.05 Runestone/s; Uses 1 Stone/s, 0.1 Essence/s |
| Ley Anchor | 30 Runestone, 100 Bricks | ×2 per level | 5m 00s (×1.05 per level) | 5 | Runesmith | Mana/s ×1.1 (Arcana) |
| Golem Works | 200 Steel, 50 Runestone | ×1.8 per level | 10m 00s (×1.05 per level) | 10 | Blast Furnace, Runesmith, Animation (Arcana), Automation (Lab) | All Realm production ×1.15; Realm build speed ×1.1; Mana/s ×0.93 (Arcana) |

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

## Lab research

Research streams into the tech you pick. Other costs are paid once when a tech is first started.

| Name | Cost | Levels | Needs | Effects |
| --- | --- | --- | --- | --- |
| Scientific Method | 50 Research | 1 | — | Research/s ×1.25 |
| Engineering | 200 Research, 50 Planks | 1 | Geology, Metallurgy | Planks/s ×1.25 (Realm); Bricks/s ×1.25 (Realm) |
| Warehousing | 150 Research, 100 Wood | 1 | Scientific Method | — |
| Basic Machinery | 150 Research, 40 Planks | 1 | Scientific Method | Planks/s ×2 (Realm); Bricks/s ×2 (Realm) |
| Mining | 120 Research, 60 Stone | 1 | Scientific Method | — |
| Geology | 250 Research, 100 Stone | 1 | Mining | Stone/s ×1.2 (Realm); +0.05 Iron/s per worker (Realm) |
| Optics | 500 Research, 20 Bricks | 1 | Engineering | All Lab production ×1.1 |
| Printing | 800 Research, 100 Planks | 1 | Optics | Research/s ×1.2 |
| Medicine | 300 Research, 200 Food | 1 | Scientific Method | Crowding −30% (Realm); Work accidents −30% (Realm) |
| Sanitation | 900 Research, 150 Bricks | 1 | Medicine, Engineering | Crowding −40% (Realm); Work accidents −20% (Realm) |
| Logistics | 400 Research, 100 Planks | 1 | Engineering | Realm build speed ×1.3 (Realm) |
| Metallurgy | 150 Research | 1 | Scientific Method | Iron/s ×1.5 (Realm) |
| Rationalism | 300 Research | 10 (cost ×1.6 each) | Scientific Method | Research/s ×1.3; Mana/s ×0.8 (Arcana) |
| Settlements | 50 Research | 1 | — | Population growth ×1.1 (Realm) |
| Housing | 150 Research | 1 | Settlements | Crowding −10% (Realm) |
| Agriculture | 100 Research | 1 | Settlements | Food/s ×2 (Realm) |
| Currency | 200 Research | 1 | Settlements | Gold/s ×1.15 (Realm) |
| Occultism | 10K Research | 1 | — | Mana/s ×1.1 (Arcana) |
| Arcane Theory | 400 Research, 30 Essence | 1 | Occultism | Essence/s ×1.3 (Arcana) |
| Industrialization | 600 Research, 100 Iron | 1 | Metallurgy | Realm costs ×0.85 (Realm); Essence/s ×0.85 (Arcana); +8 pollution (slows growth) (Realm) |
| Cartography | 120 Research | 10 (cost ×2 each) | Scientific Method | +1 square of land (Realm); Kept for good; the tech resets, so each run can add more |
| Sailing | 500 Research, 150 Planks | 1 | Cartography, Engineering | Food/s ×1.15 (Realm) |
| Navigation | 1K Research, 20 Glass | 1 | Sailing, Optics | Gold/s ×1.25 (Realm) |
| Expedition | 1K Research, 500 Food | 30 (cost ×1.3 each) | Navigation | +5 squares of land (Realm); Kept for good; the tech resets, so each run can add more |
| Forestry | 250 Research, 200 Wood | 1 | Scientific Method | Forest regrows ×2 (Realm) |
| Environmental Science | 1.2K Research, 40 Glass | 1 | Forestry, Filtration | Forest regrows ×2 (Realm); Pollution −20% (Realm) |
| Filtration | 800 Research, 80 Iron | 1 | Metallurgy, Medicine | Pollution −50% (Realm) |
| Automation | 1.5K Research, 200 Iron | 1 | Industrialization | All Realm production ×1.5 (Realm) |
| Thaumic Physics | 2K Research, 5 Aether | 1 | Rationalism, Arcane Theory | Aether/s ×2 (Arcana); All Lab production ×1.5 |

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
