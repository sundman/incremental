export type WorldId = 'realm' | 'arcana' | 'lab';

export type ResourceId =
  // Realm
  | 'wood'
  | 'stone'
  | 'food'
  | 'clay'
  | 'planks'
  | 'bricks'
  | 'iron'
  | 'coal'
  | 'steel'
  | 'glass'
  | 'gold'
  | 'runestone'
  // Arcana
  | 'mana'
  | 'essence'
  | 'fireEssence'
  | 'lifeEssence'
  | 'shadowEssence'
  | 'timeEssence'
  | 'aether'
  | 'research';

/**
 * A stat is anything a node effect can modify.
 * - `rate:<resource>`  production per second of one resource
 * - `click:<resource>` amount gained per click on one resource
 * - `prod:<world>`     multiplier on all production in a world
 * - `cost:<world>`     multiplier on the cost of every node in a world
 * - `yield:<resource>` extra output per worker assigned to that resource's job
 * - `housing`          Realm population cap
 * - `land`             Realm squares of land to build on (every building level takes one)
 * - `growth`           Realm population growth, in people per second
 * - `crowding`         Realm crowding, which slows growth; homes add it, sanitation cuts it
 * - `pollution`        Realm pollution, which slows growth; dirty industry adds it, parks and filters cut it
 * - `regrow:<deposit>`  how fast one of the Realm's deposits (forest, quarries...) refills per second
 * - `deaths`           Realm people killed per hour
 * - `speed:<world>`    build speed multiplier in a world (higher is faster)
 */
export type Stat =
  | `rate:${ResourceId}`
  | `click:${ResourceId}`
  | `prod:${WorldId}`
  | `cost:${WorldId}`
  | `yield:${ResourceId}`
  | 'housing'
  | 'land'
  | 'growth'
  | 'crowding'
  | 'pollution'
  | `regrow:${DepositId}`
  | 'deaths'
  | `speed:${WorldId}`;

export type Cost = Partial<Record<ResourceId, number>>;

/** Realm resources that come from a limited deposit: the forest, quarries, clay beds and coal seams. */
export type DepositId = 'wood' | 'stone' | 'clay' | 'coal';

export interface DepositDef {
  name: string;
  icon: string;
  /** Size of the very first deposit. */
  start: number;
  /** Amount it refills per second on its own, before `regrow` modifiers. */
  baseRegrow: number;
  /** Whether pollution slows the refill (true for the forest). */
  pollutionSlows?: boolean;
}

export interface Deposit {
  /** Still there to be gathered. */
  left: number;
  /** The most it can hold this Realm run; grows with every Realm reset. */
  max: number;
  /** Gathered from it this Realm run; decides how much bigger it is next run. */
  cut: number;
}

export interface Effect {
  stat: Stat;
  /** `add` sums `amount * level`; `mul` multiplies by `amount ^ level`. */
  kind: 'add' | 'mul';
  amount: number;
  /** For `mul`: grow linearly instead, multiplying by `1 + (amount - 1) * level`. */
  linear?: boolean;
  /**
   * Makes the effect stronger with each level of a node beyond the first:
   * its strength is multiplied by `1 + perLevel * (level - 1)`.
   */
  scaleBy?: { node: NodeId; perLevel: number };
}

export interface WorldDef {
  id: WorldId;
  name: string;
  tagline: string;
  /** How the world is opened, shown while it is locked. */
  unlockHint: string;
  startsUnlocked: boolean;
  /** The buildings granted by the Head Start meta upgrade. */
  headStartNodes: NodeId[];
}

export interface ResourceDef {
  id: ResourceId;
  name: string;
  world: WorldId;
  /** Base amount gained per click; resources without it cannot be clicked. */
  click?: number;
  /** Weight of one unit when scoring a run for Echoes. */
  value: number;
  /** Hidden until this node is owned (e.g. Aether appears once the Rift opens). */
  revealedBy?: NodeId;
}

export type JobId = 'woodcutter' | 'stonecutter' | 'farmer' | 'digger' | 'miner' | 'collier' | 'prospector';

/** A Realm job. Each assigned person produces `baseYield` (plus `yield:` bonuses) of `resource` per second. */
export interface JobDef {
  id: JobId;
  name: string;
  resource: ResourceId;
  baseYield: number;
  /** Nodes that must be owned before anyone can take this job. */
  requires?: NodeId[];
  /** Extra effects per assigned worker, e.g. miners disturbing the ley lines. */
  effects?: Effect[];
}

/** `tech` is a one-time unlock: a Lab technology or an Arcana discovery. */
export type NodeKind = 'building' | 'tech';

export interface NodeDef {
  id: NodeId;
  world: WorldId;
  kind: NodeKind;
  name: string;
  description: string;
  baseCost: Cost;
  /** Cost multiplier per level owned. Ignored for one-level nodes. */
  costGrowth: number;
  /** Build-time tier, 1 (seconds) to 6 (many minutes). See `TIER_SECONDS`. */
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  /** Omit for unlimited levels. Techs are always 1. */
  maxLevel?: number;
  /** Nodes that must be owned (level >= 1) before this one can be bought. */
  requires?: NodeId[];
  /** Total building levels needed in this node's world before it can be bought. */
  requiresBuildings?: number;
  effects: Effect[];
  /** Resources consumed per second per level; effects scale down if upkeep cannot be paid. */
  upkeep?: Cost;
  /**
   * A spell: once learned it can be switched on and off. Its effects and upkeep only
   * apply while it is on.
   */
  spell?: boolean;
  /**
   * A horde spell (Summon Demons): once cast it cannot be switched off. The horde grows
   * over time and its effects scale with its size instead of the level. It ends when the
   * Realm is down to its last survivors, and the horde vanishes with it.
   */
  horde?: boolean;
  /** Survives resets of its world (e.g. land found by exploring). */
  permanent?: boolean;
  /** Owning at least one level opens this world for good. */
  unlocksWorld?: WorldId;
}

export type NodeId =
  // Realm
  | 'hut'
  | 'farm'
  | 'lumberCamp'
  | 'quarry'
  | 'clayPit'
  | 'workshop'
  | 'sawmill'
  | 'kiln'
  | 'house'
  | 'mine'
  | 'coalMine'
  | 'foundry'
  | 'market'
  | 'buildersGuild'
  | 'well'
  | 'tavern'
  | 'library'
  | 'shrine'
  | 'irrigation'
  | 'aqueduct'
  | 'park'
  | 'foresterLodge'
  | 'blastFurnace'
  | 'glassworks'
  | 'goldMine'
  | 'printingPress'
  | 'church'
  | 'observatory'
  | 'university'
  | 'cathedral'
  | 'runesmith'
  | 'leyAnchor'
  | 'golemWorks'
  // Arcana
  | 'manaWell'
  | 'condenser'
  | 'focusCrystal'
  | 'enchantedTools'
  | 'aetherRift'
  | 'aetherLens'
  | 'summoningCircle'
  | 'runeLore'
  | 'animation'
  | 'fertilityRite'
  | 'haste'
  | 'pyromancy'
  | 'fireAltar'
  | 'forgeFire'
  | 'vitalism'
  | 'lifeSpring'
  | 'bountifulHarvest'
  | 'healingLight'
  | 'umbramancy'
  | 'shadowWell'
  | 'shadowLabor'
  | 'chronomancy'
  | 'timeLoom'
  | 'timeWarp'
  | 'quickenedMinds'
  // Lab
  | 'scholar'
  | 'laboratory'
  | 'labAssistants'
  | 'scientificMethod'
  | 'engineering'
  | 'geology'
  | 'optics'
  | 'printing'
  | 'medicine'
  | 'sanitation'
  | 'filtration'
  | 'geomancy'
  | 'earthsong'
  | 'deepTime'
  | 'forestry'
  | 'cartography'
  | 'sailing'
  | 'navigation'
  | 'expedition'
  | 'occultism'
  | 'currency'
  | 'environmentalScience'
  | 'logistics'
  | 'metallurgy'
  | 'rationalism'
  | 'industrialization'
  | 'arcaneTheory'
  | 'automation'
  | 'thaumicPhysics';

export type MetaId =
  | 'headStartRealm'
  | 'headStartArcana'
  | 'headStartLab'
  | 'resonanceRealm'
  | 'resonanceArcana'
  | 'resonanceLab'
  | 'dampening'
  | 'amplify'
  | 'attunement'
  | 'swiftHands'
  | 'masterBuilders'
  | 'richEarth'
  | 'multicast'
  | 'retainedKnowledge';

export interface MetaDef {
  id: MetaId;
  name: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  maxLevel?: number;
  /** Plain modifiers applied permanently (e.g. Resonance). Special upgrades are read by id. */
  effects?: Effect[];
}

export interface GameState {
  version: number;
  resources: Record<ResourceId, number>;
  nodes: Record<NodeId, number>;
  unlockedWorlds: WorldId[];
  /** Weighted value earned in each world since its last reset; drives the Echo reward. */
  runEarned: Record<WorldId, number>;
  echoes: number;
  totalEchoes: number;
  resets: Record<WorldId, number>;
  meta: Record<MetaId, number>;
  /** Realm people, fractional while the next one is arriving. Only whole people can work. */
  population: number;
  /** Realm people assigned to each job. */
  jobs: Record<JobId, number>;
  /** Learned spells that are currently switched on. */
  activeSpells: NodeId[];
  /** What is left in each of the Realm's deposits (forest, quarries, clay beds, coal seams). */
  deposits: Record<DepositId, Deposit>;
  /** Size of the summoned demon horde; 0 unless a horde spell is on. Fractional while growing. */
  demons: number;
  /** Levels being built right now, in base seconds of work (before build speed). */
  construction: Partial<Record<NodeId, { done: number; needed: number }>>;
  /** Fraction (0..1) of each upkeep node's effect that ran last tick. */
  efficiency: Partial<Record<NodeId, number>>;
}
