import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  activeLinks,
  runningLevel,
  toggleSpell,
  spellSlots,
  maxLevel,
  land,
  landUsed,
  buildSlots,
  setRandom,
  canResetWorld,
  upkeepRate,
  arrivalBlocker,
  buildSeconds,
  completeConstruction,
  needsPeople,
  depositMax,
  constructionSecondsLeft,
  arrivalRate,
  crowdingFactor,
  depositRegrowth,
  pollutionFactor,
  deathRate,
  assignJob,
  housing,
  idleWorkers,
  buildingCount,
  buyMeta,
  buyNode,
  computeModifiers,
  createInitialState,
  echoGain,
  grossRate,
  isNodeAvailable,
  isWorldUnlocked,
  jobOutput,
  netRate,
  nodeCost,
  resetWorld,
  tick,
  isResearchListed,
  canSwitchOff,
  toggleBuilding,
  isBuildingListed,
  researchTreeColumns,
  startResearch,
  stopResearch,
  canStartResearch,
  researchNeeded,
  researchUpfrontCost,
  researchSecondsLeft,
  setAccidentRandom,
  LOG_LIMIT,
  accidentChance,
  accidentRate,
  resourceCap,
  costOverCap,
  isAtCap,
} from '../src/engine/engine';
import { DEPOSITS, NODES, RESOURCES } from '../src/engine/content';
import type { GameState, JobId, NodeId, ResourceId } from '../src/engine/types';

// Work accidents are random; keep them off unless a test turns them on.
let restoreAccidents: () => number;
beforeEach(() => {
  restoreAccidents = setAccidentRandom(() => 1);
});
afterEach(() => {
  setAccidentRandom(restoreAccidents);
});

/** Streams `amount` Research into the current target, as if the Lab had just made it. */
function pour(state: GameState, amount: number) {
  state.resources.research += amount;
  tick(state, 1e-6);
}

function withNodes(levels: Partial<Record<NodeId, number>>, state = createInitialState()): GameState {
  Object.assign(state.nodes, levels);
  return state;
}

/** Puts people straight into jobs, growing the population to match. */
function withJobs(jobs: Partial<Record<JobId, number>>, state = createInitialState()): GameState {
  Object.assign(state.jobs, jobs);
  state.population = Math.max(state.population, Object.values(state.jobs).reduce((a, b) => a + b, 0));
  return state;
}

function unlockAll(state: GameState): GameState {
  state.unlockedWorlds = ['realm', 'arcana', 'lab'];
  return state;
}

describe('costs', () => {
  it('scales by costGrowth per level owned', () => {
    const state = createInitialState();
    expect(nodeCost(state, 'lumberCamp').wood).toBeCloseTo(25);
    state.nodes.lumberCamp = 3;
    expect(nodeCost(state, 'lumberCamp').wood).toBeCloseTo(25 * 1.3 ** 3);
  });

  it('applies cost modifiers from other worlds', () => {
    const state = unlockAll(withNodes({ industrialization: 1 }));
    expect(nodeCost(state, 'quarry').wood).toBeCloseTo(35 * 0.85);
    // Lab costs are untouched.
    expect(nodeCost(state, 'scholar').food).toBeCloseTo(1000);
  });

  it('buying deducts every resource and raises the level', () => {
    const state = createInitialState();
    state.resources.wood = 100;
    state.resources.stone = 100;
    expect(buyNode(state, 'workshop')).toBe(false); // needs a Quarry first
    state.nodes.quarry = 1;
    expect(buyNode(state, 'workshop')).toBe(true);
    expect(state.nodes.workshop).toBe(0); // still being built
    completeConstruction(state, 'workshop');
    expect(state.nodes.workshop).toBe(1);
    expect(state.resources.wood).toBeCloseTo(60);
    expect(state.resources.stone).toBeCloseTo(75);
  });

  it('refuses to buy what you cannot afford', () => {
    const state = createInitialState();
    state.resources.wood = 9;
    expect(buyNode(state, 'lumberCamp')).toBe(false);
    expect(state.resources.wood).toBe(9);
  });
});

describe('worlds and techs', () => {
  it('starts with only the Realm open', () => {
    const state = createInitialState();
    expect(isWorldUnlocked(state, 'realm')).toBe(true);
    expect(isWorldUnlocked(state, 'arcana')).toBe(false);
    expect(isWorldUnlocked(state, 'lab')).toBe(false);
  });

  it('keeps the other worlds out of reach until their gateways can be built, however small the Realm', () => {
    const state = createInitialState();
    state.resources.wood = 10_000;
    state.resources.stone = 10_000;
    expect(buyNode(state, 'library')).toBe(false);
    expect(buyNode(state, 'shrine')).toBe(false);
    withNodes({ quarry: 1, workshop: 1, sawmill: 1 }, state);
    expect(isNodeAvailable(state, 'library')).toBe(false); // needs a Kiln too
    state.nodes.kiln = 1;
    expect(buildingCount(state, 'realm')).toBe(4);
    expect(isNodeAvailable(state, 'library')).toBe(true);
    expect(isNodeAvailable(state, 'shrine')).toBe(false); // needs Occultism from the Lab
    state.nodes.occultism = 1;
    expect(isNodeAvailable(state, 'shrine')).toBe(true);
  });

  it('opens the Lab when the first Library is built', () => {
    const state = withNodes({ lumberCamp: 4, quarry: 3, workshop: 1, sawmill: 1, kiln: 1 });
    state.resources.planks = 1000;
    state.resources.bricks = 1000;
    expect(isNodeAvailable(state, 'scholar')).toBe(false);
    expect(buyNode(state, 'library')).toBe(true);
    expect(isWorldUnlocked(state, 'lab')).toBe(false);
    completeConstruction(state, 'library');
    expect(isWorldUnlocked(state, 'lab')).toBe(true);
    expect(isNodeAvailable(state, 'scholar')).toBe(true);
  });

  it('techs need their prerequisites and cap at one level', () => {
    const state = unlockAll(createInitialState());
    expect(startResearch(state, 'metallurgy')).toBe(false);
    expect(buyNode(state, 'scientificMethod')).toBe(false); // techs are researched, not built
    expect(startResearch(state, 'scientificMethod')).toBe(true);
    expect(startResearch(state, 'scientificMethod')).toBe(false); // already being researched
    expect(startResearch(state, 'metallurgy')).toBe(false); // not finished yet
    pour(state, 10_000);
    expect(state.nodes.scientificMethod).toBe(1);
    expect(state.researching).toBe(null);
    expect(startResearch(state, 'scientificMethod')).toBe(false); // one level only
    expect(startResearch(state, 'metallurgy')).toBe(true);
  });
});

describe('production and links', () => {
  it('produces from workers, boosted per worker by buildings, then multiplied', () => {
    const state = withJobs({ woodcutter: 3 }, withNodes({ lumberCamp: 2, workshop: 2 }));
    const mods = computeModifiers(state);
    expect(jobOutput(mods, 'woodcutter')).toBeCloseTo((0.5 + 2 * 0.2) * 1.15 ** 2);
    expect(grossRate(state, mods, 'wood')).toBeCloseTo(3 * (0.5 + 2 * 0.2) * 1.15 ** 2);
  });

  it('produces nothing from buildings alone without workers', () => {
    const state = withNodes({ lumberCamp: 10, quarry: 10 });
    const mods = computeModifiers(state);
    expect(grossRate(state, mods, 'wood')).toBe(0);
    expect(grossRate(state, mods, 'stone')).toBe(0);
  });

  it('applies world-wide production multipliers from another world', () => {
    const state = unlockAll(withJobs({ woodcutter: 2 }, withNodes({ enchantedTools: 1 })));
    expect(grossRate(state, computeModifiers(state), 'wood')).toBeCloseTo(2 * 0.5 * 1.25);
  });

  it('lets Realm miners hurt Arcana, per miner', () => {
    const state = unlockAll(withJobs({ miner: 3 }, withNodes({ manaWell: 10, mine: 1 })));
    expect(grossRate(state, computeModifiers(state), 'mana')).toBeCloseTo(10 * 0.4 * 0.98 ** 3);
  });

  it('reports cross-world links with their sign, and not local effects', () => {
    const state = unlockAll(
      withJobs({ miner: 2, woodcutter: 1 }, withNodes({ mine: 1, library: 1, lumberCamp: 5, rationalism: 1 })),
    );
    const links = activeLinks(state);
    const miners = links.find((l) => l.source === 'miner');
    expect(miners).toMatchObject({ from: 'realm', to: 'arcana', helpful: false, count: 2, sourceName: 'Miners' });
    expect(miners?.total).toBeCloseTo(0.98 ** 2);
    expect(links.find((l) => l.source === 'library')).toMatchObject({ to: 'lab', helpful: true, total: 0.5 });
    expect(links.find((l) => l.source === 'rationalism')).toMatchObject({ to: 'arcana', helpful: false });
    expect(links.some((l) => l.source === 'lumberCamp' || l.source === 'woodcutter' || l.source === 'mine')).toBe(false);
  });

  it('counts cheaper costs as helpful', () => {
    const state = unlockAll(withNodes({ industrialization: 1 }));
    const links = activeLinks(state);
    expect(links.find((l) => l.effect.stat === 'cost:realm')?.helpful).toBe(true);
    expect(links.find((l) => l.effect.stat === 'rate:essence')?.helpful).toBe(false);
  });
});

describe('tick', () => {
  it('accumulates production over time', () => {
    const state = withJobs({ woodcutter: 2 });
    tick(state, 10);
    expect(state.resources.wood).toBeCloseTo(10);
    expect(state.runEarned.realm).toBeCloseTo(10);
  });

  it('runs converters at full speed when upkeep is covered', () => {
    const state = unlockAll(withNodes({ manaWell: 5, condenser: 1 }));
    tick(state, 10);
    expect(state.efficiency.condenser).toBeCloseTo(1);
    expect(state.resources.essence).toBeCloseTo(1);
    expect(state.resources.mana).toBeCloseTo(10 * (5 * 0.4 - 1));
  });

  it('slows converters that cannot pay their upkeep', () => {
    // 1 Mana Well makes 0.4 Mana/s, 2 Condensers want 2 Mana/s.
    const state = unlockAll(withNodes({ manaWell: 1, condenser: 2 }));
    tick(state, 5);
    expect(state.efficiency.condenser).toBeCloseTo(0.2);
    expect(state.resources.essence).toBeCloseTo(5 * 2 * 0.1 * 0.2);
    expect(state.resources.mana).toBeCloseTo(0);
    expect(netRate(state, computeModifiers(state), 'mana')).toBeCloseTo(0);
    expect(grossRate(state, computeModifiers(state), 'mana')).toBeCloseTo(0.4);
  });

  it('does not produce in locked worlds', () => {
    const state = withNodes({ scholar: 5 });
    tick(state, 10);
    expect(state.resources.research).toBe(0);
  });
});

describe('resets and Echoes', () => {
  it('pays Echoes with diminishing returns', () => {
    const state = createInitialState();
    state.runEarned.realm = 499;
    expect(echoGain(state, 'realm')).toBe(0);
    state.runEarned.realm = 500;
    expect(echoGain(state, 'realm')).toBe(1);
    state.runEarned.realm = 50_000;
    expect(echoGain(state, 'realm')).toBe(10);
    state.meta.attunement = 5;
    expect(echoGain(state, 'realm')).toBe(15);
  });

  it('clears the world and the harm it did to others, but nothing else', () => {
    const state = unlockAll(
      withJobs({ miner: 4, woodcutter: 3 }, withNodes({ mine: 4, hut: 3, shrine: 1, library: 1, manaWell: 3, scholar: 2 })),
    );
    state.resources.wood = 500;
    state.resources.mana = 70;
    state.runEarned.realm = 2000;

    expect(activeLinks(state).some((l) => l.source === 'miner')).toBe(true);
    const reward = resetWorld(state, 'realm');

    expect(reward).toBe(2);
    expect(state.echoes).toBe(2);
    expect(state.resets.realm).toBe(1);
    expect(state.nodes.mine).toBe(0);
    expect(state.jobs.miner).toBe(0);
    expect(state.jobs.woodcutter).toBe(0);
    expect(state.population).toBe(2);
    expect(state.resources.wood).toBe(0);
    expect(state.runEarned.realm).toBe(0);
    expect(activeLinks(state).filter((l) => l.from === 'realm')).toHaveLength(0);
    // Other worlds keep their progress and stay open.
    expect(state.nodes.manaWell).toBe(3);
    expect(state.resources.mana).toBe(70);
    expect(isWorldUnlocked(state, 'arcana')).toBe(true);
    expect(isWorldUnlocked(state, 'lab')).toBe(true);
  });

  it('applies Head Start after a reset and immediately on purchase', () => {
    const state = createInitialState();
    state.echoes = 10;
    expect(buyMeta(state, 'headStartRealm')).toBe(true);
    expect(state.nodes.hut).toBe(2);
    state.nodes.hut = 20;
    resetWorld(state, 'realm');
    expect(state.nodes.hut).toBe(2);
  });

  it('applies Head Start when a world first opens', () => {
    const state = withNodes({ lumberCamp: 4, quarry: 3, workshop: 1, sawmill: 1, kiln: 1 });
    state.meta.headStartLab = 2;
    state.resources.planks = 1000;
    state.resources.bricks = 1000;
    buyNode(state, 'library');
    completeConstruction(state, 'library');
    expect(state.nodes.scholar).toBe(4);
  });

  it('keeps the most valuable techs with Retained Knowledge', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1, metallurgy: 1, rationalism: 1, scholar: 5 }));
    state.meta.retainedKnowledge = 1;
    resetWorld(state, 'lab');
    expect(state.nodes.rationalism).toBe(1);
    expect(state.nodes.metallurgy).toBe(0);
    expect(state.nodes.scientificMethod).toBe(0);
    expect(state.nodes.scholar).toBe(0);
  });

  it('Dampening weakens harmful links and Amplify strengthens helpful ones', () => {
    const state = unlockAll(withJobs({ miner: 1, woodcutter: 2 }, withNodes({ manaWell: 10, mine: 1, enchantedTools: 1 })));
    state.meta.dampening = 5;
    state.meta.amplify = 10;
    const mods = computeModifiers(state);
    expect(grossRate(state, mods, 'mana')).toBeCloseTo(10 * 0.4 * (1 - 0.02 * 0.5));
    expect(grossRate(state, mods, 'wood')).toBeCloseTo(2 * 0.5 * (1 + 0.25 * 2));
  });

  it('meta upgrades cost Echoes and respect their cap', () => {
    const state = createInitialState();
    state.echoes = 100;
    for (let i = 0; i < 5; i++) expect(buyMeta(state, 'dampening')).toBe(true);
    expect(buyMeta(state, 'dampening')).toBe(false);
    expect(state.echoes).toBe(100 - (3 + 6 + 12 + 24 + 48));
  });

  it('Resonance multiplies a whole world', () => {
    const state = withJobs({ woodcutter: 2 });
    state.meta.resonanceRealm = 2;
    expect(grossRate(state, computeModifiers(state), 'wood')).toBeCloseTo(1 * 1.1 ** 2);
  });
});

describe('deposits', () => {
  it('only lets Wood be cut while the forest lasts, then as fast as it regrows', () => {
    const state = withJobs({ woodcutter: 2 }); // 1 Wood/s
    state.deposits.wood.left = 10;
    tick(state, 20);
    expect(state.resources.wood).toBeCloseTo(10 + 20 * 0.25); // the forest plus 0.25/s of regrowth
    expect(state.deposits.wood.left).toBeCloseTo(0);
    expect(state.deposits.wood.cut).toBeCloseTo(state.resources.wood);
  });

  it('runs Stone, Clay and Coal out for good, since they never refill on their own', () => {
    const state = withJobs({ stonecutter: 4 }, withNodes({ quarry: 1 }));
    state.deposits.stone.left = 5;
    tick(state, 60);
    expect(state.resources.stone).toBeCloseTo(5);
    expect(DEPOSITS.stone.start).toBeGreaterThan(DEPOSITS.wood.start);
  });

  it('shrinks the forest by 500 Wood for every Quarry, and gives it back on a Realm reset', () => {
    const state = withNodes({ quarry: 3 });
    expect(depositMax(state, computeModifiers(state), 'wood')).toBe(8000 - 3 * 500);
    tick(state, 1);
    expect(state.deposits.wood.left).toBeCloseTo(6500);
    tick(state, 100); // full, so it can't regrow past its smaller size
    expect(state.deposits.wood.left).toBeCloseTo(6500);
    state.deposits.wood.left = 1000; // a cut-down forest keeps what is left
    state.nodes.quarry = 4;
    tick(state, 1);
    expect(state.deposits.wood.left).toBeCloseTo(1000.25);
    resetWorld(state, 'realm');
    expect(depositMax(state, computeModifiers(state), 'wood')).toBe(8000);
    expect(state.deposits.wood.left).toBe(8000);
  });

  it('regrows the forest faster with Forester\'s Lodges and Forestry, and slower with pollution', () => {
    const state = unlockAll(withNodes({ foresterLodge: 3, forestry: 1 }));
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo((0.25 + 0.75) * 2);
    state.nodes.coalMine = 5; // 10 pollution
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo(2 / 1.3);
    state.nodes.environmentalScience = 1;
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo(4 / (1 + 0.03 * 8));
  });

  it('refills Stone, Clay and Coal only by magic, whatever the pollution', () => {
    const state = unlockAll(withNodes({ earthsong: 1, deepTime: 1, coalMine: 5 }));
    expect(depositRegrowth(computeModifiers(state), 'stone')).toBe(0);
    state.activeSpells = ['earthsong', 'deepTime'];
    const mods = computeModifiers(state);
    expect(depositRegrowth(mods, 'stone')).toBe(3);
    expect(depositRegrowth(mods, 'clay')).toBe(2);
    expect(depositRegrowth(mods, 'coal')).toBe(2);
    const link = activeLinks(state).find((l) => l.source === 'earthsong' && l.effect.stat === 'regrow:stone');
    expect(link).toMatchObject({ from: 'arcana', to: 'realm', helpful: true });
  });

  it('comes back full but no bigger after a Realm reset without Rich Earth', () => {
    const state = createInitialState();
    state.deposits.wood = { left: 3000, max: 8000, cut: 5000 };
    resetWorld(state, 'realm');
    expect(state.deposits.wood).toEqual({ left: 8000, max: 8000, cut: 0 });
  });

  it('grows deposits on a Realm reset by 1% of what was gathered per Rich Earth level', () => {
    const state = createInitialState();
    state.meta.richEarth = 10;
    state.deposits.wood = { left: 3000, max: 8000, cut: 5000 };
    state.deposits.stone = { left: 40000, max: 50000, cut: 10000 };
    resetWorld(state, 'realm');
    expect(state.deposits.wood.max).toBeCloseTo(8500);
    expect(state.deposits.wood.left).toBeCloseTo(8500);
    expect(state.deposits.stone.max).toBeCloseTo(51000);
    resetWorld(state, 'lab'); // other worlds leave the deposits alone
    expect(state.deposits.wood.max).toBeCloseTo(8500);
  });
});

describe('land', () => {
  it('gives every Realm building level a square, and blocks building once the land is full', () => {
    const state = withNodes({ hut: 15, farm: 4, forestry: 1 }); // 19 of 20 squares
    Object.assign(state.resources, { wood: 1e6, stone: 1e6, iron: 1e6 });
    expect(land(state)).toBe(20);
    expect(landUsed(state)).toBe(19);
    expect(buyNode(state, 'lumberCamp')).toBe(true); // the 20th square, taken while it is built
    expect(landUsed(state)).toBe(20);
    tick(state, 60);
    expect(buyNode(state, 'quarry')).toBe(false);
  });

  it('finds more land with Cartography and each Expedition, and keeps it through a Lab reset', () => {
    const state = unlockAll(withNodes({ hut: 20, cartography: 1, expedition: 3, agriculture: 1 }));
    expect(land(state)).toBe(20 + 1 + 3 * 5);
    expect(maxLevel('expedition')).toBe(30);
    state.resources.wood = 1e6;
    expect(buyNode(state, 'farm')).toBe(true);
    const link = activeLinks(state).find((l) => l.source === 'expedition');
    expect(link).toMatchObject({ from: 'lab', to: 'realm', helpful: true, total: 15 });
    resetWorld(state, 'lab');
    expect(land(state)).toBe(36); // exploring is permanent
    expect(state.nodes.cartography).toBe(1);
    expect(state.nodes.expedition).toBe(3);
  });
});

describe('repeatable research', () => {
  it('lets Cartography be researched 10 times, 1 land each, doubling in price', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1, library: 1 }));
    state.resources.research = 1e9;
    expect(maxLevel('cartography')).toBe(10);
    expect(nodeCost(state, 'cartography').research).toBe(120);
    expect(startResearch(state, 'cartography')).toBe(true);
    pour(state, 120 * (2 ** 10 - 1)); // it costs only Research, so it stays the target level after level
    expect(state.nodes.cartography).toBe(10);
    expect(state.researching).toBe(null);
    expect(nodeCost(state, 'cartography').research).toBe(120 * 2 ** 10);
    expect(startResearch(state, 'cartography')).toBe(false);
    expect(land(state)).toBe(20 + 10);
  });

  it('lets Rationalism be researched 10 times, stacking both its effects', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1, library: 1, rationalism: 9 }));
    expect(startResearch(state, 'rationalism')).toBe(true);
    pour(state, 1e9);
    expect(state.nodes.rationalism).toBe(10);
    expect(startResearch(state, 'rationalism')).toBe(false);
    const mods = computeModifiers(state);
    expect(mods.get('rate:mana')?.mul).toBeCloseTo(0.8 ** 10);
  });
});

describe('build slots', () => {
  it('builds one thing per world at a time, while other worlds build in parallel', () => {
    const state = unlockAll(withNodes({ hut: 1, library: 1, shrine: 1, forestry: 1 }));
    Object.assign(state.resources, { wood: 1000, stone: 1000, iron: 1000, food: 1000, research: 1000, mana: 1000 });
    expect(buyNode(state, 'hut')).toBe(true);
    expect(buyNode(state, 'lumberCamp')).toBe(false); // the Realm is busy
    expect(startResearch(state, 'scientificMethod')).toBe(true); // research takes no build slot
    expect(buyNode(state, 'manaWell')).toBe(true);
    tick(state, 60);
    expect(buyNode(state, 'lumberCamp')).toBe(true); // the Hut is done
  });

  it('adds a slot per world with each Master Builders level, up to 5', () => {
    const state = unlockAll(withNodes({ hut: 1, forestry: 1 }));
    Object.assign(state.resources, { wood: 1e6, stone: 1e6, iron: 1e6, food: 1e6 });
    state.meta.masterBuilders = 2;
    expect(buildSlots(state)).toBe(3);
    expect(['hut', 'lumberCamp', 'quarry', 'farm'].map((id) => buyNode(state, id as NodeId))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    state.echoes = 1e6;
    state.meta.masterBuilders = 4;
    expect(buyMeta(state, 'masterBuilders')).toBe(false);
    expect(buildSlots(state)).toBe(5);
  });
});

describe('miners and the ley lines', () => {
  it('hurts Mana more per miner with every Mine after the first', () => {
    const one = unlockAll(withJobs({ miner: 5 }, withNodes({ mine: 1, shrine: 1 })));
    const five = unlockAll(withJobs({ miner: 5 }, withNodes({ mine: 5, shrine: 1 })));
    expect(computeModifiers(one).get('rate:mana')?.mul).toBeCloseTo(0.98 ** 5);
    expect(computeModifiers(five).get('rate:mana')?.mul).toBeCloseTo(0.94 ** 5); // 2% + 4 x 1%
    const link = activeLinks(five).find((l) => l.source === 'miner');
    expect(link?.total).toBeCloseTo(0.94 ** 5);
  });
});

describe('population', () => {
  it('starts with 2 people and room for 3', () => {
    const state = createInitialState();
    expect(state.population).toBe(2);
    expect(housing(computeModifiers(state))).toBe(3);
    expect(idleWorkers(state)).toBe(2);
  });

  it('fills free housing over time, eating Food, and no further', () => {
    const state = withNodes({ hut: 2 }); // 3 + 4 = 7 housing, 2 crowding
    state.resources.food = 1000;
    expect(housing(computeModifiers(state))).toBe(7);
    tick(state, 10); // 1 person every 20s, slowed a little by crowding
    expect(state.population).toBeCloseTo(2 + 0.5 / 1.04);
    expect(state.resources.food).toBeCloseTo(1000 - 5 / 1.04);
    tick(state, 1000);
    expect(state.population).toBe(7);
    expect(state.resources.food).toBeCloseTo(1000 - 50);
    expect(arrivalBlocker(state, computeModifiers(state))).toBe('housing');
  });

  it('slows growth with every Hut and House built', () => {
    const none = createInitialState();
    const big = withNodes({ hut: 20, house: 20 }); // 20 + 40 = 60 crowding
    expect(crowdingFactor(computeModifiers(none))).toBe(1);
    expect(crowdingFactor(computeModifiers(big))).toBeCloseTo(1 / (1 + 0.02 * 60));
    expect(arrivalRate(computeModifiers(big))).toBeCloseTo(0.05 / 2.2);
    const link = activeLinks(big).find((l) => l.source === 'hut');
    expect(link).toBeUndefined(); // crowding is a Realm effect, not a cross-world link
  });

  it('lets Aqueducts, Medicine and Sanitation cut crowding', () => {
    const state = unlockAll(withNodes({ hut: 20, house: 20, aqueduct: 2, medicine: 1, sanitation: 1 }));
    const crowd = 60 * 0.85 ** 2 * 0.7 * 0.6;
    expect(crowdingFactor(computeModifiers(state))).toBeCloseTo(1 / (1 + 0.02 * crowd));
    const lab = activeLinks(state).find((l) => l.source === 'sanitation');
    expect(lab).toMatchObject({ from: 'lab', to: 'realm', helpful: true });
  });

  it('slows growth with pollution from dirty industry, on top of crowding', () => {
    const state = unlockAll(withNodes({ hut: 5, coalMine: 3, kiln: 2, industrialization: 1 }));
    const smog = 3 * 2 + 2 * 1 + 8; // 16
    const mods = computeModifiers(state);
    expect(pollutionFactor(mods)).toBeCloseTo(1 / (1 + 0.03 * smog));
    expect(arrivalRate(mods)).toBeCloseTo(0.05 / (1 + 0.02 * 5) / (1 + 0.03 * smog));
    const link = activeLinks(state).find((l) => l.source === 'industrialization' && l.effect.stat === 'pollution');
    expect(link).toMatchObject({ from: 'lab', to: 'realm', helpful: false, total: 8 });
  });

  it('lets Parks and Filtration cut pollution', () => {
    const state = unlockAll(withNodes({ coalMine: 5, park: 3, filtration: 1 }));
    expect(pollutionFactor(computeModifiers(state))).toBeCloseTo(1 / (1 + 0.03 * 10 * 0.9 ** 3 * 0.5));
  });

  it('counts the Food that newcomers eat in the Food rate', () => {
    const state = withJobs({ farmer: 2 }); // 1.2 Food/s, 2 of 3 housing used
    state.resources.food = 100;
    const mods = computeModifiers(state);
    expect(netRate(state, mods, 'food')).toBeCloseTo(1.2 - 0.05 * 10);
    const before = state.resources.food;
    tick(state, 1);
    expect(state.resources.food - before).toBeCloseTo(1.2 - 0.05 * 10, 5);
    state.population = 3; // housing is full, so nobody eats on arrival
    expect(netRate(state, computeModifiers(state), 'food')).toBeCloseTo(1.2);
  });

  it('speeds up growth with Wells, Taverns and the Fertility Rite', () => {
    const state = unlockAll(withNodes({ well: 2, tavern: 1, fertilityRite: 1 }));
    state.activeSpells = ['fertilityRite'];
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo((0.05 + 0.02) * 1.1 ** 2 * 1.3);
  });

  it('only lets a Tavern speed up growth while it gets its Gold', () => {
    const state = withNodes({ tavern: 2 });
    state.resources.gold = 10;
    tick(state, 10);
    expect(state.resources.gold).toBeCloseTo(10 - 2 * 0.02 * 10, 5);
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo(0.05 + 2 * 0.02);
    state.resources.gold = 0;
    tick(state, 1);
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo(0.05);
  });

  it('keeps only one spell on at a time, swapping out the oldest', () => {
    const state = unlockAll(withNodes({ fertilityRite: 1, haste: 1, animation: 1 }));
    expect(toggleSpell(state, 'fertilityRite')).toBe(true);
    expect(toggleSpell(state, 'haste')).toBe(true);
    expect(state.activeSpells).toEqual(['haste']);
    state.meta.multicast = 1;
    expect(spellSlots(state)).toBe(2);
    expect(toggleSpell(state, 'animation')).toBe(true);
    expect(state.activeSpells).toEqual(['haste', 'animation']);
    expect(toggleSpell(state, 'fertilityRite')).toBe(true);
    expect(state.activeSpells).toEqual(['animation', 'fertilityRite']);
  });

  it('does not count Summon Demons against the spell slots', () => {
    const state = unlockAll(withNodes({ summoningCircle: 1, haste: 1, animation: 1 }));
    state.population = 10;
    toggleSpell(state, 'haste');
    toggleSpell(state, 'summoningCircle');
    expect(state.activeSpells).toEqual(['haste', 'summoningCircle']);
    expect(toggleSpell(state, 'animation')).toBe(true); // swaps out Haste, never the horde
    expect(state.activeSpells).toEqual(['summoningCircle', 'animation']);
  });

  it('casts Summon Demons for good: it cannot be switched off and needs people to feed on', () => {
    const state = unlockAll(withNodes({ summoningCircle: 1 }));
    state.population = 2;
    expect(toggleSpell(state, 'summoningCircle')).toBe(false); // only the 2 survivors: nothing to eat
    state.population = 10;
    expect(toggleSpell(state, 'summoningCircle')).toBe(true);
    expect(state.demons).toBe(1);
    expect(toggleSpell(state, 'summoningCircle')).toBe(true); // still on
    expect(state.activeSpells).toContain('summoningCircle');
  });

  it('grows the demon horde over time, scaling both its boost and its killing', () => {
    const state = unlockAll(withJobs({ woodcutter: 10 }, withNodes({ summoningCircle: 1 })));
    toggleSpell(state, 'summoningCircle');
    tick(state, 180); // one doubling; no housing free, so nobody new arrives
    expect(state.demons).toBeCloseTo(2);
    expect(runningLevel(state, 'summoningCircle')).toBeCloseTo(2);
    const mods = computeModifiers(state);
    expect(mods.get('prod:arcana')?.mul).toBeCloseTo(1 + 0.2 * 2);
    expect(deathRate(mods) * 3600).toBeCloseTo(6 * 2);
    expect(state.population).toBeLessThan(10);
    const link = activeLinks(state).find((l) => l.source === 'summoningCircle' && l.to === 'realm');
    expect(link).toMatchObject({ helpful: false });
    expect(link?.total).toBeCloseTo(12);
  });

  it('ends the horde once only 2 survivors are left, and lets you summon again later', () => {
    const state = unlockAll(withJobs({ woodcutter: 10 }, withNodes({ summoningCircle: 1 })));
    toggleSpell(state, 'summoningCircle');
    tick(state, 3600);
    expect(state.population).toBe(2);
    expect(state.jobs.woodcutter).toBe(2);
    expect(state.demons).toBe(0);
    expect(state.activeSpells).not.toContain('summoningCircle');
    expect(deathRate(computeModifiers(state))).toBe(0);
    state.population = 5;
    expect(toggleSpell(state, 'summoningCircle')).toBe(true);
  });

  it('blocks resetting Arcana while the horde runs', () => {
    const state = unlockAll(withJobs({ woodcutter: 10 }, withNodes({ summoningCircle: 1, manaWell: 3 })));
    toggleSpell(state, 'summoningCircle');
    tick(state, 60);
    expect(canResetWorld(state, 'arcana')).toBe(false);
    expect(resetWorld(state, 'arcana')).toBe(0);
    expect(state.nodes.manaWell).toBe(3);
    expect(state.resets.arcana).toBe(0);
    expect(state.activeSpells).toContain('summoningCircle');
    expect(canResetWorld(state, 'lab')).toBe(true);
  });

  it('ends the horde when the Realm is reset, since only the survivors are left', () => {
    const state = unlockAll(withJobs({ woodcutter: 10 }, withNodes({ summoningCircle: 1 })));
    toggleSpell(state, 'summoningCircle');
    tick(state, 60);
    resetWorld(state, 'realm');
    expect(state.population).toBe(2);
    expect(state.demons).toBe(0);
    expect(state.activeSpells).not.toContain('summoningCircle');
    expect(state.nodes.summoningCircle).toBe(1); // still learned, so it can be cast again later
    expect(canResetWorld(state, 'arcana')).toBe(true);
  });

  it('takes deaths from the idle first, then from random workers, not the last job first', () => {
    const state = unlockAll(withJobs({ woodcutter: 4, farmer: 4 }, withNodes({ summoningCircle: 1, farm: 1 })));
    state.population = 10.5; // 8 at work, 2 idle, and half a newcomer
    toggleSpell(state, 'summoningCircle');
    state.demons = 600; // 1 death a second
    const picks = [0.05, 0.95];
    const previous = setRandom(() => picks.shift() ?? 0);
    try {
      tick(state, 4);
    } finally {
      setRandom(previous);
    }
    // The 2 idle go first. Then 0.05 of 8 workers -> the 1st, a woodcutter; 0.95 of 7 -> the 7th, a farmer
    expect(Math.floor(state.population)).toBe(6);
    expect(state.jobs.woodcutter).toBe(3);
    expect(state.jobs.farmer).toBe(3);
  });

  it('stops people arriving when Food runs out', () => {
    const state = withNodes({ hut: 5 });
    state.resources.food = 15;
    tick(state, 100);
    expect(state.population).toBeCloseTo(3.5);
    expect(state.resources.food).toBeCloseTo(0);
    expect(arrivalBlocker(state, computeModifiers(state))).toBe('food');
  });

  it('only assigns idle people, and only to open jobs', () => {
    const state = createInitialState();
    expect(assignJob(state, 'woodcutter', 5)).toBe(2);
    expect(state.jobs.woodcutter).toBe(2);
    expect(assignJob(state, 'stonecutter', 1)).toBe(0); // no free people
    expect(assignJob(state, 'woodcutter', -1)).toBe(-1);
    expect(assignJob(state, 'stonecutter', 1)).toBe(0); // needs a Quarry
    state.nodes.quarry = 1;
    expect(assignJob(state, 'stonecutter', 1)).toBe(1);
    expect(assignJob(state, 'stonecutter', -1)).toBe(-1);
    expect(assignJob(state, 'miner', 1)).toBe(0); // needs a Mine
    state.nodes.mine = 1;
    expect(assignJob(state, 'miner', 1)).toBe(1);
    expect(idleWorkers(state)).toBe(0);
  });

  it('does not count a person who is still arriving', () => {
    const state = createInitialState();
    state.population = 2.9;
    expect(idleWorkers(state)).toBe(2);
  });

  it('sends miners home when there is no Mine', () => {
    const state = withJobs({ miner: 2, woodcutter: 1 });
    tick(state, 1);
    expect(state.jobs.miner).toBe(0);
    expect(state.jobs.woodcutter).toBe(1);
  });
});

describe('cross-world requirements', () => {
  const grown = () => withNodes({ lumberCamp: 1, quarry: 1, workshop: 1, mine: 1, sawmill: 1, coalMine: 1, farm: 5 });

  it('needs a Lab tech before the Realm can build a Blast Furnace', () => {
    const state = grown();
    state.resources.bricks = 1000;
    state.resources.iron = 1000;
    expect(buyNode(state, 'blastFurnace')).toBe(false);
    state.unlockedWorlds.push('lab');
    state.nodes.metallurgy = 1;
    expect(buyNode(state, 'blastFurnace')).toBe(true);
  });

  it('keeps built buildings working after the Lab is reset, but stops new ones', () => {
    const state = unlockAll(grown());
    Object.assign(state.nodes, { scientificMethod: 1, metallurgy: 1, blastFurnace: 1 });
    resetWorld(state, 'lab');
    expect(state.nodes.metallurgy).toBe(0);
    expect(state.nodes.blastFurnace).toBe(1);
    expect(isNodeAvailable(state, 'blastFurnace')).toBe(false);
  });

  it('needs both magic and science for Golem Works', () => {
    const state = unlockAll(withNodes({ blastFurnace: 1, runesmith: 1, animation: 1 }));
    expect(isNodeAvailable(state, 'golemWorks')).toBe(false);
    state.nodes.automation = 1;
    expect(isNodeAvailable(state, 'golemWorks')).toBe(true);
  });

  it('reports a Realm building that burns Arcana Essence as a harmful link', () => {
    const state = unlockAll(withNodes({ runesmith: 2, manaWell: 1 }));
    state.resources.stone = 100;
    state.resources.essence = 100;
    tick(state, 1);
    expect(state.resources.essence).toBeCloseTo(100 - 0.2);
    expect(state.resources.runestone).toBeCloseTo(0.1);
    const link = activeLinks(state).find((l) => l.source === 'runesmith');
    expect(link).toMatchObject({ from: 'realm', to: 'arcana', helpful: false });
    expect(link?.total).toBeCloseTo(-0.2);
  });
});

describe('build times', () => {
  it('rises steeply by tier and gently by level', () => {
    const state = unlockAll(createInitialState());
    expect(buildSeconds(state, 'hut')).toBeCloseTo(5);
    expect(buildSeconds(state, 'house')).toBeCloseTo(45);
    expect(buildSeconds(state, 'cathedral')).toBeCloseTo(600);
    state.nodes.hut = 10;
    expect(buildSeconds(state, 'hut')).toBeCloseTo(5 * 1.05 ** 10);
  });

  it('builds over time, and the level only counts when finished', () => {
    const state = createInitialState();
    Object.assign(state.resources, { wood: 100, food: 100 });
    expect(buyNode(state, 'hut')).toBe(true);
    expect(state.resources.wood).toBeCloseTo(90); // paid up front
    expect(state.resources.food).toBeCloseTo(90);
    tick(state, 4);
    expect(state.nodes.hut).toBe(0);
    expect(constructionSecondsLeft(state, 'hut')).toBeCloseTo(1);
    tick(state, 1);
    expect(state.nodes.hut).toBe(1);
    expect(state.construction.hut).toBeUndefined();
  });

  it('builds faster with speed bonuses, including ones from other worlds', () => {
    const state = unlockAll(withNodes({ buildersGuild: 2, haste: 1, logistics: 1 }));
    state.activeSpells = ['haste'];
    state.meta.swiftHands = 1;
    const speed = 1.15 ** 2 * 1.2 * 1.3 * 1.1;
    expect(buildSeconds(state, 'house')).toBeCloseTo(45 / speed);
    expect(buildSeconds(state, 'scholar')).toBeCloseTo(5 / (1.2 * 1.1));
    const haste = activeLinks(state).filter((l) => l.source === 'haste');
    expect(haste.map((l) => l.to).sort()).toEqual(['lab', 'realm']);
  });

  it('opens a world only when its gateway finishes building', () => {
    const state = withNodes({ lumberCamp: 6, quarry: 3, workshop: 1, occultism: 1 });
    state.resources.wood = 1000;
    state.resources.stone = 1000;
    expect(buyNode(state, 'shrine')).toBe(true);
    tick(state, 44);
    expect(isWorldUnlocked(state, 'arcana')).toBe(false);
    tick(state, 1);
    expect(isWorldUnlocked(state, 'arcana')).toBe(true);
  });

  it('drops unfinished construction when its world is reset', () => {
    const state = createInitialState();
    Object.assign(state.resources, { wood: 100, food: 100 });
    expect(buyNode(state, 'hut')).toBe(true);
    resetWorld(state, 'realm');
    expect(state.construction.hut).toBeUndefined();
    tick(state, 10);
    expect(state.nodes.hut).toBe(0);
  });
});

describe('spells', () => {
  it('do nothing and cost nothing until switched on', () => {
    const state = unlockAll(withNodes({ fertilityRite: 1 }));
    state.resources.mana = 100;
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo(0.05);
    tick(state, 10);
    expect(state.resources.mana).toBeCloseTo(100);
    expect(activeLinks(state).some((l) => l.source === 'fertilityRite')).toBe(false);
  });

  it('apply their effects and drain upkeep while on', () => {
    const state = unlockAll(withNodes({ fertilityRite: 1 }));
    state.resources.mana = 100;
    expect(toggleSpell(state, 'fertilityRite')).toBe(true);
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo(0.05 * 1.3);
    tick(state, 10);
    expect(state.resources.mana).toBeCloseTo(90);
    expect(upkeepRate(state, 'mana')).toBeCloseTo(1);
    expect(activeLinks(state).find((l) => l.source === 'fertilityRite')).toMatchObject({ to: 'realm', helpful: true });
    expect(toggleSpell(state, 'fertilityRite')).toBe(false);
    tick(state, 10);
    expect(state.resources.mana).toBeCloseTo(90);
  });

  it('fade when their upkeep cannot be paid', () => {
    const state = unlockAll(withNodes({ haste: 1 }));
    state.activeSpells = ['haste'];
    tick(state, 1); // no Mana or Essence at all
    expect(state.efficiency.haste).toBe(0);
    expect(buildSeconds(state, 'hut')).toBeCloseTo(5);
    expect(runningLevel(state, 'haste')).toBe(1);
  });

  it('cannot be switched on before they are learned', () => {
    const state = unlockAll(createInitialState());
    expect(toggleSpell(state, 'haste')).toBe(false);
    expect(state.activeSpells).toEqual([]);
    expect(toggleSpell(state, 'runeLore')).toBe(false); // a discovery, not a spell
  });

  it('are forgotten and switched off by an Arcana reset', () => {
    const state = unlockAll(withNodes({ haste: 1, animation: 1 }));
    state.activeSpells = ['haste', 'animation'];
    resetWorld(state, 'arcana');
    expect(state.activeSpells).toEqual([]);
    expect(state.nodes.haste).toBe(0);
  });
});

describe('converters', () => {
  it('use at least 10 of their main input for each unit they make', () => {
    let checked = 0;
    for (const node of Object.values(NODES)) {
      if (!node.upkeep || node.spell) continue;
      const made = node.effects
        .filter((e) => e.stat.startsWith('rate:') && e.kind === 'add' && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      if (made === 0) continue;
      // Only inputs from the node's own world are refined; another world's (Scholars eating Food) is just a cost.
      const own = (Object.entries(node.upkeep) as [ResourceId, number][]).filter(([r]) => RESOURCES[r].world === node.world);
      if (own.length === 0) continue;
      const main = Math.max(...own.map(([, n]) => n));
      expect(main / made, node.id).toBeGreaterThanOrEqual(10 - 1e-9);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  });
});

describe('lumber camps', () => {
  it('need Forestry from the Lab and cost Iron', () => {
    const state = createInitialState();
    Object.assign(state.resources, { wood: 1000, iron: 5 });
    expect(nodeCost(state, 'lumberCamp')).toEqual({ wood: 25, iron: 10 });
    expect(buyNode(state, 'lumberCamp')).toBe(false); // no Forestry yet
    state.nodes.forestry = 1;
    expect(buyNode(state, 'lumberCamp')).toBe(false); // not enough Iron
    state.resources.iron = 10;
    expect(buyNode(state, 'lumberCamp')).toBe(true);
    expect(state.resources.iron).toBe(0);
  });
});

describe('exploring', () => {
  it('needs Sailing and Navigation before any Expedition can set out', () => {
    const state = unlockAll(withNodes({ library: 1, scientificMethod: 1, cartography: 1, engineering: 1 }));
    Object.assign(state.resources, { food: 1e6, planks: 1e6, glass: 1e6 });
    expect(startResearch(state, 'expedition')).toBe(false);
    expect(startResearch(state, 'navigation')).toBe(false); // needs Sailing and Optics
    expect(startResearch(state, 'sailing')).toBe(true);
    pour(state, 1e6);
    state.nodes.optics = 1;
    expect(startResearch(state, 'navigation')).toBe(true);
    pour(state, 1e6);
    expect(startResearch(state, 'expedition')).toBe(true);
    expect(state.resources.food).toBeCloseTo(1e6 - 500, 2);
    pour(state, 1e6);
    // An Expedition also costs Food, so the next one waits for you to send it
    expect(state.nodes.expedition).toBe(1);
    expect(state.researching).toBe(null);
  });
});

describe('laboratories', () => {
  it('each weaken all Arcana production by 3%', () => {
    const state = unlockAll(withNodes({ laboratory: 5 }));
    expect(computeModifiers(state).get('prod:arcana')?.mul).toBeCloseTo(0.97 ** 5, 5);
    const link = activeLinks(state).find((l) => l.source === 'laboratory');
    expect(link).toMatchObject({ from: 'lab', to: 'arcana', helpful: false });
  });
});

describe('research list', () => {
  it('lists only Lab techs whose tech prerequisites are researched, and drops finished ones', () => {
    const state = unlockAll(withNodes({ library: 1 }));
    expect(isResearchListed(state, 'scientificMethod')).toBe(true);
    expect(isResearchListed(state, 'engineering')).toBe(false);
    expect(isResearchListed(state, 'occultism')).toBe(true);
    expect(isResearchListed(state, 'arcaneTheory')).toBe(false); // needs Occultism
    state.nodes.occultism = 1;
    expect(isResearchListed(state, 'arcaneTheory')).toBe(true);
    state.nodes.scientificMethod = 1;
    expect(isResearchListed(state, 'scientificMethod')).toBe(false);
    expect(isResearchListed(state, 'mining')).toBe(true);
    expect(isResearchListed(state, 'geology')).toBe(false); // needs Mining
    state.nodes.mining = 1;
    expect(isResearchListed(state, 'geology')).toBe(true);
    expect(isResearchListed(state, 'engineering')).toBe(false); // needs Geology and Metallurgy
    state.nodes.geology = 1;
    expect(isResearchListed(state, 'engineering')).toBe(false);
    state.nodes.metallurgy = 1;
    expect(isResearchListed(state, 'engineering')).toBe(true);
    expect(isResearchListed(state, 'sanitation')).toBe(false); // needs Medicine and Engineering
    state.nodes.cartography = 3;
    expect(isResearchListed(state, 'cartography')).toBe(true); // 3 of 10
    state.nodes.cartography = 10;
    expect(isResearchListed(state, 'cartography')).toBe(false);
    expect(isResearchListed(state, 'scholar')).toBe(false); // buildings are listed as before
  });

  it('lays the whole tree out in columns by depth', () => {
    const cols = researchTreeColumns();
    const col = (id: NodeId) => cols.findIndex((c) => c.includes(id));
    expect(col('scientificMethod')).toBe(0);
    expect(col('occultism')).toBe(0);
    expect(col('settlements')).toBe(0);
    expect(col('agriculture')).toBe(1);
    expect(col('homebuilding')).toBe(1);
    expect(col('currency')).toBe(1);
    expect(col('arcaneTheory')).toBe(1);
    expect(col('mining')).toBe(1);
    expect(col('geology')).toBe(2); // after Mining
    expect(col('engineering')).toBe(3); // after Geology and Metallurgy
    expect(col('sailing')).toBe(4);
    expect(col('navigation')).toBe(5); // after Sailing and Optics, both in column 4
    expect(col('expedition')).toBe(6);
    expect(cols.flat()).toHaveLength(new Set(cols.flat()).size);
  });
});

describe('printing press and church', () => {
  it('trade Mana and Research against each other in opposite directions', () => {
    const press = unlockAll(withNodes({ printingPress: 2 }));
    expect(activeLinks(press).filter((l) => l.source === 'printingPress').map((l) => [l.to, l.total, l.helpful])).toEqual([
      ['lab', 2, true],
      ['arcana', -1.8, false],
    ]);
    const church = unlockAll(withNodes({ church: 1, shrine: 1 }));
    expect(nodeCost(createInitialState(), 'church')).toEqual({ bricks: 120, glass: 40 });
    expect(activeLinks(church).filter((l) => l.source === 'church').map((l) => [l.to, l.total])).toEqual([
      ['arcana', 1],
      ['lab', -0.9],
    ]);
  });
});

describe('markets', () => {
  it('need Currency from the Lab', () => {
    const state = unlockAll(withNodes({ house: 1 }));
    expect(isNodeAvailable(state, 'market')).toBe(false);
    expect(isResearchListed(state, 'currency')).toBe(false); // needs Settlements
    state.nodes.settlements = 1;
    expect(isResearchListed(state, 'currency')).toBe(true);
    state.nodes.currency = 1;
    expect(isNodeAvailable(state, 'market')).toBe(true);
  });
});

describe('building list', () => {
  it('hides buildings until everything they require is unlocked', () => {
    const state = unlockAll(createInitialState());
    expect(isBuildingListed(state, 'hut')).toBe(true);
    expect(isBuildingListed(state, 'farm')).toBe(false); // needs Agriculture from the Lab
    state.nodes.agriculture = 1;
    expect(isBuildingListed(state, 'farm')).toBe(true);
    expect(isBuildingListed(state, 'workshop')).toBe(false); // needs a Quarry
    state.nodes.quarry = 1;
    expect(isBuildingListed(state, 'workshop')).toBe(true);
    expect(isBuildingListed(state, 'lumberCamp')).toBe(false); // needs Forestry from the Lab
    state.nodes.forestry = 1;
    expect(isBuildingListed(state, 'lumberCamp')).toBe(true);
    state.nodes.forestry = 0; // e.g. after a Lab reset, camps already built stay listed
    state.nodes.lumberCamp = 2;
    expect(isBuildingListed(state, 'lumberCamp')).toBe(true);
    expect(isBuildingListed(state, 'scientificMethod')).toBe(false); // techs are listed separately
  });
});

describe('switching buildings off', () => {
  it('stops a consuming building from using or making anything until it is switched back on', () => {
    const state = withNodes({ sawmill: 1 });
    state.resources.wood = 100;
    expect(canSwitchOff('sawmill')).toBe(true);
    expect(canSwitchOff('hut')).toBe(false); // uses nothing
    expect(canSwitchOff('fertilityRite')).toBe(false); // spells have their own switch
    expect(toggleBuilding(state, 'sawmill')).toBe(false);
    tick(state, 10);
    expect(state.resources.wood).toBe(100);
    expect(state.resources.planks).toBe(0);
    expect(toggleBuilding(state, 'sawmill')).toBe(true);
    tick(state, 10);
    expect(state.resources.wood).toBeCloseTo(90);
    expect(state.resources.planks).toBeCloseTo(1);
  });

  it('forgets the switch when its world is reset', () => {
    const state = unlockAll(withNodes({ sawmill: 1 }));
    toggleBuilding(state, 'sawmill');
    resetWorld(state, 'realm');
    expect(state.switchedOff).toEqual([]);
  });
});

describe('settlements', () => {
  it('is a root research leading to Agriculture, Housing and Currency, and Houses need Housing', () => {
    const state = unlockAll(withNodes({ sawmill: 1, kiln: 1 }));
    expect(isResearchListed(state, 'settlements')).toBe(true);
    for (const id of ['agriculture', 'homebuilding', 'currency'] as NodeId[]) expect(isResearchListed(state, id)).toBe(false);
    state.nodes.settlements = 1;
    for (const id of ['agriculture', 'homebuilding', 'currency'] as NodeId[]) expect(isResearchListed(state, id)).toBe(true);
    expect(isNodeAvailable(state, 'house')).toBe(false);
    state.nodes.homebuilding = 1;
    expect(isNodeAvailable(state, 'house')).toBe(true);
  });
});

describe('huts', () => {
  it('get so expensive that the starting forest pays for 5 at most', () => {
    const state = createInitialState();
    const prices: number[] = [];
    for (let n = 0; n < 6; n++) {
      state.nodes.hut = n;
      prices.push(nodeCost(state, 'hut').wood ?? 0);
    }
    const firstFour = prices.slice(0, 4).reduce((a, b) => a + b, 0);
    const firstFive = firstFour + (prices[4] ?? 0);
    expect(firstFour).toBeLessThan(DEPOSITS.wood.start / 5);
    expect(firstFive).toBeLessThan(DEPOSITS.wood.start);
    expect(firstFive + (prices[5] ?? 0)).toBeGreaterThan(DEPOSITS.wood.start);
  });
});

describe('scholars', () => {
  it('are bought with Food: 1,000 for the first, 50% more for each after', () => {
    const state = unlockAll(createInitialState());
    expect(nodeCost(state, 'scholar')).toEqual({ food: 1000 });
    state.resources.food = 999;
    expect(buyNode(state, 'scholar')).toBe(false);
    state.resources.food = 1000;
    expect(buyNode(state, 'scholar')).toBe(true);
    expect(state.resources.food).toBe(0);
    state.nodes.scholar = 2;
    expect(nodeCost(state, 'scholar').food).toBeCloseTo(2250);
  });

  it('eat Realm Food without using Realm people, and stall when it runs out', () => {
    const state = unlockAll(withNodes({ scholar: 5 }));
    state.resources.food = 100;
    state.population = 3; // housing is full, so nobody arrives and eats Food
    const people = state.population;
    startResearch(state, 'scientificMethod');
    tick(state, 10);
    expect(state.resources.food).toBeCloseTo(100 - 5 * 0.2 * 10, 5);
    expect(state.population).toBe(people);
    expect(state.researchProgress.scientificMethod).toBeGreaterThan(0);

    state.resources.food = 0;
    const stalled = state.researchProgress.scientificMethod ?? 0;
    tick(state, 10);
    expect(state.researchProgress.scientificMethod).toBeCloseTo(stalled, 5);
    expect(activeLinks(state).some((l) => l.source === 'scholar' && l.to === 'realm' && !l.helpful)).toBe(true);
  });

  it('each take an idle Realm person into the Lab, freeing their housing', () => {
    const state = unlockAll(withJobs({ woodcutter: 3 }, withNodes({ hut: 1 })));
    state.population = 3; // all at work
    state.resources.food = 1000;
    expect(needsPeople(state, 'scholar')).toBe(true);
    expect(buyNode(state, 'scholar')).toBe(false);
    state.population = 4.5;
    expect(buyNode(state, 'scholar')).toBe(true);
    expect(state.population).toBeCloseTo(3.5);
    expect(state.jobs.woodcutter).toBe(3);
    completeConstruction(state, 'scholar');
    expect(state.nodes.scholar).toBe(1);
    expect(state.population).toBeCloseTo(3.5); // Scholars never count toward Realm housing
  });

  it('are hunted by demons once the idle are gone, sparing a Realm person each time', () => {
    const state = unlockAll(withJobs({ woodcutter: 4 }, withNodes({ summoningCircle: 1, scholar: 4 })));
    state.population = 4;
    toggleSpell(state, 'summoningCircle');
    state.demons = 600; // 1 death a second
    const picks = [0.9, 0.1]; // 0.9 of 4 workers + 4 Scholars -> a Scholar; 0.1 of 4 + 3 -> a woodcutter
    const previous = setRandom(() => picks.shift() ?? 0);
    try {
      tick(state, 1);
      state.demons = 600; // keep it at exactly 1 death a second
      tick(state, 1);
    } finally {
      setRandom(previous);
    }
    expect(state.nodes.scholar).toBe(3);
    expect(state.jobs.woodcutter).toBe(3);
    expect(Math.floor(state.population)).toBe(3);
  });

  it('are left alone by the last demon feast, which leaves exactly the survivors in the Realm', () => {
    const state = unlockAll(withJobs({ woodcutter: 3 }, withNodes({ summoningCircle: 1, scholar: 5 })));
    state.population = 3;
    toggleSpell(state, 'summoningCircle');
    state.demons = 600;
    const previous = setRandom(() => 0.99); // every pick lands on a Scholar
    try {
      tick(state, 1);
    } finally {
      setRandom(previous);
    }
    expect(state.population).toBe(2);
    expect(state.nodes.scholar).toBe(5);
    expect(state.demons).toBe(0);
  });

  it('Lab Assistants are hired with Realm Gold', () => {
    const state = unlockAll(withNodes({ scholar: 1 }));
    expect(nodeCost(state, 'labAssistants')).toEqual({ gold: 25 });
    state.resources.research = 1e6;
    expect(buyNode(state, 'labAssistants')).toBe(false);
    state.resources.gold = 25;
    expect(buyNode(state, 'labAssistants')).toBe(true);
    expect(state.resources.gold).toBe(0);
    expect(state.resources.research).toBe(1e6);
  });

  it('Lab Assistants eat Realm Food too, and stop speeding up research without it', () => {
    const state = unlockAll(withNodes({ labAssistants: 2 }));
    state.resources.food = 100;
    state.population = 3;
    tick(state, 10);
    expect(state.resources.food).toBeCloseTo(100 - 2 * 0.2 * 10, 5);
    expect(computeModifiers(state).get('rate:research')?.mul).toBeCloseTo(1.21, 5);
    state.resources.food = 0;
    tick(state, 1);
    expect(computeModifiers(state).get('rate:research')?.mul ?? 1).toBeCloseTo(1, 5);
  });
});

describe('research', () => {
  it('streams Research into the target instead of piling it up, and wastes it with no target', () => {
    const state = unlockAll(withNodes({ scholar: 10 }));
    state.resources.food = 1e6;
    tick(state, 10);
    expect(state.resources.research).toBe(0); // nothing picked: it is lost
    expect(startResearch(state, 'scientificMethod')).toBe(true);
    const rate = netRate(state, computeModifiers(state), 'research');
    tick(state, 10);
    expect(state.resources.research).toBe(0);
    expect(state.researchProgress.scientificMethod).toBeCloseTo(rate * 10, 5);
    expect(researchSecondsLeft(state)).toBeCloseTo((researchNeeded(state, 'scientificMethod') - rate * 10) / rate, 3);
  });

  it('finishes the moment enough Research is in, with no build time', () => {
    const state = unlockAll(createInitialState());
    startResearch(state, 'settlements');
    pour(state, researchNeeded(state, 'settlements') - 1);
    expect(state.nodes.settlements).toBe(0);
    pour(state, 1);
    expect(state.nodes.settlements).toBe(1);
    expect(state.construction.settlements).toBeUndefined();
    expect(state.researchProgress.settlements).toBeUndefined();
  });

  it('pays other costs once when a tech is first picked, and keeps progress when you switch away', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1, mining: 1 }));
    Object.assign(state.resources, { food: 200, stone: 100 });
    expect(researchUpfrontCost(state, 'medicine')).toEqual({ food: 200 });
    expect(startResearch(state, 'medicine')).toBe(true);
    expect(state.resources.food).toBe(0);
    pour(state, 100);
    expect(startResearch(state, 'geology')).toBe(true);
    expect(state.resources.stone).toBe(0);
    pour(state, 30);
    expect(startResearch(state, 'medicine')).toBe(true); // already paid for
    expect(state.researchProgress).toEqual({ medicine: 100, geology: 30 });
    stopResearch(state);
    pour(state, 1000);
    expect(state.researchProgress).toEqual({ medicine: 100, geology: 30 });
  });

  it('cannot start a tech whose other costs you cannot pay', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1 }));
    expect(canStartResearch(state, 'medicine')).toBe(false); // 200 Food
    state.resources.food = 200;
    expect(canStartResearch(state, 'medicine')).toBe(true);
  });

  it('clears the target and all progress on a Lab reset', () => {
    const state = unlockAll(withNodes({ scholar: 1 }));
    state.runEarned.lab = 1e6;
    startResearch(state, 'scientificMethod');
    pour(state, 10);
    resetWorld(state, 'lab');
    expect(state.researching).toBe(null);
    expect(state.researchProgress).toEqual({});
  });
});

describe('mana storage', () => {
  it('caps Mana, and production past the cap is lost and earns nothing', () => {
    const state = unlockAll(withNodes({ manaWell: 10 }));
    const mods = computeModifiers(state);
    expect(resourceCap(mods, 'mana')).toBe(300);
    tick(state, 100); // 4 Mana/s would make 400
    expect(state.resources.mana).toBeCloseTo(300);
    expect(isAtCap(state, computeModifiers(state), 'mana')).toBe(true);
    expect(state.runEarned.arcana).toBeCloseTo(300 * RESOURCES.mana.value);
  });

  it('leaves resources without a cap unlimited', () => {
    expect(resourceCap(computeModifiers(createInitialState()), 'essence')).toBe(Infinity);
  });

  it('grows with Mana Cisterns, then Ley Vaults multiply the total', () => {
    const state = unlockAll(withNodes({ manaCistern: 2, leyVault: 1 }));
    expect(resourceCap(computeModifiers(state), 'mana')).toBeCloseTo((300 + 2 * 250) * 1.5);
  });

  it('flags a cost that is more than can be stored', () => {
    const state = unlockAll(withNodes({ aetherRift: 1 })); // the next Rift costs 1000 Mana
    const mods = computeModifiers(state);
    expect(costOverCap(nodeCost(state, 'aetherRift', mods), mods)).toBe('mana');
    withNodes({ manaCistern: 3 }, state);
    const more = computeModifiers(state);
    expect(costOverCap(nodeCost(state, 'aetherRift', more), more)).toBe(null);
  });

  it('keeps Mana over the cap from an older save, but adds no more', () => {
    const state = unlockAll(withNodes({ manaWell: 5 }));
    state.resources.mana = 1000;
    tick(state, 10);
    expect(state.resources.mana).toBeCloseTo(1000);
  });
});

describe('mining', () => {
  it('keeps the Mine locked until Mining is researched in the Lab', () => {
    const state = withNodes({ quarry: 1 });
    expect(isNodeAvailable(state, 'mine')).toBe(false);
    withNodes({ mining: 1 }, state);
    expect(isNodeAvailable(state, 'mine')).toBe(true);
  });

  it('puts Mining right after Scientific Method, and Geology after Mining', () => {
    expect(NODES.mining.requires).toEqual(['scientificMethod']);
    expect(NODES.geology.requires).toEqual(['mining']);
    expect(isResearchListed(unlockAll(withNodes({ scientificMethod: 1 })), 'mining')).toBe(true);
  });
});

describe('work accidents', () => {
  it('gives every job a small chance per hour of killing each worker, mining the worst', () => {
    const mods = computeModifiers(createInitialState());
    expect(accidentChance(mods, 'farmer')).toBeCloseTo(0.04);
    expect(accidentChance(mods, 'miner')).toBeCloseTo(0.4);
    const state = withJobs({ farmer: 10, woodcutter: 5 });
    expect(accidentRate(state, computeModifiers(state))).toBeCloseTo(10 * 0.04 + 5 * 0.1);
  });

  it('kills a worker when the dice roll under the chance, taking them off their job', () => {
    const state = withJobs({ woodcutter: 3 });
    state.population = 5;
    const rolls = [0, 1, 1]; // the first woodcutter is unlucky
    setAccidentRandom(() => rolls.shift() ?? 1);
    tick(state, 1);
    expect(state.jobs.woodcutter).toBe(2);
    expect(Math.floor(state.population)).toBe(4);
  });

  it('spares the idle, and nobody dies on a lucky roll', () => {
    const state = withJobs({ farmer: 2 });
    state.population = 6;
    setAccidentRandom(() => 0.5);
    tick(state, 10);
    expect(state.jobs.farmer).toBe(2);
    expect(Math.floor(state.population)).toBeGreaterThanOrEqual(6);
  });

  it('is halved by Healing Light, like other deaths', () => {
    const state = unlockAll(withNodes({ healingLight: 1 }));
    state.activeSpells = ['healingLight'];
    expect(accidentChance(computeModifiers(state), 'miner')).toBeCloseTo(0.2);
  });
});

describe('chronicle', () => {
  it('writes a named line for each worker killed at work', () => {
    const state = withJobs({ miner: 2 }, withNodes({ mine: 1, mining: 1 }));
    const rolls = [0, 1];
    setAccidentRandom(() => rolls.shift() ?? 1);
    tick(state, 1);
    expect(state.log).toHaveLength(1);
    expect(state.log[0]!.text).toMatch(/^\S+ \S+ the Miner died when a mine shaft collapsed\.$/);
  });

  it('writes who the demons took', () => {
    const state = unlockAll(withJobs({ woodcutter: 2 }, withNodes({ summoningCircle: 1 })));
    state.population = 5;
    toggleSpell(state, 'summoningCircle');
    state.demons = 600; // 1 death a second
    tick(state, 1);
    expect(state.log.at(-1)!.text).toMatch(/was dragged off by demons\.$/);
  });

  it('keeps only the latest lines', () => {
    const state = withJobs({ farmer: 80 });
    setAccidentRandom(() => 0);
    tick(state, 1);
    expect(state.log).toHaveLength(LOG_LIMIT);
  });
});

describe('realm storage', () => {
  it('caps every Realm resource, and the forest is not cut past the cap', () => {
    const state = withJobs({ woodcutter: 10 });
    expect(resourceCap(computeModifiers(state), 'wood')).toBe(1000);
    expect(resourceCap(computeModifiers(state), 'gold')).toBe(100);
    state.resources.wood = 999;
    tick(state, 10);
    expect(state.resources.wood).toBeCloseTo(1000);
    expect(state.deposits.wood.cut).toBeCloseTo(1); // only what fit was taken from the forest
  });

  it('adds a whole starting capacity of every Realm resource per Warehouse', () => {
    const mods = computeModifiers(withNodes({ warehouse: 2 }));
    expect(resourceCap(mods, 'wood')).toBe(3000);
    expect(resourceCap(mods, 'steel')).toBe(600);
    expect(resourceCap(mods, 'mana')).toBe(300); // Arcana has its own storage
  });

  it('asks for a Warehouse when a cost is more than can be stored', () => {
    const state = withNodes({ hut: 4 }); // the 5th Hut costs 2,560 Wood
    const mods = computeModifiers(state);
    expect(costOverCap(nodeCost(state, 'hut', mods), mods)).toBe('wood');
  });
});
