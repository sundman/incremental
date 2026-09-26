import type {
  AchievementDef,
  Cost,
  Effect,
  AchievementId,
  DepositDef,
  DepositId,
  JobDef,
  JobId,
  MetaDef,
  MetaId,
  NodeDef,
  NodeId,
  ResourceDef,
  ResourceId,
  WorldDef,
  WorldId,
} from './types';

export const WORLDS: Record<WorldId, WorldDef> = {
  realm: {
    id: 'realm',
    name: 'Realm',
    tagline: 'Feed your people, put them to work, and raise buildings.',
    unlockHint: 'Open from the start.',
    startsUnlocked: true,
    headStartNodes: ['hut'],
  },
  arcana: {
    id: 'arcana',
    name: 'Arcana',
    tagline: 'Draw on Mana and discover stranger magic.',
    unlockHint: 'Open the Lab and research Occultism, then build a Shrine in the Realm.',
    startsUnlocked: false,
    headStartNodes: ['manaWell'],
  },
  lab: {
    id: 'lab',
    name: 'Lab',
    tagline: 'Fund scholars and push the tech tree.',
    unlockHint: 'Build a Library in the Realm. It is made of Planks and Bricks, so it needs a Sawmill and a Kiln first.',
    startsUnlocked: false,
    headStartNodes: ['scholar'],
  },
};

export const WORLD_ORDER: WorldId[] = ['realm', 'lab', 'arcana']; // the order they usually open in

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  wood: { id: 'wood', name: 'Wood', world: 'realm', value: 1, baseCap: 1000 },
  stone: { id: 'stone', name: 'Stone', world: 'realm', value: 1.5, baseCap: 1000 },
  food: { id: 'food', name: 'Food', world: 'realm', value: 1, baseCap: 1000 },
  clay: { id: 'clay', name: 'Clay', world: 'realm', value: 2, revealedBy: 'clayPit', baseCap: 500 },
  planks: { id: 'planks', name: 'Planks', world: 'realm', value: 4, revealedBy: 'sawmill', baseCap: 500 },
  bricks: { id: 'bricks', name: 'Bricks', world: 'realm', value: 5, revealedBy: 'kiln', baseCap: 500 },
  iron: { id: 'iron', name: 'Iron', world: 'realm', value: 6, revealedBy: 'mine', baseCap: 300 },
  coal: { id: 'coal', name: 'Coal', world: 'realm', value: 5, revealedBy: 'coalMine', baseCap: 300 },
  steel: { id: 'steel', name: 'Steel', world: 'realm', value: 25, revealedBy: 'blastFurnace', baseCap: 200 },
  glass: { id: 'glass', name: 'Glass', world: 'realm', value: 20, revealedBy: 'glassworks', baseCap: 150 },
  gold: { id: 'gold', name: 'Gold', world: 'realm', value: 60, revealedBy: 'goldMine', baseCap: 100 },
  runestone: { id: 'runestone', name: 'Runestone', world: 'realm', value: 80, revealedBy: 'runesmith', baseCap: 100 },
  // Late-age materials, each made by a building a Lab tech unlocks.
  machineParts: { id: 'machineParts', name: 'Machine Parts', world: 'realm', value: 40, revealedBy: 'machineShop', baseCap: 200 },
  oil: { id: 'oil', name: 'Oil', world: 'realm', value: 30, revealedBy: 'oilWell', baseCap: 500 },
  plastics: { id: 'plastics', name: 'Plastics', world: 'realm', value: 60, revealedBy: 'refinery', baseCap: 300 },
  uranium: { id: 'uranium', name: 'Uranium', world: 'realm', value: 200, revealedBy: 'uraniumMine', baseCap: 100 },
  silicon: { id: 'silicon', name: 'Silicon', world: 'realm', value: 80, revealedBy: 'siliconWorks', baseCap: 300 },
  electronics: { id: 'electronics', name: 'Electronics', world: 'realm', value: 400, revealedBy: 'chipFab', baseCap: 100 },
  mana: { id: 'mana', name: 'Mana', world: 'arcana', value: 1.5, baseCap: 300 },
  essence: { id: 'essence', name: 'Essence', world: 'arcana', value: 15, revealedBy: 'condenser' },
  fireEssence: { id: 'fireEssence', name: 'Fire Essence', world: 'arcana', value: 40, revealedBy: 'fireAltar' },
  lifeEssence: { id: 'lifeEssence', name: 'Life Essence', world: 'arcana', value: 40, revealedBy: 'lifeSpring' },
  shadowEssence: { id: 'shadowEssence', name: 'Shadow Essence', world: 'arcana', value: 60, revealedBy: 'shadowWell' },
  timeEssence: { id: 'timeEssence', name: 'Time Essence', world: 'arcana', value: 150, revealedBy: 'timeLoom' },
  aether: { id: 'aether', name: 'Aether', world: 'arcana', value: 120, revealedBy: 'aetherRift' },
  research: { id: 'research', name: 'Research', world: 'lab', value: 2 },
};

/** Base build time in seconds for each tier; each level already owned adds `BUILD_TIME_GROWTH`. */
export const TIER_SECONDS = { 1: 5, 2: 15, 3: 45, 4: 120, 5: 300, 6: 600 } as const;
export const BUILD_TIME_GROWTH = 1.05;

/** Realm population rules. */
/**
 * Wood, Stone, Clay and Coal are gathered from limited deposits. Only the forest regrows
 * on its own (really slowly); the rest can only be refilled by Arcana's earth magic.
 */
export const DEPOSITS: Record<DepositId, DepositDef> = {
  wood: { name: 'Forest', icon: '🌲', start: 8000, baseRegrow: 0.25, pollutionSlows: true },
  // Everything but the forest starts empty: each Quarry, Clay Pit or mine opens up more (see their size: effects).
  stone: { name: 'Stone quarries', icon: '🪨', start: 0, baseRegrow: 0 },
  clay: { name: 'Clay beds', icon: '🟫', start: 0, baseRegrow: 0 },
  coal: { name: 'Coal seams', icon: '⚫', start: 0, baseRegrow: 0 },
  iron: { name: 'Iron veins', icon: '⛏️', start: 0, baseRegrow: 0 },
  gold: { name: 'Gold seams', icon: '🪙', start: 0, baseRegrow: 0 },
  oil: { name: 'Oil fields', icon: '🛢️', start: 0, baseRegrow: 0 },
  uranium: { name: 'Uranium ore', icon: '☢️', start: 0, baseRegrow: 0 },
};
export const DEPOSIT_ORDER = Object.keys(DEPOSITS) as DepositId[];
/** Share of what was gathered in a run that each Rich Earth level adds to a deposit's size on a Realm reset. */
export const DEPOSIT_GROWTH_PER_LEVEL = 0.01;

export const LAND = {
  /** Squares of land the Realm starts with; every building level takes one. */
  base: 20,
};

export const DEMONS = {
  /** Demons that answer the first summoning. */
  start: 1,
  /** The horde doubles this often, so demons arrive faster and faster. */
  doublingSeconds: 180,
  /** People left alive when the horde has eaten everyone else; then the spell ends. */
  survivors: 2,
};

export const POPULATION = {
  /** People at the start of every Realm run. */
  start: 2,
  /** Housing available before any Huts. */
  baseHousing: 3,
  /** People per second born or arriving while there is free housing, before `growth` modifiers (1 every 20s). */
  baseGrowth: 0.05,
  /** Food eaten to bring in each new person; nobody arrives while the stores are empty. */
  foodPerPerson: 10,
  /** Food each person eats per second. */
  foodPerSecond: 0.1,
  /** Food in the stores at the start of every Realm run, so nobody starves before the first Farmers are out. */
  startFood: 50,
  /** People who starve per second while nobody gets fed, before `starvation` modifiers (1 every 30s). */
  starvationRate: 1 / 30,
  /** Starvation never takes the last few, so the village can always recover. */
  starvationSurvivors: 2,
  /** Growth is divided by `1 + crowdingPenalty * crowding`, so each point of crowding slows it a little more. */
  crowdingPenalty: 0.02,
  /** Growth is also divided by `1 + pollutionPenalty * pollution`. */
  pollutionPenalty: 0.03,
};

// Every job has a small chance of killing its workers. Farming is safest, mining the most dangerous.
const jobList: JobDef[] = [
  {
    id: 'woodcutter',
    name: 'Woodcutters',
    resource: 'wood',
    baseYield: 0.5,
    accidentsPerHour: 0.5,
    accidentText: 'was crushed by a falling tree',
  },
  {
    id: 'stonecutter',
    name: 'Stonecutters',
    resource: 'stone',
    baseYield: 0.4,
    accidentsPerHour: 1,
    accidentText: 'was buried in a rockslide at the quarry',
    requires: ['quarry'],
  },
  {
    id: 'farmer',
    name: 'Farmers',
    resource: 'food',
    baseYield: 0.6,
    accidentsPerHour: 0.2,
    accidentText: 'was kicked by an ox',
  },
  {
    id: 'digger',
    name: 'Diggers',
    resource: 'clay',
    baseYield: 0.3,
    accidentsPerHour: 0.5,
    accidentText: 'drowned when a clay pit flooded',
    requires: ['clayPit'],
  },
  {
    id: 'miner',
    name: 'Miners',
    resource: 'iron',
    baseYield: 0.2,
    accidentsPerHour: 2,
    accidentText: 'died when a mine shaft collapsed',
    requires: ['mine'],
    // 2% per miner with one Mine, 1% more for each Mine after that.
    effects: [{ stat: 'rate:mana', kind: 'mul', amount: 0.98, scaleBy: { node: 'mine', perLevel: 0.5 } }],
  },
  {
    id: 'collier',
    name: 'Colliers',
    resource: 'coal',
    baseYield: 0.25,
    accidentsPerHour: 2,
    accidentText: 'was caught in a firedamp blast',
    requires: ['coalMine'],
    effects: [{ stat: 'rate:essence', kind: 'mul', amount: 0.99 }],
  },
  {
    id: 'prospector',
    name: 'Prospectors',
    resource: 'gold',
    baseYield: 0.05,
    accidentsPerHour: 1,
    accidentText: 'fell into a ravine while prospecting',
    requires: ['goldMine'],
    effects: [{ stat: 'rate:research', kind: 'mul', amount: 0.99 }],
  },
  {
    id: 'driller',
    name: 'Drillers',
    resource: 'oil',
    baseYield: 0.2,
    accidentsPerHour: 1.5,
    accidentText: 'was killed in a blowout at the oil well',
    requires: ['oilWell'],
  },
  {
    id: 'uraniumMiner',
    name: 'Uranium Miners',
    resource: 'uranium',
    baseYield: 0.02,
    accidentsPerHour: 4,
    accidentText: 'died of radiation sickness',
    requires: ['uraniumMine'],
  },
];

export const JOBS = Object.fromEntries(jobList.map((j) => [j.id, j])) as Record<JobId, JobDef>;
export const JOB_ORDER: JobId[] = jobList.map((j) => j.id);

export const RESOURCE_ORDER = Object.keys(RESOURCES) as ResourceId[];

/** The Lab's ages, in order: research is split into them, and each must be finished to open the next. */
export const AGES = [
  'Foundations',
  'Classical',
  'Medieval',
  'Renaissance',
  'Industrial',
  'Electric',
  'Atomic',
  'Information',
  'Current Age',
] as const;

/**
 * Research cost of a tech: 100 × 10^(age − 1) × 1.25^step, rounded to two significant digits.
 * Each age starts at 10 times the one before; `step` is the tech's place within its age.
 */
export function ageCost(age: number, step: number): number {
  const raw = 100 * 10 ** (age - 1) * 1.25 ** step;
  const unit = 10 ** (Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / unit) * unit;
}

/** A Lab tech of an age. Materials (Planks, Glass...) are paid once, when it is first started. */
function tech(
  age: number,
  step: number,
  id: NodeId,
  name: string,
  description: string,
  materials: Cost,
  requires: NodeId[],
  effects: Effect[],
  extra: Partial<NodeDef> = {},
): NodeDef {
  return {
    id,
    world: 'lab',
    kind: 'tech',
    name,
    description,
    baseCost: { research: ageCost(age, step), ...materials },
    costGrowth: 1,
    tier: 1,
    age,
    ...(requires.length ? { requires } : {}),
    effects,
    ...extra,
  };
}

const nodeList: NodeDef[] = [
  // ---------------------------------------------------------------- Realm
  // Basics: housing and raw materials.
  {
    id: 'hut',
    world: 'realm',
    kind: 'building',
    name: 'Hut',
    description: 'Room for more people to move in, though every home crowds the village a little.',
    baseCost: { wood: 10, food: 10 },
    costGrowth: 4,
    tier: 1,
    effects: [
      { stat: 'housing', kind: 'add', amount: 2 },
      { stat: 'crowding', kind: 'add', amount: 1 },
    ],
  },
  {
    id: 'warehouse',
    world: 'realm',
    kind: 'building',
    name: 'Warehouse',
    description:
      'Stores as much again of every Realm resource as you start with. Each one needs finer materials than the last, and goods kept here slowly spoil, faster the more Warehouses you have. Needs Warehousing.',
    // Each Warehouse needs finer materials than the last, and fits within the storage the ones before it give.
    baseCost: { wood: 600, stone: 600 },
    levelCosts: [
      { wood: 1500, stone: 1000, planks: 400 },
      { planks: 1200, bricks: 800 },
      { bricks: 1500, iron: 600, glass: 400 },
      { steel: 900, glass: 600 },
      { steel: 1200, glass: 800, gold: 300 },
      { steel: 1300, gold: 400, runestone: 500 },
    ],
    costGrowth: 1.1,
    tier: 3,
    requires: ['warehousing'],
    effects: [
      { stat: 'storage:realm', kind: 'add', amount: 1 },
      { stat: 'decay:realm', kind: 'add', amount: 0.0002 },
    ],
  },
  // Late-age industry: each is unlocked by a Lab tech of the age that first needs its product.
  {
    id: 'machineShop',
    world: 'realm',
    kind: 'building',
    name: 'Machine Shop',
    description: 'Turns Steel and Coal into Machine Parts. Needs Precision Tools from the Lab.',
    baseCost: { steel: 150, bricks: 300 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['blastFurnace', 'precisionTools'],
    upkeep: { steel: 1, coal: 0.2 },
    effects: [{ stat: 'rate:machineParts', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'oilWell',
    world: 'realm',
    kind: 'building',
    name: 'Oil Well',
    description:
      'Opens the Driller job. Each Oil Well opens up 10,000 Oil and makes drillers faster, but clears 400 Wood of forest. Needs Combustion Engine from the Lab.',
    baseCost: { steel: 200, machineParts: 50 },
    costGrowth: 1.5,
    tier: 4,
    requires: ['combustionEngine'],
    effects: [
      { stat: 'yield:oil', kind: 'add', amount: 0.05 },
      { stat: 'size:oil', kind: 'add', amount: 10000 },
      { stat: 'size:wood', kind: 'add', amount: -400 },
    ],
  },
  {
    id: 'refinery',
    world: 'realm',
    kind: 'building',
    name: 'Refinery',
    description: 'Cracks Oil into Plastics, with a lot of smoke. Needs Polymers from the Lab.',
    baseCost: { steel: 300, machineParts: 100 },
    costGrowth: 1.5,
    tier: 5,
    requires: ['oilWell', 'polymers'],
    upkeep: { oil: 2 },
    effects: [
      { stat: 'rate:plastics', kind: 'add', amount: 0.2 },
      { stat: 'pollution', kind: 'add', amount: 3 },
    ],
  },
  {
    id: 'uraniumMine',
    world: 'realm',
    kind: 'building',
    name: 'Uranium Mine',
    description:
      'Opens the Uranium Miner job, the most dangerous work in the Realm. Each mine opens up 1,000 Uranium but clears 400 Wood of forest. Needs Radioactivity from the Lab.',
    baseCost: { steel: 500, machineParts: 200 },
    costGrowth: 1.6,
    tier: 5,
    requires: ['radioactivity'],
    effects: [
      { stat: 'yield:uranium', kind: 'add', amount: 0.01 },
      { stat: 'size:uranium', kind: 'add', amount: 1000 },
      { stat: 'size:wood', kind: 'add', amount: -400 },
    ],
  },
  {
    id: 'siliconWorks',
    world: 'realm',
    kind: 'building',
    name: 'Silicon Works',
    description: 'Refines Stone into Silicon over a coal fire. Needs Semiconductors from the Lab.',
    baseCost: { steel: 500, plastics: 100 },
    costGrowth: 1.5,
    tier: 5,
    requires: ['semiconductors'],
    upkeep: { stone: 2, coal: 0.3 },
    effects: [
      { stat: 'rate:silicon', kind: 'add', amount: 0.1 },
      { stat: 'pollution', kind: 'add', amount: 2 },
    ],
  },
  {
    id: 'chipFab',
    world: 'realm',
    kind: 'building',
    name: 'Chip Fab',
    description: 'Builds Electronics from Silicon, Plastics and Gold. Needs Transistors from the Lab.',
    baseCost: { steel: 800, plastics: 200, silicon: 100 },
    costGrowth: 1.6,
    tier: 6,
    requires: ['siliconWorks', 'refinery', 'transistors'],
    upkeep: { silicon: 0.5, plastics: 0.1, gold: 0.05 },
    effects: [{ stat: 'rate:electronics', kind: 'add', amount: 0.05 }],
  },
  {
    id: 'farm',
    world: 'realm',
    kind: 'building',
    name: 'Farm',
    description: 'Fields for your farmers. New people need Food to move in. Needs Agriculture from the Lab.',
    baseCost: { wood: 20 },
    costGrowth: 1.3,
    tier: 1,
    requires: ['agriculture'],
    effects: [{ stat: 'yield:food', kind: 'add', amount: 0.3 }],
  },
  {
    id: 'lumberCamp',
    world: 'realm',
    kind: 'building',
    name: 'Lumber Camp',
    description: 'Iron saws and sledges for your woodcutters. Needs Forestry from the Lab.',
    baseCost: { wood: 25, iron: 10 },
    costGrowth: 1.3,
    tier: 1,
    requires: ['forestry'],
    effects: [{ stat: 'yield:wood', kind: 'add', amount: 0.2 }],
  },
  {
    id: 'foresterLodge',
    world: 'realm',
    kind: 'building',
    name: 'Forester\'s Lodge',
    description: 'Foresters plant new trees, so the forest regrows faster.',
    baseCost: { wood: 50, stone: 30 },
    costGrowth: 1.5,
    tier: 2,
    maxLevel: 10,
    requires: ['lumberCamp'],
    effects: [{ stat: 'regrow:wood', kind: 'add', amount: 0.25 }],
  },
  {
    id: 'quarry',
    world: 'realm',
    kind: 'building',
    name: 'Quarry',
    description:
      'Opens the Stonecutter job. Each Quarry opens up 5,000 Stone to cut and makes stonecutters faster, but clears woodland: the forest holds 500 less Wood.',
    baseCost: { wood: 35 },
    costGrowth: 1.8,
    tier: 1,
    effects: [
      { stat: 'yield:stone', kind: 'add', amount: 0.15 },
      { stat: 'size:stone', kind: 'add', amount: 5000 },
      { stat: 'size:wood', kind: 'add', amount: -500 },
    ],
  },
  {
    id: 'clayPit',
    world: 'realm',
    kind: 'building',
    name: 'Clay Pit',
    description:
      'Opens the Digger job. Each pit opens up 3,000 Clay to dig and makes diggers faster, but the digging clears woodland: the forest holds 300 less Wood.',
    baseCost: { wood: 40, stone: 20 },
    costGrowth: 1.8,
    tier: 2,
    requires: ['quarry'],
    effects: [
      { stat: 'yield:clay', kind: 'add', amount: 0.1 },
      { stat: 'size:clay', kind: 'add', amount: 3000 },
      { stat: 'size:wood', kind: 'add', amount: -300 },
    ],
  },
  {
    id: 'workshop',
    world: 'realm',
    kind: 'building',
    name: 'Workshop',
    description: 'Better tools for every worker. Faster work is riskier work: the woodcutters, stonecutters, diggers and miners they speed up also have more accidents.',
    baseCost: { wood: 40, stone: 25 },
    costGrowth: 2.5,
    tier: 2,
    maxLevel: 10,
    requires: ['quarry'],
    effects: [
      { stat: 'rate:wood', kind: 'mul', amount: 1.15 },
      { stat: 'rate:stone', kind: 'mul', amount: 1.15 },
      { stat: 'rate:clay', kind: 'mul', amount: 1.15 },
      { stat: 'rate:iron', kind: 'mul', amount: 1.15 },
      { stat: 'risk:wood', kind: 'mul', amount: 1.1 },
      { stat: 'risk:stone', kind: 'mul', amount: 1.1 },
      { stat: 'risk:clay', kind: 'mul', amount: 1.1 },
      { stat: 'risk:iron', kind: 'mul', amount: 1.1 },
    ],
  },

  // Crafting: turning raw materials into better ones.
  {
    id: 'sawmill',
    world: 'realm',
    kind: 'building',
    name: 'Sawmill',
    description: 'Cuts Wood into Planks.',
    baseCost: { wood: 80, stone: 30 },
    costGrowth: 1.35,
    tier: 2,
    requires: ['workshop'],
    upkeep: { wood: 1 },
    effects: [{ stat: 'rate:planks', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'kiln',
    world: 'realm',
    kind: 'building',
    name: 'Kiln',
    description: 'Fires Clay into Bricks, burning Wood. The smoke slows growth a little.',
    baseCost: { stone: 120, planks: 15 },
    costGrowth: 1.35,
    tier: 2,
    requires: ['clayPit', 'sawmill'],
    upkeep: { clay: 1, wood: 0.5 },
    effects: [{ stat: 'rate:bricks', kind: 'add', amount: 0.1 }, { stat: 'pollution', kind: 'add', amount: 1 }],
  },
  {
    id: 'house',
    world: 'realm',
    kind: 'building',
    name: 'House',
    description: 'Proper homes with room for a family. Packing people in slows growth. Needs Housing from the Lab.',
    baseCost: { planks: 30, bricks: 20 },
    costGrowth: 1.35,
    tier: 3,
    requires: ['sawmill', 'kiln', 'homebuilding'],
    effects: [
      { stat: 'housing', kind: 'add', amount: 5 },
      { stat: 'crowding', kind: 'add', amount: 2 },
    ],
  },
  {
    id: 'mine',
    world: 'realm',
    kind: 'building',
    name: 'Mine',
    description:
      'Opens the Miner job. Each Mine opens up 3,000 Iron and makes miners dig faster, but clears 400 Wood of forest. Miners disturb the ley lines, and every Mine after the first makes each miner disturb them more. Needs Mining from the Lab.',
    baseCost: { wood: 60, stone: 80 },
    costGrowth: 1.35,
    tier: 2,
    requires: ['quarry', 'mining'],
    effects: [
      { stat: 'yield:iron', kind: 'add', amount: 0.05 },
      { stat: 'size:iron', kind: 'add', amount: 3000 },
      { stat: 'size:wood', kind: 'add', amount: -400 },
    ],
  },
  {
    id: 'coalMine',
    world: 'realm',
    kind: 'building',
    name: 'Coal Mine',
    description:
      'Opens the Collier job. Each Coal Mine opens up 4,000 Coal but clears 400 Wood of forest. Coal soot drifts into the magic and chokes the town.',
    baseCost: { planks: 60, stone: 100 },
    costGrowth: 1.35,
    tier: 3,
    requires: ['mine', 'sawmill'],
    effects: [
      { stat: 'yield:coal', kind: 'add', amount: 0.05 },
      { stat: 'pollution', kind: 'add', amount: 2 },
      { stat: 'size:coal', kind: 'add', amount: 4000 },
      { stat: 'size:wood', kind: 'add', amount: -400 },
    ],
  },
  {
    id: 'foundry',
    world: 'realm',
    kind: 'building',
    name: 'Foundry',
    description: 'Iron machinery speeds up the whole Realm, belching smoke.',
    baseCost: { bricks: 150, iron: 40 },
    costGrowth: 3,
    tier: 4,
    maxLevel: 10,
    requires: ['mine', 'kiln'],
    effects: [{ stat: 'prod:realm', kind: 'mul', amount: 1.2 }, { stat: 'pollution', kind: 'add', amount: 2 }],
  },
  {
    id: 'market',
    world: 'realm',
    kind: 'building',
    name: 'Market',
    description: 'Traders make every Realm building cheaper. Needs Currency from the Lab.',
    baseCost: { planks: 100, bricks: 60 },
    costGrowth: 1.8,
    tier: 3,
    maxLevel: 5,
    requires: ['house', 'currency'],
    effects: [{ stat: 'cost:realm', kind: 'mul', amount: 0.95 }],
  },

  {
    id: 'buildersGuild',
    world: 'realm',
    kind: 'building',
    name: "Builders' Guild",
    description: 'Master builders speed up every Realm construction.',
    baseCost: { planks: 60, bricks: 40 },
    costGrowth: 1.6,
    tier: 3,
    maxLevel: 10,
    requires: ['sawmill', 'kiln'],
    effects: [{ stat: 'speed:realm', kind: 'mul', amount: 1.15 }],
  },

  // Population growth.
  {
    id: 'well',
    world: 'realm',
    kind: 'building',
    name: 'Well',
    description: 'Clean water keeps families healthy: the population grows faster, fewer workers die, and the hungry last longer.',
    baseCost: { stone: 30, wood: 10 },
    costGrowth: 1.8,
    tier: 1,
    maxLevel: 5,
    requires: ['hut'],
    effects: [
      { stat: 'growth', kind: 'mul', amount: 1.1 },
      { stat: 'accidents', kind: 'mul', amount: 0.97 },
      { stat: 'starvation', kind: 'mul', amount: 0.8 },
    ],
  },
  {
    id: 'park',
    world: 'realm',
    kind: 'building',
    name: 'Park',
    description: 'Trees and green lawns clean the air, so pollution slows growth less. Needs Environmental Science from the Lab.',
    baseCost: { wood: 60, stone: 40, food: 40 },
    costGrowth: 1.6,
    tier: 2,
    maxLevel: 5,
    requires: ['well', 'environmentalScience'],
    effects: [{ stat: 'pollution', kind: 'mul', amount: 0.9 }],
  },
  {
    id: 'tavern',
    world: 'realm',
    kind: 'building',
    name: 'Tavern',
    description: 'Word spreads about a good place to live, and settlers come. The regulars are bad at paying, so the Tavern costs Gold to keep open.',
    baseCost: { planks: 40, food: 100 },
    costGrowth: 1.5,
    tier: 3,
    requires: ['house'],
    upkeep: { gold: 0.02 },
    effects: [{ stat: 'growth', kind: 'add', amount: 0.02 }],
  },

  // Gateways to the other worlds.
  {
    id: 'library',
    world: 'realm',
    kind: 'building',
    name: 'Library',
    description:
      'A place to study, built from Planks and Bricks. The first one opens the Lab. The Research each Library adds is kept for good: Libraries go with a Realm reset, but building them again adds more.',
    baseCost: { planks: 60, bricks: 40 },
    costGrowth: 1.6,
    tier: 3,
    requires: ['sawmill', 'kiln'],
    unlocksWorld: 'lab',
    lasting: true,
    effects: [{ stat: 'rate:research', kind: 'add', amount: 0.5 }],
  },
  {
    id: 'shrine',
    world: 'realm',
    kind: 'building',
    name: 'Shrine',
    description: 'A quiet stone circle. The first one opens Arcana. Needs Occultism from the Lab.',
    baseCost: { wood: 120, stone: 150 },
    costGrowth: 1.3,
    tier: 3,
    requires: ['workshop', 'occultism'],
    unlocksWorld: 'arcana',
    effects: [{ stat: 'rate:mana', kind: 'add', amount: 0.3 }],
  },

  // Buildings that need science.
  {
    id: 'irrigation',
    world: 'realm',
    kind: 'building',
    name: 'Irrigation',
    description: 'Channels water to the fields. Needs Engineering from the Lab.',
    baseCost: { planks: 50, stone: 80 },
    costGrowth: 1.35,
    tier: 4,
    requires: ['farm', 'engineering'],
    effects: [{ stat: 'yield:food', kind: 'add', amount: 0.4 }],
  },
  {
    id: 'aqueduct',
    world: 'realm',
    kind: 'building',
    name: 'Aqueduct',
    description: 'Fresh water for a crowded town, so crowding slows growth less. Needs Aqueducts from the Lab.',
    baseCost: { stone: 150, bricks: 60 },
    costGrowth: 1.6,
    tier: 4,
    maxLevel: 5,
    requires: ['well', 'aqueducts'],
    effects: [{ stat: 'crowding', kind: 'mul', amount: 0.85 }],
  },
  {
    id: 'blastFurnace',
    world: 'realm',
    kind: 'building',
    name: 'Blast Furnace',
    description: 'Smelts Iron and Coal into Steel. Needs Metallurgy from the Lab.',
    baseCost: { bricks: 200, iron: 100 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['coalMine', 'metallurgy'],
    upkeep: { iron: 2.5, coal: 0.5 },
    effects: [{ stat: 'rate:steel', kind: 'add', amount: 0.25 }, { stat: 'pollution', kind: 'add', amount: 3 }],
  },
  {
    id: 'glassworks',
    world: 'realm',
    kind: 'building',
    name: 'Glassworks',
    description: 'Melts Stone into Glass over a coal fire. Needs Optics from the Lab.',
    baseCost: { bricks: 150, coal: 50 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['kiln', 'coalMine', 'optics'],
    upkeep: { stone: 2, coal: 0.3 },
    effects: [{ stat: 'rate:glass', kind: 'add', amount: 0.2 }, { stat: 'pollution', kind: 'add', amount: 2 }],
  },
  {
    id: 'goldMine',
    world: 'realm',
    kind: 'building',
    name: 'Gold Mine',
    description:
      'Opens the Prospector job. Each Gold Mine opens up 500 Gold but clears 400 Wood of forest. Scholars run off to join the gold rush. Needs Geology from the Lab.',
    baseCost: { stone: 300, planks: 150 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['mine', 'geology'],
    effects: [
      { stat: 'yield:gold', kind: 'add', amount: 0.02 },
      { stat: 'size:gold', kind: 'add', amount: 500 },
      { stat: 'size:wood', kind: 'add', amount: -400 },
    ],
  },
  {
    id: 'printingPress',
    world: 'realm',
    kind: 'building',
    name: 'Printing Press',
    description: 'Books for every scholar, and printed doubt for every believer: it drains almost as much Mana as it adds Research. Needs Printing from the Lab.',
    baseCost: { planks: 150, steel: 30 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['printing'],
    effects: [
      { stat: 'rate:research', kind: 'add', amount: 1 },
      { stat: 'rate:mana', kind: 'add', amount: -0.9 },
    ],
  },
  {
    id: 'church',
    world: 'realm',
    kind: 'building',
    name: 'Church',
    description: 'Stained glass and sermons: the opposite of a Printing Press. Faith feeds Mana, and doctrine holds back Research.',
    baseCost: { bricks: 120, glass: 40 },
    costGrowth: 1.4,
    tier: 4,
    requires: ['shrine'],
    effects: [
      { stat: 'rate:mana', kind: 'add', amount: 1 },
      { stat: 'rate:research', kind: 'add', amount: -0.9 },
    ],
  },
  {
    id: 'observatory',
    world: 'realm',
    kind: 'building',
    name: 'Observatory',
    description: 'Lenses on the sky help both scientists and mages. Needs Optics from the Lab.',
    baseCost: { glass: 40, bricks: 100 },
    costGrowth: 1.5,
    tier: 5,
    maxLevel: 10,
    requires: ['optics'],
    effects: [
      { stat: 'rate:research', kind: 'add', amount: 1.5 },
      { stat: 'rate:aether', kind: 'mul', amount: 1.05 },
    ],
  },
  {
    id: 'university',
    world: 'realm',
    kind: 'building',
    name: 'University',
    description: 'Science flourishes. Educated skeptics weaken magic. Needs Universities from the Lab.',
    baseCost: { bricks: 300, glass: 50, gold: 20 },
    costGrowth: 1.6,
    tier: 5,
    maxLevel: 10,
    requires: ['library', 'universities'],
    effects: [
      { stat: 'prod:lab', kind: 'mul', amount: 1.15 },
      { stat: 'rate:mana', kind: 'mul', amount: 0.95 },
    ],
  },

  // Buildings that need magic.
  {
    id: 'cathedral',
    world: 'realm',
    kind: 'building',
    name: 'Cathedral',
    description: 'Glass and gold raised to the heavens. Faith feeds magic, and dogma slows research.',
    baseCost: { bricks: 400, glass: 80, gold: 40 },
    costGrowth: 1.8,
    tier: 6,
    maxLevel: 5,
    requires: ['shrine', 'glassworks'],
    effects: [
      { stat: 'prod:arcana', kind: 'mul', amount: 1.2 },
      { stat: 'rate:research', kind: 'mul', amount: 0.95 },
    ],
  },
  {
    id: 'runesmith',
    world: 'realm',
    kind: 'building',
    name: 'Runesmith',
    description: 'Carves Essence into Stone to make Runestone. Needs Rune Lore from Arcana.',
    baseCost: { stone: 200, planks: 100 },
    costGrowth: 1.4,
    tier: 5,
    requires: ['runeLore'],
    upkeep: { stone: 1, essence: 0.1 },
    effects: [{ stat: 'rate:runestone', kind: 'add', amount: 0.05 }],
  },
  {
    id: 'leyAnchor',
    world: 'realm',
    kind: 'building',
    name: 'Ley Anchor',
    description: 'Runestones that calm the ley lines your mines disturb. Needs Rune Lore from Arcana.',
    baseCost: { runestone: 30, bricks: 100 },
    costGrowth: 2,
    tier: 5,
    maxLevel: 5,
    requires: ['runesmith'],
    effects: [{ stat: 'rate:mana', kind: 'mul', amount: 1.1 }],
  },
  {
    id: 'golemWorks',
    world: 'realm',
    kind: 'building',
    name: 'Golem Works',
    description:
      'Steel golems with rune hearts do the heavy lifting, and they draw on Mana. Needs Animation from Arcana and Steam Power from the Lab.',
    baseCost: { steel: 200, runestone: 50 },
    costGrowth: 1.8,
    tier: 6,
    maxLevel: 10,
    requires: ['blastFurnace', 'runesmith', 'animation', 'steamPower'],
    effects: [
      { stat: 'prod:realm', kind: 'mul', amount: 1.15 },
      { stat: 'speed:realm', kind: 'mul', amount: 1.1 },
      { stat: 'rate:mana', kind: 'mul', amount: 0.93 },
    ],
  },

  // --------------------------------------------------------------- Arcana
  {
    id: 'manaWell',
    world: 'arcana',
    kind: 'building',
    name: 'Mana Well',
    description: 'Draws Mana up from below.',
    baseCost: { mana: 10 },
    costGrowth: 1.15,
    tier: 1,
    effects: [{ stat: 'rate:mana', kind: 'add', amount: 0.4 }],
  },
  {
    id: 'manaCistern',
    world: 'arcana',
    kind: 'building',
    name: 'Mana Cistern',
    description: 'A stone basin that holds Mana instead of letting it seep away.',
    baseCost: { mana: 60 },
    costGrowth: 1.3,
    tier: 2,
    requires: ['manaWell'],
    effects: [{ stat: 'cap:mana', kind: 'add', amount: 250 }],
  },
  {
    id: 'leyVault',
    world: 'arcana',
    kind: 'building',
    name: 'Ley Vault',
    description: 'Folds space around the stored Mana, so every basin holds far more.',
    baseCost: { mana: 250, essence: 40 },
    costGrowth: 2.5,
    tier: 3,
    maxLevel: 5,
    requires: ['manaCistern', 'condenser'],
    effects: [{ stat: 'cap:mana', kind: 'mul', amount: 1.5 }],
  },
  {
    id: 'condenser',
    world: 'arcana',
    kind: 'building',
    name: 'Condenser',
    description: 'Presses Mana into Essence. Burns 1 Mana/s each.',
    baseCost: { mana: 50 },
    costGrowth: 1.2,
    tier: 2,
    requires: ['manaWell'],
    upkeep: { mana: 1 },
    effects: [{ stat: 'rate:essence', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'focusCrystal',
    world: 'arcana',
    kind: 'building',
    name: 'Focus Crystal',
    description: 'Focuses the flow of Mana.',
    baseCost: { mana: 100, essence: 10 },
    costGrowth: 2.5,
    tier: 3,
    maxLevel: 10,
    requires: ['condenser'],
    effects: [{ stat: 'rate:mana', kind: 'mul', amount: 1.25 }],
  },
  {
    id: 'enchantedTools',
    world: 'arcana',
    kind: 'building',
    name: 'Enchanted Tools',
    description: 'Tools that work a little by themselves.',
    baseCost: { essence: 25 },
    costGrowth: 3,
    tier: 3,
    maxLevel: 5,
    requires: ['condenser'],
    effects: [{ stat: 'prod:realm', kind: 'mul', amount: 1.25 }],
  },
  {
    id: 'aetherRift',
    world: 'arcana',
    kind: 'building',
    name: 'Aether Rift',
    description: 'Tears reality open to let Aether through. Feeds on 0.5 Essence/s each, and the tear confuses instruments.',
    baseCost: { mana: 500, essence: 100 },
    costGrowth: 2,
    tier: 4,
    requires: ['condenser'],
    upkeep: { essence: 0.5 },
    effects: [
      { stat: 'rate:aether', kind: 'add', amount: 0.05 },
      { stat: 'rate:research', kind: 'mul', amount: 0.85 },
    ],
  },
  {
    id: 'aetherLens',
    world: 'arcana',
    kind: 'building',
    name: 'Aether Lens',
    description: 'Aether bends every spell into something stronger.',
    baseCost: { aether: 5 },
    costGrowth: 3,
    tier: 5,
    maxLevel: 5,
    requires: ['aetherRift'],
    effects: [{ stat: 'prod:arcana', kind: 'mul', amount: 1.5 }],
  },

  {
    id: 'summoningCircle',
    world: 'arcana',
    kind: 'tech',
    name: 'Summon Demons',
    description:
      'Spell with no way back: once cast it cannot be switched off. The horde doubles every 3 minutes, ' +
      'pouring power into Arcana while it eats the Realm\'s people. It only ends when 2 survivors are left.',
    baseCost: { mana: 300, essence: 30 },
    costGrowth: 1,
    tier: 3,
    requires: ['condenser'],
    spell: true,
    horde: true,
    effects: [
      { stat: 'prod:arcana', kind: 'mul', amount: 1.2, linear: true },
      { stat: 'deaths', kind: 'add', amount: 6 },
    ],
  },

  // Discoveries: one-time unlocks that Realm buildings can depend on.
  {
    id: 'fertilityRite',
    world: 'arcana',
    kind: 'tech',
    name: 'Fertility Rite',
    description: 'Spell: while it is on, the Realm\'s families grow faster.',
    baseCost: { mana: 150 },
    costGrowth: 1,
    tier: 2,
    requires: ['manaWell'],
    spell: true,
    upkeep: { mana: 1 },
    effects: [{ stat: 'growth', kind: 'mul', amount: 1.3 }],
  },
  {
    id: 'haste',
    world: 'arcana',
    kind: 'tech',
    name: 'Haste',
    description: 'Spell: while it is on, every builder in every world works faster.',
    baseCost: { mana: 400, essence: 40 },
    costGrowth: 1,
    tier: 3,
    requires: ['condenser'],
    spell: true,
    upkeep: { mana: 2, essence: 0.1 },
    effects: [
      { stat: 'speed:arcana', kind: 'mul', amount: 1.2 },
      { stat: 'speed:realm', kind: 'mul', amount: 1.2 },
      { stat: 'speed:lab', kind: 'mul', amount: 1.2 },
    ],
  },
  {
    id: 'runeLore',
    world: 'arcana',
    kind: 'tech',
    name: 'Rune Lore',
    description: 'How to bind Essence into stone. Lets the Realm build a Runesmith.',
    baseCost: { mana: 200, essence: 20 },
    costGrowth: 1,
    tier: 3,
    requires: ['condenser'],
    effects: [{ stat: 'rate:essence', kind: 'mul', amount: 1.1 }],
  },
  {
    id: 'geomancy',
    world: 'arcana',
    kind: 'tech',
    name: 'Geomancy',
    description: 'The magic of stone and soil. Lets you learn Earthsong.',
    baseCost: { mana: 400, essence: 60 },
    costGrowth: 1,
    tier: 3,
    requires: ['runeLore'],
    effects: [],
  },
  {
    id: 'animation',
    world: 'arcana',
    kind: 'tech',
    name: 'Animation',
    description: 'Spell: while it is on, Arcana itself stirs to work. Learning it lets the Realm build Golem Works.',
    baseCost: { essence: 100, aether: 20 },
    costGrowth: 1,
    tier: 5,
    requires: ['runeLore', 'aetherRift'],
    spell: true,
    upkeep: { essence: 1 },
    effects: [{ stat: 'prod:arcana', kind: 'mul', amount: 1.2 }],
  },

  // Essence schools: a discovery opens a new essence, a building distills it from
  // plain Essence, and that essence powers the school's spells.
  {
    id: 'pyromancy',
    world: 'arcana',
    kind: 'tech',
    name: 'Pyromancy',
    description: 'The study of fire. Lets you build a Fire Altar to make Fire Essence.',
    baseCost: { essence: 60, mana: 200 },
    costGrowth: 1,
    tier: 3,
    requires: ['condenser'],
    effects: [],
  },
  {
    id: 'fireAltar',
    world: 'arcana',
    kind: 'building',
    name: 'Fire Altar',
    description: 'Distills Essence into Fire Essence.',
    baseCost: { mana: 400, essence: 40 },
    costGrowth: 1.4,
    tier: 3,
    requires: ['pyromancy'],
    upkeep: { essence: 1 },
    effects: [{ stat: 'rate:fireEssence', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'earthsong',
    world: 'arcana',
    kind: 'tech',
    name: 'Earthsong',
    description: 'Spell: sings stone and clay back into the Realm\'s quarries and clay beds.',
    baseCost: { essence: 80 },
    costGrowth: 1,
    tier: 3,
    requires: ['geomancy'],
    spell: true,
    upkeep: { essence: 0.5 },
    effects: [
      { stat: 'regrow:stone', kind: 'add', amount: 3 },
      { stat: 'regrow:clay', kind: 'add', amount: 2 },
    ],
  },
  {
    id: 'forgeFire',
    world: 'arcana',
    kind: 'tech',
    name: 'Forge Fire',
    description: 'Spell: magical flames in the Realm\'s furnaces and kilns.',
    baseCost: { fireEssence: 20 },
    costGrowth: 1,
    tier: 3,
    requires: ['fireAltar'],
    spell: true,
    upkeep: { fireEssence: 0.1 },
    effects: [
      { stat: 'rate:steel', kind: 'mul', amount: 1.5 },
      { stat: 'rate:bricks', kind: 'mul', amount: 1.3 },
      { stat: 'rate:glass', kind: 'mul', amount: 1.3 },
    ],
  },
  {
    id: 'vitalism',
    world: 'arcana',
    kind: 'tech',
    name: 'Vitalism',
    description: 'The study of life. Lets you build a Life Spring to make Life Essence.',
    baseCost: { essence: 60, mana: 200 },
    costGrowth: 1,
    tier: 3,
    requires: ['condenser'],
    effects: [],
  },
  {
    id: 'lifeSpring',
    world: 'arcana',
    kind: 'building',
    name: 'Life Spring',
    description: 'Distills Essence into Life Essence.',
    baseCost: { mana: 300, essence: 40 },
    costGrowth: 1.4,
    tier: 3,
    requires: ['vitalism'],
    upkeep: { essence: 1 },
    effects: [{ stat: 'rate:lifeEssence', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'bountifulHarvest',
    world: 'arcana',
    kind: 'tech',
    name: 'Bountiful Harvest',
    description: 'Spell: the Realm\'s fields yield far more.',
    baseCost: { lifeEssence: 15 },
    costGrowth: 1,
    tier: 3,
    requires: ['lifeSpring'],
    spell: true,
    upkeep: { lifeEssence: 0.1 },
    effects: [{ stat: 'rate:food', kind: 'mul', amount: 1.5 }],
  },
  {
    id: 'healingLight',
    world: 'arcana',
    kind: 'tech',
    name: 'Healing Light',
    description: 'Spell: halves deaths in the Realm (even from demons) and helps families grow.',
    baseCost: { lifeEssence: 40 },
    costGrowth: 1,
    tier: 4,
    requires: ['lifeSpring'],
    spell: true,
    upkeep: { lifeEssence: 0.2 },
    effects: [
      { stat: 'deaths', kind: 'mul', amount: 0.5 },
      { stat: 'growth', kind: 'mul', amount: 1.2 },
    ],
  },
  {
    id: 'umbramancy',
    world: 'arcana',
    kind: 'tech',
    name: 'Umbramancy',
    description: 'What the demons taught you. Lets you build a Shadow Well to make Shadow Essence.',
    baseCost: { essence: 150 },
    costGrowth: 1,
    tier: 4,
    requires: ['summoningCircle'],
    effects: [],
  },
  {
    id: 'shadowWell',
    world: 'arcana',
    kind: 'building',
    name: 'Shadow Well',
    description: 'Distills Essence into Shadow Essence.',
    baseCost: { mana: 800, essence: 100 },
    costGrowth: 1.5,
    tier: 4,
    requires: ['umbramancy'],
    upkeep: { essence: 1 },
    effects: [{ stat: 'rate:shadowEssence', kind: 'add', amount: 0.1 }],
  },
  {
    id: 'shadowLabor',
    world: 'arcana',
    kind: 'tech',
    name: 'Shadow Labor',
    description: 'Spell: shades work the Realm through the night. Frightened families have fewer children.',
    baseCost: { shadowEssence: 30 },
    costGrowth: 1,
    tier: 4,
    requires: ['shadowWell'],
    spell: true,
    upkeep: { shadowEssence: 0.15 },
    effects: [
      { stat: 'prod:realm', kind: 'mul', amount: 1.3 },
      { stat: 'growth', kind: 'mul', amount: 0.7 },
    ],
  },
  {
    id: 'chronomancy',
    world: 'arcana',
    kind: 'tech',
    name: 'Chronomancy',
    description: 'Aether bends time. Lets you build a Time Loom to make Time Essence.',
    baseCost: { essence: 200, aether: 10 },
    costGrowth: 1,
    tier: 5,
    requires: ['aetherRift'],
    effects: [],
  },
  {
    id: 'timeLoom',
    world: 'arcana',
    kind: 'building',
    name: 'Time Loom',
    description: 'Weaves Essence and a thread of Aether into Time Essence.',
    baseCost: { essence: 300, aether: 20 },
    costGrowth: 1.6,
    tier: 5,
    requires: ['chronomancy'],
    upkeep: { essence: 1, aether: 0.02 },
    effects: [{ stat: 'rate:timeEssence', kind: 'add', amount: 0.05 }],
  },
  {
    id: 'timeWarp',
    world: 'arcana',
    kind: 'tech',
    name: 'Time Warp',
    description: 'Spell: construction in every world runs at a faster clock.',
    baseCost: { timeEssence: 20 },
    costGrowth: 1,
    tier: 5,
    requires: ['timeLoom'],
    spell: true,
    upkeep: { timeEssence: 0.05 },
    effects: [
      { stat: 'speed:realm', kind: 'mul', amount: 1.5 },
      { stat: 'speed:arcana', kind: 'mul', amount: 1.5 },
      { stat: 'speed:lab', kind: 'mul', amount: 1.5 },
    ],
  },
  {
    id: 'deepTime',
    world: 'arcana',
    kind: 'tech',
    name: 'Deep Time',
    description: 'Spell: aeons pass underground in moments, and the Realm\'s coal seams fill again.',
    baseCost: { timeEssence: 30, essence: 200 },
    costGrowth: 1,
    tier: 5,
    requires: ['timeLoom', 'geomancy'],
    spell: true,
    upkeep: { timeEssence: 0.05 },
    effects: [{ stat: 'regrow:coal', kind: 'add', amount: 2 }],
  },
  {
    id: 'quickenedMinds',
    world: 'arcana',
    kind: 'tech',
    name: 'Quickened Minds',
    description: 'Spell: scholars think faster than time allows.',
    baseCost: { timeEssence: 30 },
    costGrowth: 1,
    tier: 5,
    requires: ['timeLoom'],
    spell: true,
    upkeep: { timeEssence: 0.05 },
    effects: [{ stat: 'prod:lab', kind: 'mul', amount: 1.4 }],
  },

  // ------------------------------------------------------------------ Lab
  {
    id: 'scholar',
    world: 'lab',
    kind: 'building',
    name: 'Scholar',
    description: 'Produces Research. Each Scholar is an idle Realm person who moves into the Lab: paid for in Realm Food and still eating it, but taking no Realm housing or jobs. Demons hunt Scholars too.',
    baseCost: { food: 500 },
    costGrowth: 1.5,
    tier: 1,
    upkeep: { food: 0.2 },
    people: 1,
    effects: [{ stat: 'rate:research', kind: 'add', amount: 0.3 }],
  },
  {
    id: 'laboratory',
    world: 'lab',
    kind: 'building',
    name: 'Laboratory',
    description: 'Iron equipment for serious experiments. Too much science is bad for magic: each Laboratory weakens all of Arcana a little.',
    baseCost: { planks: 30, iron: 20 },
    costGrowth: 1.25,
    tier: 2,
    requires: ['scholar'],
    effects: [
      { stat: 'rate:research', kind: 'add', amount: 1.5 },
      { stat: 'prod:arcana', kind: 'mul', amount: 0.97 },
    ],
  },
  {
    id: 'labAssistants',
    world: 'lab',
    kind: 'building',
    name: 'Lab Assistants',
    description: 'Extra hands make research go faster. They are hired with Realm Gold and, like Scholars, eat Realm Food but take no Realm housing or jobs.',
    baseCost: { gold: 25 },
    costGrowth: 1.6,
    tier: 2,
    maxLevel: 10,
    requires: ['scholar'],
    upkeep: { food: 0.2 },
    effects: [{ stat: 'rate:research', kind: 'mul', amount: 1.1 }],
  },
  // Lab research, in nine ages. Each age's capstone needs every other tech of that age and opens the next;
  // costs follow ageCost(age, step), so every age costs 10 times the one before.
  // Age I: Foundations
  tech(1, 0, 'settlements', 'Settlements', 'How villages grow into towns. Newcomers settle in a little faster.', {}, [], [
    { stat: 'growth', kind: 'mul', amount: 1.1 },
  ]),
  tech(1, 1, 'scientificMethod', 'Scientific Method', 'Research is done properly now.', {}, [], [
    { stat: 'rate:research', kind: 'mul', amount: 1.25 },
  ]),
  tech(1, 2, 'agriculture', 'Agriculture', 'Crop rotation and ploughs. Lets the Realm lay out Farms, and every field yields twice as much.', {}, ['settlements'], [
    { stat: 'rate:food', kind: 'mul', amount: 2 },
  ]),
  tech(1, 3, 'pottery', 'Pottery', 'Wheels and glazes: the Realm digs and fires Clay better.', { clay: 50 }, ['settlements'], [
    { stat: 'rate:clay', kind: 'mul', amount: 1.25 },
    { stat: 'rate:bricks', kind: 'mul', amount: 1.1 },
  ]),
  tech(1, 4, 'mining', 'Mining', 'Shafts, pit props and ore sorting. Lets the Realm dig Mines for Iron.', { stone: 60 }, ['scientificMethod'], []),
  tech(1, 5, 'homebuilding', 'Housing', 'Timber frames and brick walls: lets the Realm build Houses, laid out so they crowd the village a little less.', {}, ['settlements'], [
    { stat: 'crowding', kind: 'mul', amount: 0.9 },
  ]),
  tech(1, 6, 'warehousing', 'Warehousing', 'Ledgers, crates and dry storerooms. Lets the Realm build Warehouses to store more of everything.', { wood: 100 }, ['scientificMethod'], []),
  tech(1, 7, 'basicMachinery', 'Basic Machinery', 'Water wheels, saw frames and bellows: Sawmills and Kilns make twice as much from the same Wood and Clay.', { planks: 40 }, ['scientificMethod'], [
    { stat: 'rate:planks', kind: 'mul', amount: 2 },
    { stat: 'rate:bricks', kind: 'mul', amount: 2 },
  ]),
  tech(1, 8, 'forestry', 'Forestry', 'Managed woodland: the Realm\'s forest regrows twice as fast, and Lumber Camps can be built.', { wood: 200 }, ['scientificMethod'], [
    { stat: 'regrow:wood', kind: 'mul', amount: 2 },
  ]),
  tech(1, 9, 'writing', 'Writing', 'Knowledge outlives the people who found it. Needs every other Foundations tech; opens the Classical age.', { planks: 100 }, [], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ], { capstone: true }),

  // Age II: Classical
  tech(2, 0, 'metallurgy', 'Metallurgy', 'Better smelting in the Realm. Lets the Realm build a Blast Furnace.', { iron: 50 }, ['writing'], [
    { stat: 'rate:iron', kind: 'mul', amount: 1.5 },
  ]),
  tech(2, 1, 'currency', 'Currency', 'Minted coins instead of barter. Lets the Realm build Markets, and makes Gold worth digging for.', { gold: 50 }, ['writing'], [
    { stat: 'rate:gold', kind: 'mul', amount: 1.15 },
  ]),
  tech(2, 2, 'geology', 'Geology', 'Knowing where to dig. Lets the Realm build a Gold Mine.', { stone: 200 }, ['mining', 'writing'], [
    { stat: 'rate:stone', kind: 'mul', amount: 1.2 },
    { stat: 'yield:iron', kind: 'add', amount: 0.05 },
  ]),
  tech(2, 3, 'medicine', 'Medicine', 'Fewer people die young in crowded homes, so crowding slows growth less, and injured workers are patched up.', { food: 300 }, ['writing'], [
    { stat: 'crowding', kind: 'mul', amount: 0.7 },
    { stat: 'accidents', kind: 'mul', amount: 0.7 },
  ]),
  tech(2, 4, 'cartography', 'Cartography', 'Map the lands around the Realm: 1 more square of land to build on, for good. Repeatable up to 10 times per Lab run, each costing twice as much; a Lab reset lets you map again for more.', {}, ['writing'], [
    { stat: 'land', kind: 'add', amount: 1 },
  ], { costGrowth: 2, maxLevel: 10, lasting: true }),
  tech(2, 5, 'rationalism', 'Rationalism', 'Faster research. Widespread disbelief weakens magic. Repeatable.', {}, ['writing'], [
    { stat: 'rate:research', kind: 'mul', amount: 1.3 },
    { stat: 'rate:mana', kind: 'mul', amount: 0.8 },
  ], { costGrowth: 1.6, maxLevel: 10 }),
  tech(2, 6, 'aqueducts', 'Aqueducts', 'Water carried from far away. Lets the Realm build Aqueducts, and the hungry hold out longer.', { bricks: 150 }, ['medicine'], [
    { stat: 'starvation', kind: 'mul', amount: 0.75 },
  ]),
  tech(2, 7, 'mathematics', 'Mathematics', 'Numbers for everything: research runs much faster.', {}, ['writing'], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ]),
  tech(2, 8, 'engineering', 'Engineering', 'Better planks and bricks, and Irrigation. Needs every other Classical tech; opens the Medieval age.', { planks: 200 }, [], [
    { stat: 'rate:planks', kind: 'mul', amount: 1.25 },
    { stat: 'rate:bricks', kind: 'mul', amount: 1.25 },
  ], { capstone: true }),

  // Age III: Medieval
  tech(3, 0, 'logistics', 'Logistics', 'Planned supply lines make Realm construction much faster.', { planks: 300 }, ['engineering'], [
    { stat: 'speed:realm', kind: 'mul', amount: 1.3 },
  ]),
  tech(3, 1, 'occultism', 'Occultism', 'Candles, old books and whispered rites. Lets the Realm raise a Shrine, which opens Arcana.', {}, ['engineering'], [
    { stat: 'rate:mana', kind: 'mul', amount: 1.1 },
  ]),
  tech(3, 2, 'optics', 'Optics', 'Lenses and light. Lets the Realm build a Glassworks and an Observatory.', { bricks: 100 }, ['engineering'], [
    { stat: 'prod:lab', kind: 'mul', amount: 1.1 },
  ]),
  tech(3, 3, 'guilds', 'Guilds', 'Masters and apprentices: Realm buildings are cheaper and go up faster.', { gold: 200 }, ['engineering'], [
    { stat: 'cost:realm', kind: 'mul', amount: 0.9 },
    { stat: 'speed:realm', kind: 'mul', amount: 1.1 },
  ]),
  tech(3, 4, 'sanitation', 'Sanitation', 'Sewers and clean streets. Crowding slows growth far less, and fewer workers die of infected wounds.', { bricks: 300 }, ['medicine', 'engineering'], [
    { stat: 'crowding', kind: 'mul', amount: 0.6 },
    { stat: 'accidents', kind: 'mul', amount: 0.8 },
  ]),
  tech(3, 5, 'sailing', 'Sailing', 'Boats built from Planks. Fishing boats bring in more Food, and the coast opens up to explorers.', { planks: 400 }, ['cartography', 'engineering'], [
    { stat: 'rate:food', kind: 'mul', amount: 1.15 },
  ]),
  tech(3, 6, 'arcaneTheory', 'Arcane Theory', 'Studying magic instead of dismissing it.', { essence: 60 }, ['occultism'], [
    { stat: 'rate:essence', kind: 'mul', amount: 1.3 },
  ]),
  tech(3, 7, 'universities', 'Universities', 'Places of learning. Lets the Realm found a University, and research runs faster.', { bricks: 200 }, ['optics'], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ]),
  tech(3, 8, 'printing', 'Printing', 'Knowledge spreads. Lets the Realm build a Printing Press. Needs every other Medieval tech; opens the Renaissance.', { planks: 300 }, [], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ], { capstone: true }),

  // Age IV: Renaissance
  tech(4, 0, 'navigation', 'Navigation', 'Charts, lenses and the stars: ships can cross open sea. Trade brings in more Gold, and Expeditions can set out.', { glass: 60 }, ['sailing', 'printing'], [
    { stat: 'rate:gold', kind: 'mul', amount: 1.25 },
  ]),
  tech(4, 1, 'banking', 'Banking', 'Letters of credit and counting houses: much more Gold.', { gold: 300 }, ['currency', 'printing'], [
    { stat: 'rate:gold', kind: 'mul', amount: 1.5 },
  ]),
  tech(4, 2, 'scientificInstruments', 'Scientific Instruments', 'Telescopes, microscopes and clocks: research runs faster.', { glass: 150 }, ['optics', 'printing'], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ]),
  tech(4, 3, 'expedition', 'Expedition', 'Sail beyond the maps. Each expedition finds 5 more squares of land for the Realm, for good. Repeatable; a Lab reset lets you sail again for more.', { food: 1000 }, ['navigation'], [
    { stat: 'land', kind: 'add', amount: 5 },
  ], { costGrowth: 1.3, maxLevel: 30, lasting: true }),
  tech(4, 4, 'chemistry', 'Chemistry', 'Elements instead of humours: Coal and Glass are made far better.', { glass: 100, coal: 200 }, ['printing'], [
    { stat: 'rate:coal', kind: 'mul', amount: 1.5 },
    { stat: 'rate:glass', kind: 'mul', amount: 1.25 },
  ]),
  tech(4, 5, 'anatomy', 'Anatomy', 'Knowing how bodies work: fewer deaths at work and from hunger.', { food: 500 }, ['medicine', 'printing'], [
    { stat: 'accidents', kind: 'mul', amount: 0.75 },
    { stat: 'starvation', kind: 'mul', amount: 0.75 },
  ]),
  tech(4, 6, 'enlightenment', 'Enlightenment', 'Reason above all: research doubles, and magic fades a little. Needs every other Renaissance tech; opens the Industrial age.', { gold: 200 }, [], [
    { stat: 'rate:research', kind: 'mul', amount: 2 },
    { stat: 'rate:mana', kind: 'mul', amount: 0.9 },
  ], { capstone: true }),

  // Age V: Industrial
  tech(5, 0, 'industrialization', 'Industrialization', 'Cheaper Realm buildings. The smog chokes Essence and the Realm\'s growth.', { iron: 300 }, ['enlightenment'], [
    { stat: 'cost:realm', kind: 'mul', amount: 0.85 },
    { stat: 'rate:essence', kind: 'mul', amount: 0.85 },
    { stat: 'pollution', kind: 'add', amount: 8 },
  ]),
  tech(5, 1, 'steamPower', 'Steam Power', 'Engines drive the Realm\'s works: much more of everything, and more smoke. Needed for Golem Works.', { steel: 200 }, ['industrialization'], [
    { stat: 'prod:realm', kind: 'mul', amount: 1.5 },
    { stat: 'pollution', kind: 'add', amount: 4 },
  ]),
  tech(5, 2, 'filtration', 'Filtration', 'Filters on every chimney. Pollution slows the Realm\'s growth far less.', { iron: 300 }, ['industrialization', 'medicine'], [
    { stat: 'pollution', kind: 'mul', amount: 0.5 },
  ]),
  tech(5, 3, 'railways', 'Railways', 'Goods move fast: Realm construction speeds up, and less spoils in Warehouses.', { steel: 400 }, ['steamPower'], [
    { stat: 'speed:realm', kind: 'mul', amount: 1.5 },
    { stat: 'decay:realm', kind: 'mul', amount: 0.5 },
  ]),
  tech(5, 4, 'environmentalScience', 'Environmental Science', 'Understanding how the land heals: faster regrowth, less pollution, and the Realm can plant Parks.', { glass: 150 }, ['forestry', 'filtration'], [
    { stat: 'regrow:wood', kind: 'mul', amount: 2 },
    { stat: 'pollution', kind: 'mul', amount: 0.8 },
  ]),
  tech(5, 5, 'precisionTools', 'Precision Tools', 'Lathes and gauges: the Realm makes more, and can build Machine Shops for Machine Parts.', { steel: 300 }, ['steamPower'], [
    { stat: 'prod:realm', kind: 'mul', amount: 1.2 },
  ]),
  tech(5, 6, 'electricity', 'Electricity', 'Power down a wire: research doubles. Needs every other Industrial tech; opens the Electric age.', { steel: 500, machineParts: 100 }, [], [
    { stat: 'rate:research', kind: 'mul', amount: 2 },
  ], { capstone: true }),

  // Age VI: Electric
  tech(6, 0, 'telegraph', 'Telegraph', 'Messages at the speed of light: all Lab production is faster.', { machineParts: 200 }, ['electricity'], [
    { stat: 'prod:lab', kind: 'mul', amount: 1.5 },
  ]),
  tech(6, 1, 'fertilizers', 'Fertilizers', 'Chemistry in the fields: twice the Food, and runoff pollution.', { coal: 1000 }, ['electricity', 'chemistry'], [
    { stat: 'rate:food', kind: 'mul', amount: 2 },
    { stat: 'pollution', kind: 'add', amount: 3 },
  ]),
  tech(6, 2, 'thaumicPhysics', 'Thaumic Physics', 'Science and magic agree on something at last.', { aether: 20 }, ['rationalism', 'arcaneTheory', 'electricity'], [
    { stat: 'rate:aether', kind: 'mul', amount: 2 },
    { stat: 'prod:lab', kind: 'mul', amount: 1.5 },
  ]),
  tech(6, 3, 'vaccines', 'Vaccines', 'Diseases stopped before they start: far fewer deaths at work and from hunger.', { food: 1000 }, ['anatomy', 'electricity'], [
    { stat: 'accidents', kind: 'mul', amount: 0.5 },
    { stat: 'starvation', kind: 'mul', amount: 0.5 },
  ]),
  tech(6, 4, 'combustionEngine', 'Combustion Engine', 'Engines that burn Oil: much more production, more pollution, and the Realm can drill Oil Wells.', { machineParts: 300 }, ['electricity'], [
    { stat: 'prod:realm', kind: 'mul', amount: 1.5 },
    { stat: 'pollution', kind: 'add', amount: 6 },
  ]),
  tech(6, 5, 'massProduction', 'Mass Production', 'Assembly lines: Realm buildings cost far less, and magic fades. Needs every other Electric tech; opens the Atomic age.', { machineParts: 500, oil: 500 }, [], [
    { stat: 'cost:realm', kind: 'mul', amount: 0.7 },
    { stat: 'rate:mana', kind: 'mul', amount: 0.9 },
  ], { capstone: true }),

  // Age VII: Atomic
  tech(7, 0, 'automation', 'Automation', 'Machines take over the Realm\'s busywork.', { machineParts: 500 }, ['massProduction'], [
    { stat: 'prod:realm', kind: 'mul', amount: 1.5 },
  ]),
  tech(7, 1, 'radio', 'Radio', 'Voices through the air: research runs faster.', { glass: 500, machineParts: 200 }, ['massProduction'], [
    { stat: 'rate:research', kind: 'mul', amount: 1.5 },
  ]),
  tech(7, 2, 'greenRevolution', 'Green Revolution', 'New crops and machines: three times the Food.', { food: 2000 }, ['fertilizers', 'massProduction'], [
    { stat: 'rate:food', kind: 'mul', amount: 3 },
  ]),
  tech(7, 3, 'polymers', 'Polymers', 'Long molecules from Oil. Lets the Realm build Refineries for Plastics.', { oil: 1000 }, ['massProduction'], []),
  tech(7, 4, 'antibiotics', 'Antibiotics', 'Infections cured: half as many deaths at work.', { plastics: 200 }, ['vaccines'], [
    { stat: 'accidents', kind: 'mul', amount: 0.5 },
  ]),
  tech(7, 5, 'radioactivity', 'Radioactivity', 'Rocks that glow. Lets the Realm dig Uranium Mines.', { machineParts: 300 }, ['massProduction'], []),
  tech(7, 6, 'nuclearPhysics', 'Nuclear Physics', 'Splitting the atom: research doubles, and magic fades. Needs every other Atomic tech; opens the Information age.', { uranium: 100 }, [], [
    { stat: 'rate:research', kind: 'mul', amount: 2 },
    { stat: 'rate:mana', kind: 'mul', amount: 0.8 },
  ], { capstone: true }),

  // Age VIII: Information
  tech(8, 0, 'semiconductors', 'Semiconductors', 'Materials that half conduct. Lets the Realm build Silicon Works.', { plastics: 500 }, ['nuclearPhysics'], []),
  tech(8, 1, 'transistors', 'Transistors', 'Tiny switches. Lets the Realm build Chip Fabs for Electronics.', { silicon: 200 }, ['semiconductors'], []),
  tech(8, 2, 'globalization', 'Globalization', 'Trade around the whole world: twice the Gold.', { gold: 2000 }, ['nuclearPhysics'], [
    { stat: 'rate:gold', kind: 'mul', amount: 2 },
  ]),
  tech(8, 3, 'computers', 'Computers', 'Machines that think in numbers: research doubles.', { electronics: 100 }, ['transistors'], [
    { stat: 'rate:research', kind: 'mul', amount: 2 },
  ]),
  tech(8, 4, 'genetics', 'Genetics', 'Reading life\'s code: families grow twice as fast, and half as many die at work.', { electronics: 100 }, ['computers', 'antibiotics'], [
    { stat: 'growth', kind: 'mul', amount: 2 },
    { stat: 'accidents', kind: 'mul', amount: 0.5 },
  ]),
  tech(8, 5, 'satellites', 'Satellites', 'Eyes in orbit map every corner: 20 more squares of land, for good. A Lab reset lets you launch again for more.', { electronics: 150, steel: 1000 }, ['computers'], [
    { stat: 'land', kind: 'add', amount: 20 },
  ], { lasting: true }),
  tech(8, 6, 'internet', 'The Internet', 'Everyone connected: all Lab production doubles, and magic fades. Needs every other Information tech; opens the Current Age.', { electronics: 300 }, [], [
    { stat: 'prod:lab', kind: 'mul', amount: 2 },
    { stat: 'rate:mana', kind: 'mul', amount: 0.8 },
  ], { capstone: true }),

  // Age IX: Current Age
  tech(9, 0, 'renewableEnergy', 'Renewable Energy', 'Sun and wind instead of smoke: pollution almost gone.', { electronics: 300, steel: 2000 }, ['internet'], [
    { stat: 'pollution', kind: 'mul', amount: 0.1 },
  ]),
  tech(9, 1, 'geneEditing', 'Gene Editing', 'Rewriting life\'s code: families grow twice as fast, and hunger barely kills.', { electronics: 300 }, ['genetics'], [
    { stat: 'growth', kind: 'mul', amount: 2 },
    { stat: 'starvation', kind: 'mul', amount: 0.25 },
  ]),
  tech(9, 2, 'spaceFlight', 'Space Flight', 'Settle beyond the sky: 25 more squares of land each time, for good. Repeatable; a Lab reset lets you launch again for more.', { electronics: 500, steel: 2000 }, ['satellites'], [
    { stat: 'land', kind: 'add', amount: 25 },
  ], { costGrowth: 1.5, maxLevel: 20, lasting: true }),
  tech(9, 3, 'machineLearning', 'Machine Learning', 'Machines that learn: research triples.', { electronics: 500 }, ['internet'], [
    { stat: 'rate:research', kind: 'mul', amount: 3 },
  ]),
  tech(9, 4, 'quantumComputing', 'Quantum Computing', 'Computing with uncertainty: all Lab production doubles.', { electronics: 800 }, ['machineLearning'], [
    { stat: 'prod:lab', kind: 'mul', amount: 2 },
  ]),
  tech(9, 5, 'artificialIntelligence', 'Artificial Intelligence', 'Minds of our own making: all production in every world triples. Needs every other tech of the Current Age.', { electronics: 1000 }, [], [
    { stat: 'prod:realm', kind: 'mul', amount: 3 },
    { stat: 'prod:lab', kind: 'mul', amount: 3 },
    { stat: 'prod:arcana', kind: 'mul', amount: 3 },
  ], { capstone: true }),
];

export const NODES = Object.fromEntries(nodeList.map((n) => [n.id, n])) as Record<NodeId, NodeDef>;
export const NODE_ORDER: NodeId[] = nodeList.map((n) => n.id);

const metaList: MetaDef[] = [
  {
    id: 'headStartRealm',
    name: 'Head Start: Realm',
    description: 'Each Realm run starts with +2 Huts.',
    baseCost: 1,
    costGrowth: 2,
    maxLevel: 5,
  },
  {
    id: 'headStartArcana',
    name: 'Head Start: Arcana',
    description: 'Each Arcana run starts with +2 Mana Wells.',
    baseCost: 1,
    costGrowth: 2,
    maxLevel: 5,
  },
  {
    id: 'headStartLab',
    name: 'Head Start: Lab',
    description: 'Each Lab run starts with +2 Scholars.',
    baseCost: 1,
    costGrowth: 2,
    maxLevel: 5,
  },
  {
    id: 'resonanceRealm',
    name: 'Resonance: Realm',
    description: 'Realm production x1.1, permanently.',
    baseCost: 2,
    costGrowth: 1.6,
    effects: [{ stat: 'prod:realm', kind: 'mul', amount: 1.1 }],
  },
  {
    id: 'resonanceArcana',
    name: 'Resonance: Arcana',
    description: 'Arcana production x1.1, permanently.',
    baseCost: 2,
    costGrowth: 1.6,
    effects: [{ stat: 'prod:arcana', kind: 'mul', amount: 1.1 }],
  },
  {
    id: 'resonanceLab',
    name: 'Resonance: Lab',
    description: 'Lab production x1.1, permanently.',
    baseCost: 2,
    costGrowth: 1.6,
    effects: [{ stat: 'prod:lab', kind: 'mul', amount: 1.1 }],
  },
  {
    id: 'dampening',
    name: 'Dampening',
    description: 'Harmful effects between worlds are 10% weaker.',
    baseCost: 3,
    costGrowth: 2,
    maxLevel: 5,
  },
  {
    id: 'amplify',
    name: 'Amplify',
    description: 'Helpful effects between worlds are 10% stronger.',
    baseCost: 3,
    costGrowth: 2,
    maxLevel: 10,
  },
  {
    id: 'attunement',
    name: 'Echo Attunement',
    description: '+10% Echoes from every reset.',
    baseCost: 5,
    costGrowth: 2,
  },
  {
    id: 'swiftHands',
    name: 'Swift Hands',
    description: 'Everything builds 10% faster, in every world.',
    baseCost: 2,
    costGrowth: 1.8,
    effects: [
      { stat: 'speed:realm', kind: 'mul', amount: 1.1 },
      { stat: 'speed:arcana', kind: 'mul', amount: 1.1 },
      { stat: 'speed:lab', kind: 'mul', amount: 1.1 },
    ],
  },
  {
    id: 'masterBuilders',
    name: 'Master Builders',
    description: 'Each world can work on one more building, discovery or tech at the same time (up to 5).',
    baseCost: 3,
    costGrowth: 2,
    maxLevel: 4,
  },
  {
    id: 'richEarth',
    name: 'Rich Earth',
    description: 'On a Realm reset, the forest grows by 1% of the Wood cut from it that run, per level.',
    baseCost: 1,
    costGrowth: 1.12,
    maxLevel: 50,
  },
  {
    id: 'multicast',
    name: 'Multicast',
    description: 'Keep one more Arcana spell on at the same time.',
    baseCost: 25,
    costGrowth: 4,
    maxLevel: 3,
  },
  {
    id: 'retainedKnowledge',
    name: 'Retained Knowledge',
    description: 'Lab resets keep your most expensive tech (one more per level).',
    baseCost: 5,
    costGrowth: 3,
    maxLevel: 3,
  },
];

export const META = Object.fromEntries(metaList.map((m) => [m.id, m])) as Record<MetaId, MetaDef>;
export const META_ORDER: MetaId[] = metaList.map((m) => m.id);

// ------------------------------------------------------------ achievements

const achievementList: AchievementDef[] = [
  {
    id: 'village',
    name: 'A Proper Village',
    goal: 'Have 10 people in the Realm at once.',
    reward: 'Every Realm run starts with 2 more people.',
    progress: (state) => [Math.floor(state.population), 10],
    startPeople: 2,
  },
  {
    id: 'deforested',
    name: 'I Can\'t See the Forest or All the Trees',
    goal: 'Clear the whole forest away with Quarries, Clay Pits and mines, so it cannot hold a single tree.',
    reward: 'The forest is 2,000 Wood bigger, and every Realm run starts with it full.',
    progress: (state, mods) => {
      // How much the buildings have cleared, against the forest there was to clear.
      const cleared = nodeList.reduce((sum, n) => {
        const cut = n.effects.find((e) => e.stat === 'size:wood' && e.kind === 'add' && e.amount < 0);
        return cut ? sum - cut.amount * state.nodes[n.id] : sum;
      }, 0);
      const left = Math.max(0, state.deposits.wood.max + (mods.get('size:wood')?.add ?? 0));
      return [cleared, cleared + left];
    },
    effects: [{ stat: 'size:wood', kind: 'add', amount: 2000 }],
  },
  {
    id: 'crowdedLand',
    name: 'Not an Inch to Spare',
    goal: 'Use every square of the Realm\'s land for buildings.',
    reward: '5 more squares of land, for good.',
    progress: (state, mods) => {
      // Every Realm building level takes a square, and so does one being built.
      const used = nodeList
        .filter((n) => n.world === 'realm' && n.kind === 'building')
        .reduce((sum, n) => sum + state.nodes[n.id] + (state.construction[n.id] ? 1 : 0), 0);
      return [used, LAND.base + (mods.get('land')?.add ?? 0)];
    },
    effects: [{ stat: 'land', kind: 'add', amount: 5 }],
  },
  {
    id: 'hundredGraves',
    name: 'A Hundred Graves',
    goal: 'Have 100 people die in a single Realm run: at work, of hunger or to demons.',
    reward: 'The Realm\'s population grows 10% faster, for good.',
    progress: (state) => [state.runDeaths, 100],
    effects: [{ stat: 'growth', kind: 'mul', amount: 1.1 }],
  },
  // One per Lab age: research every tech of the age once, in any run.
  ...(
    [
      ['Out of the Stone Age', 'Research ×1.25; every Realm run starts with 1 more person.', 1.25, [], 1],
      ['Classical Education', 'Research ×1.25; the Realm\'s population grows 10% faster.', 1.25, [{ stat: 'growth', kind: 'mul', amount: 1.1 }]],
      ['Keepers of Knowledge', 'Research ×1.5; Realm buildings go up 10% faster.', 1.5, [{ stat: 'speed:realm', kind: 'mul', amount: 1.1 }]],
      ['Age of Discovery', 'Research ×1.5; 5 more squares of land.', 1.5, [{ stat: 'land', kind: 'add', amount: 5 }]],
      ['Industrial Revolution', 'Research ×1.5; all Realm production ×1.25.', 1.5, [{ stat: 'prod:realm', kind: 'mul', amount: 1.25 }]],
      ['Let There Be Light', 'Research ×2.', 2, []],
      ['Splitting the Atom', 'Research ×2; Realm costs ×0.9.', 2, [{ stat: 'cost:realm', kind: 'mul', amount: 0.9 }]],
      ['Information Superhighway', 'Research ×2; all Lab production ×1.5.', 2, [{ stat: 'prod:lab', kind: 'mul', amount: 1.5 }]],
      ['Singularity', 'All production in every world ×2.', 1, [
        { stat: 'prod:realm', kind: 'mul', amount: 2 },
        { stat: 'prod:lab', kind: 'mul', amount: 2 },
        { stat: 'prod:arcana', kind: 'mul', amount: 2 },
      ]],
    ] as [string, string, number, Effect[], number?][]
  ).map(([name, reward, research, effects, startPeople], i): AchievementDef => {
    const age = i + 1;
    const techs = () => nodeList.filter((n) => n.age === age);
    return {
      id: `age${age}` as AchievementId,
      name,
      goal: `Research every tech of the ${AGES[i]} age (Age ${age}) in one run.`,
      reward,
      progress: (state) => [techs().filter((n) => state.nodes[n.id] > 0).length, techs().length],
      effects: [...(research > 1 ? [{ stat: 'rate:research', kind: 'mul', amount: research } as Effect] : []), ...effects],
      ...(startPeople ? { startPeople } : {}),
    };
  }),
];

export const ACHIEVEMENTS = Object.fromEntries(achievementList.map((a) => [a.id, a])) as Record<AchievementId, AchievementDef>;
export const ACHIEVEMENT_ORDER: AchievementId[] = achievementList.map((a) => a.id);
