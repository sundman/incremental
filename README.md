# Incremental Worlds

An incremental game made of three smaller incremental worlds that run side by side and affect each other. Some of those effects help and some hurt, and any world can be reset on its own to clear its effects and earn meta currency.

## The worlds

- **Realm** (physical): gather Wood and Stone, build buildings, dig for Iron. It is the only world open at the start. Its scarce resource is **people**. They move in while there is free housing (build Huts for more), and you assign each one to a job (Woodcutters, Stonecutters, Miners). That choice decides what the Realm focuses on. Buildings such as the Lumber Camp make each worker in a job more productive.
- **Arcana** (magic): make Mana, condense it into Essence, then tear open a Rift for Aether.
- **Lab** (science): Scholars produce Research, which you spend on a tech tree.

Grow the Realm to 10 buildings (including a Workshop) and you can build a **Shrine** (opens Arcana) or a **Library** (opens the Lab).

## Cross-world effects

Many buildings and techs change another world. Each card tags the world it affects: green if it helps, red if it hurts. Each world panel lists the effects coming in from the other worlds and the ones it sends out. Examples:

- Realm **Miners**: Iron, but each person you put in the mines weakens Mana in Arcana.
- Arcana **Aether Rift**: makes Aether, but slows Research in the Lab.
- Lab **Rationalism**: faster Research, but magic suffers from the disbelief.
- Lab **Industrialization**: cheaper Realm buildings, but the smog chokes Essence.

## Resets and Echoes

Each world has its own reset button. A reset wipes that world's resources and buildings (plus people and jobs for the Realm, and techs for the Lab), which also removes every effect it had on the other worlds. The other worlds are untouched, and opened worlds stay open. A reset pays **Echoes** based on how far that world got (`floor(sqrt(value earned this run / 500))`). You spend them in the Echo shop on permanent upgrades: head starts, production boosts, weaker penalties, stronger bonuses, more Echoes, and keeping techs through a Lab reset.

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
