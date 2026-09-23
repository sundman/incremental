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
 */
export type Stat =
  | `rate:${ResourceId}`
  | `click:${ResourceId}`
  | `prod:${WorldId}`
  | `cost:${WorldId}`
  | `yield:${ResourceId}`
  | 'housing';

export type Cost = Partial<Record<ResourceId, number>>;

export interface Effect {
  stat: Stat;
  /** `add` sums `amount * level`; `mul` multiplies by `amount ^ level`. */
  kind: 'add' | 'mul';
  amount: number;
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
  /** Omit for unlimited levels. Techs are always 1. */
  maxLevel?: number;
  /** Nodes that must be owned (level >= 1) before this one can be bought. */
  requires?: NodeId[];
  /** Total building levels needed in this node's world before it can be bought. */
  requiresBuildings?: number;
  effects: Effect[];
  /** Resources consumed per second per level; effects scale down if upkeep cannot be paid. */
  upkeep?: Cost;
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
  | 'library'
  | 'shrine'
  | 'irrigation'
  | 'blastFurnace'
  | 'glassworks'
  | 'goldMine'
  | 'printingPress'
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
  | 'runeLore'
  | 'animation'
  // Lab
  | 'scholar'
  | 'laboratory'
  | 'scientificMethod'
  | 'engineering'
  | 'geology'
  | 'optics'
  | 'printing'
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
  /** Fraction (0..1) of each upkeep node's effect that ran last tick. */
  efficiency: Partial<Record<NodeId, number>>;
}
