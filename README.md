# Incremental Worlds

An incremental game made of three smaller incremental worlds that run side by side and affect each other. Some of those effects help and some hurt, and any world can be reset on its own to clear its effects and earn meta currency.

## The worlds

- **Realm** (physical): the only world open at the start. Its scarce resource is **people**. While there is free housing, people grow at a steady pace (3 per minute to start), and each newcomer eats 10 Food. Wells, Taverns (which cost Gold to keep open) and the Fertility Rite and Healing Light spells (Arcana) speed growth up. Every Hut and House crowds the village and slows growth. Aqueducts, Medicine and Sanitation (Lab) cut that crowding. Dirty industry (Kilns, Coal Mines, Foundries, Glassworks, Blast Furnaces and the Lab's Industrialization) adds pollution, which slows growth too. Parks and Filtration (Lab) cut it. Summon Demons in Arcana is a spell with no way back: once cast, the demon horde doubles every 3 minutes, boosting Arcana more and more while it eats the Realm's people, until only 2 survivors are left. Then the horde vanishes and the Realm has to regrow from those 2. While the horde runs, Arcana can't be reset. Resetting the Realm ends it at once, since only 2 people are left. Land is scarce too: every Realm building takes a square, the Realm starts with 20, and only exploring in the Lab finds more: Cartography gives 1 square each time, up to 10 times with the price doubling each time, and repeatable Expeditions give 5 each, once the Lab has researched Sailing and then Navigation. Explored land is permanent, even through Lab resets. Wood comes from a limited forest (8,000 Wood at first) that regrows really slowly. Forester's Lodges, Forestry and Environmental Science (Lab) speed regrowth up, and pollution slows it down. Stone, Clay and Coal come from much bigger deposits (50K, 30K and 20K) that never refill on their own; only Arcana's Earthsong and Deep Time spells refill them. Each Realm reset refills every deposit. Rich Earth in the Echo shop also makes them grow, by 1% per level of what was gathered from them in that run. You assign each person to a job: Woodcutters, Stonecutters, Farmers, Diggers, Miners, Colliers or Prospectors. That choice decides what the Realm focuses on. It has 12 resources: raw materials (Wood, Stone, Food, Clay, Iron, Coal, Gold), crafted goods (Planks, Bricks, Steel, Glass) and Runestone. Refining is costly: every building that turns a material into the next one (Sawmills, Kilns, Blast Furnaces, Glassworks, the Runesmith, and every Arcana building that distills Essence) uses at least 10 of its main input for each unit it makes. It has 30 buildings, and some of them can only be built after the Lab researches a technology or Arcana makes a discovery. For example, the Lumber Camp needs Forestry (and costs Iron), the Market needs Currency, the Blast Furnace needs Metallurgy, the Runesmith needs Rune Lore, the Printing Press (Research up, Mana down) needs Printing while the Church (the reverse, built with Glass) needs a Shrine, and Golem Works needs both Animation and Automation.
- **Arcana** (magic): make Mana, condense it into Essence, then tear open a Rift for Aether. Four schools (Pyromancy, Vitalism, Umbramancy, Chronomancy) each unlock a special essence (Fire, Life, Shadow, Time) that a converter building distills from plain Essence. Some discoveries (such as Rune Lore) unlock magic buildings in the Realm.
  - Only one spell can be on at a time (the expensive Multicast upgrade in the Echo shop adds more), and switching one on swaps out the oldest. Summon Demons takes no slot and asks for confirmation before it's cast.
  - **Spells** such as Fertility Rite, Haste, Animation, Forge Fire, Healing Light, Shadow Labor and Time Warp are learned once. After that you click one to switch it on or off. While it's on, it costs Mana or an essence every second. If that upkeep can't be paid in full, it runs at partial power.
- **Lab** (science): Scholars produce Research, which you spend on a tech tree. Buildings stay hidden until everything they require is unlocked. The Lab only lists research you can start now; the "Show full research tree" button opens the whole tree, with what is researched, available and locked. Scholars are bought with Realm Food (1,000 for the first, 50% more for each after). Lab Assistants are hired with Realm Gold. Scholars and Lab Assistants each eat 0.2 Realm Food per second but take no Realm housing or jobs, so a hungry Realm stalls the Lab. Too much science is bad for magic: each Laboratory makes all of Arcana 3% weaker. Techs unlock science buildings in the Realm.

Build a **Library** to open the Lab. It's built from Planks and Bricks, so it needs a Sawmill and a Kiln first. Research **Occultism** in the Lab and the Realm can build a **Shrine** (opens Arcana).

## Build times

Buying something pays the cost up front and starts construction. Each world works on one thing at a time, and Master Builders in the Echo shop raises that to up to 5. The card fills like a progress bar and shows the time left. The level (or the world it opens) only counts once it finishes. Build time rises steeply by tier, from 5 seconds for a Hut to 10 minutes for a Cathedral or Thaumic Physics, and each level owned adds 5%. Builders' Guild, Lab Assistants, Golem Works, Logistics (Lab), Haste (Arcana, all worlds) and Swift Hands (Echo shop) make building faster.

## Cross-world effects

Many buildings and techs change another world. Each card tags the world it affects: green if it helps, red if it hurts. Each world panel lists the effects coming in from the other worlds and the ones it sends out. Examples:

- Realm **Miners**: Iron, but each person you put in the mines weakens Mana in Arcana, and more so with every Mine you build.
- Arcana **Aether Rift**: makes Aether, but slows Research in the Lab.
- Lab **Rationalism**: faster Research, but magic suffers from the disbelief.
- Lab **Industrialization**: cheaper Realm buildings, but the smog chokes Essence.

## Resets and Echoes

Each world has its own reset button. A reset wipes that world's resources and buildings (plus people and jobs for the Realm, discoveries for Arcana, and techs for the Lab). Realm buildings you already built keep working if the tech or discovery they needed is reset, but you can't build more until you unlock it again. A reset also removes every effect that world had on the other worlds. The other worlds are untouched, and opened worlds stay open. A reset pays **Echoes** based on how far that world got (`floor(sqrt(value earned this run / 500))`). You spend them in the Echo shop on permanent upgrades: head starts, production boosts, weaker penalties, stronger bonuses, more Echoes, and keeping techs through a Lab reset.

## Running it

Requires Node 22+.

```sh
npm install
npm run dev        # play at http://localhost:5173
npm test           # engine unit tests (Vitest)
npm run lint
npm run typecheck
npm run build      # static build in dist/
```

The game autosaves to localStorage every 10 seconds and when the tab is hidden or closed. **Wipe save** in the header starts over from scratch. In dev mode the live state is available as `window.game` in the browser console.

## Code layout

- `src/engine/`: the game rules as plain TypeScript with no DOM access.
  - `content.ts`: every world, resource, building, tech and Echo upgrade, as data. To add or tune content, edit this file.
  - `engine.ts`: modifiers, costs, ticking, upkeep, population and jobs, links between worlds, resets and Echoes.
  - `save.ts`, `format.ts`: save/load and number formatting.
- `src/ui/`: a vanilla TypeScript DOM view that builds each card once and updates it in place.
- `tests/`: Vitest tests for the engine, save and formatting.

### How effects work

Every node has a list of effects such as `{ stat: 'rate:mana', kind: 'mul', amount: 0.98 }`. The possible stats are `rate:<resource>`, `click:<resource>`, `yield:<resource>` (extra output per worker), `prod:<world>`, `cost:<world>` and `housing`. An `add` effect contributes `amount × level`, and a `mul` effect contributes `amount ^ level`. Jobs can carry effects too, applied once per assigned worker. An effect is a cross-world link when its stat belongs to a different world than the node or job that owns it. Nodes with `upkeep` consume resources every second, and when they can't pay in full their effects scale down to match.
