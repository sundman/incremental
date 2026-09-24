import { describe, expect, it } from 'vitest';
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
  click,
  clickValue,
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
} from '../src/engine/engine';
import { DEPOSITS, NODES, RESOURCES } from '../src/engine/content';
import type { GameState, JobId, NodeId, ResourceId } from '../src/engine/types';

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
    expect(buyNode(state, 'workshop')).toBe(false); // needs Lumber Camp and Quarry first
    state.nodes.lumberCamp = 1;
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

  it('keeps the other worlds out of reach until the Realm has grown', () => {
    const state = createInitialState();
    state.resources.wood = 10_000;
    state.resources.stone = 10_000;
    expect(buyNode(state, 'library')).toBe(false);
    expect(buyNode(state, 'shrine')).toBe(false);
    withNodes({ lumberCamp: 3, quarry: 3, workshop: 1, sawmill: 1, kiln: 1 }, state);
    expect(buildingCount(state, 'realm')).toBe(9);
    expect(isNodeAvailable(state, 'library')).toBe(false);
    state.nodes.lumberCamp = 4;
    expect(isNodeAvailable(state, 'library')).toBe(true);
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
    state.resources.research = 10_000;
    expect(buyNode(state, 'metallurgy')).toBe(false);
    expect(buyNode(state, 'scientificMethod')).toBe(true);
    expect(buyNode(state, 'scientificMethod')).toBe(false); // already being researched
    expect(buyNode(state, 'metallurgy')).toBe(false); // not finished yet
    completeConstruction(state, 'scientificMethod');
    expect(buyNode(state, 'scientificMethod')).toBe(false); // one level only
    expect(buyNode(state, 'metallurgy')).toBe(true);
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

  it('adds click bonuses and world multipliers', () => {
    const state = unlockAll(withNodes({ workshop: 1, enchantedTools: 1 }));
    expect(clickValue(computeModifiers(state), 'wood')).toBeCloseTo((1 + 1) * 1.25);
    expect(click(state, 'wood')).toBeCloseTo(2.5);
    expect(state.resources.wood).toBeCloseTo(2.5);
  });

  it('does not let you click in a locked world', () => {
    const state = createInitialState();
    expect(click(state, 'mana')).toBe(0);
    expect(state.resources.mana).toBe(0);
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
    expect(click(state, 'wood')).toBeCloseTo(0); // nothing left to cut
    expect(state.deposits.wood.cut).toBeCloseTo(state.resources.wood);
  });

  it('runs Stone, Clay and Coal out for good, since they never refill on their own', () => {
    const state = withJobs({ stonecutter: 4 });
    state.deposits.stone.left = 5;
    tick(state, 60);
    expect(state.resources.stone).toBeCloseTo(5);
    expect(click(state, 'stone')).toBe(0);
    expect(DEPOSITS.stone.start).toBeGreaterThan(DEPOSITS.wood.start);
  });

  it('regrows the forest faster with Forester\'s Lodges and Forestry, and slower with pollution', () => {
    const state = unlockAll(withNodes({ foresterLodge: 3, forestry: 1 }));
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo((0.25 + 0.75) * 2);
    state.nodes.coalMine = 5; // 10 pollution
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo(2 / 1.3);
    state.nodes.environmentalScience = 1;
    expect(depositRegrowth(computeModifiers(state), 'wood')).toBeCloseTo(3 / (1 + 0.03 * 8));
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
    const state = withNodes({ hut: 15, farm: 4 }); // 19 of 20 squares
    Object.assign(state.resources, { wood: 1e6, stone: 1e6 });
    expect(land(state)).toBe(20);
    expect(landUsed(state)).toBe(19);
    expect(buyNode(state, 'lumberCamp')).toBe(true); // the 20th square, taken while it is built
    expect(landUsed(state)).toBe(20);
    tick(state, 60);
    expect(buyNode(state, 'quarry')).toBe(false);
  });

  it('finds more land with Cartography and each Expedition, and keeps it through a Lab reset', () => {
    const state = unlockAll(withNodes({ hut: 20, cartography: 1, expedition: 3 }));
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
    for (let i = 0; i < 10; i++) {
      expect(buyNode(state, 'cartography')).toBe(true);
      tick(state, 600);
    }
    expect(state.nodes.cartography).toBe(10);
    expect(nodeCost(state, 'cartography').research).toBe(120 * 2 ** 10);
    expect(buyNode(state, 'cartography')).toBe(false);
    expect(land(state)).toBe(20 + 10);
  });

  it('lets Rationalism be researched 10 times, stacking both its effects', () => {
    const state = unlockAll(withNodes({ scientificMethod: 1, library: 1, rationalism: 9 }));
    state.resources.research = 1e9;
    expect(buyNode(state, 'rationalism')).toBe(true);
    tick(state, 3600);
    expect(state.nodes.rationalism).toBe(10);
    expect(buyNode(state, 'rationalism')).toBe(false);
    const mods = computeModifiers(state);
    expect(mods.get('rate:mana')?.mul).toBeCloseTo(0.8 ** 10);
  });
});

describe('build slots', () => {
  it('builds one thing per world at a time, while other worlds build in parallel', () => {
    const state = unlockAll(withNodes({ hut: 1, library: 1, shrine: 1 }));
    Object.assign(state.resources, { wood: 1000, stone: 1000, research: 1000, mana: 1000 });
    expect(buyNode(state, 'hut')).toBe(true);
    expect(buyNode(state, 'lumberCamp')).toBe(false); // the Realm is busy
    expect(buyNode(state, 'scientificMethod')).toBe(true); // the Lab has its own slot
    expect(buyNode(state, 'manaWell')).toBe(true);
    tick(state, 60);
    expect(buyNode(state, 'lumberCamp')).toBe(true); // the Hut is done
  });

  it('adds a slot per world with each Master Builders level, up to 5', () => {
    const state = unlockAll(withNodes({ hut: 1 }));
    Object.assign(state.resources, { wood: 1e6, stone: 1e6, food: 1e6 });
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

  it('speeds up growth with Wells, Taverns and the Fertility Rite', () => {
    const state = unlockAll(withNodes({ well: 2, tavern: 1, fertilityRite: 1 }));
    state.activeSpells = ['fertilityRite'];
    expect(arrivalRate(computeModifiers(state))).toBeCloseTo((0.05 + 0.02) * 1.1 ** 2 * 1.3);
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
    expect(assignJob(state, 'stonecutter', 1)).toBe(0);
    expect(assignJob(state, 'woodcutter', -1)).toBe(-1);
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
    state.resources.wood = 100;
    expect(buyNode(state, 'hut')).toBe(true);
    expect(state.resources.wood).toBeCloseTo(85); // paid up front
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
    const state = withNodes({ lumberCamp: 6, quarry: 3, workshop: 1 });
    state.resources.wood = 1000;
    state.resources.stone = 1000;
    buyNode(state, 'shrine');
    tick(state, 44);
    expect(isWorldUnlocked(state, 'arcana')).toBe(false);
    tick(state, 1);
    expect(isWorldUnlocked(state, 'arcana')).toBe(true);
  });

  it('drops unfinished construction when its world is reset', () => {
    const state = createInitialState();
    state.resources.wood = 100;
    buyNode(state, 'hut');
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
    const research = state.resources.research;
    tick(state, 10);
    expect(state.resources.food).toBeCloseTo(100 - 5 * 0.2 * 10, 5);
    expect(state.population).toBe(people);
    expect(state.resources.research).toBeGreaterThan(research);

    state.resources.food = 0;
    const stalled = state.resources.research;
    tick(state, 10);
    expect(state.resources.research).toBeCloseTo(stalled, 5);
    expect(activeLinks(state).some((l) => l.source === 'scholar' && l.to === 'realm' && !l.helpful)).toBe(true);
  });

  it('Lab Assistants eat Realm Food too, and stop speeding up the Lab without it', () => {
    const state = unlockAll(withNodes({ labAssistants: 2 }));
    state.resources.food = 100;
    state.population = 3;
    tick(state, 10);
    expect(state.resources.food).toBeCloseTo(100 - 2 * 0.2 * 10, 5);
    expect(computeModifiers(state).get('speed:lab')?.mul).toBeCloseTo(1.21, 5);
    state.resources.food = 0;
    tick(state, 1);
    expect(computeModifiers(state).get('speed:lab')?.mul ?? 1).toBeCloseTo(1, 5);
  });
});
