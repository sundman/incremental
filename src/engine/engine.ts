import {
  JOBS,
  JOB_ORDER,
  META,
  META_ORDER,
  NODES,
  NODE_ORDER,
  POPULATION,
  RESOURCES,
  RESOURCE_ORDER,
  WORLDS,
  WORLD_ORDER,
} from './content';
import type { Cost, Effect, GameState, JobId, MetaId, NodeId, ResourceId, Stat, WorldId } from './types';

export const SAVE_VERSION = 1;

/** Longest slice of time simulated in one step, so upkeep and unlocks stay accurate. */
const MAX_STEP_SECONDS = 1;

// ------------------------------------------------------------------ state

export function createInitialState(): GameState {
  const zeroes = <K extends string>(keys: readonly K[]) =>
    Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  return {
    version: SAVE_VERSION,
    resources: zeroes(RESOURCE_ORDER),
    nodes: zeroes(NODE_ORDER),
    unlockedWorlds: WORLD_ORDER.filter((w) => WORLDS[w].startsUnlocked),
    runEarned: zeroes(WORLD_ORDER),
    echoes: 0,
    totalEchoes: 0,
    resets: zeroes(WORLD_ORDER),
    meta: zeroes(META_ORDER),
    population: POPULATION.start,
    jobs: zeroes(JOB_ORDER),
    efficiency: {},
  };
}

export function isWorldUnlocked(state: GameState, world: WorldId): boolean {
  return state.unlockedWorlds.includes(world);
}

// -------------------------------------------------------------- modifiers

/** The world a stat belongs to, used to tell local effects from cross-world links. */
export function statWorld(stat: Stat): WorldId {
  if (stat === 'housing') return 'realm';
  const [type, target] = stat.split(':') as [string, string];
  if (type === 'rate' || type === 'click' || type === 'yield') return RESOURCES[target as ResourceId].world;
  return target as WorldId;
}

/** Whether an effect makes things better for the world it targets. */
export function isHelpful(effect: Effect): boolean {
  const lowerIsBetter = effect.stat.startsWith('cost:');
  const increases = effect.kind === 'add' ? effect.amount > 0 : effect.amount > 1;
  return lowerIsBetter ? !increases : increases;
}

/**
 * Scales a cross-world effect by the Amplify / Dampening meta upgrades.
 * Local effects are returned unchanged.
 */
export function effectiveAmount(state: GameState, effect: Effect, sourceWorld: WorldId): number {
  if (statWorld(effect.stat) === sourceWorld) return effect.amount;
  const factor = isHelpful(effect)
    ? 1 + 0.1 * state.meta.amplify
    : Math.max(0, 1 - 0.1 * state.meta.dampening);
  return effect.kind === 'add' ? effect.amount * factor : 1 + (effect.amount - 1) * factor;
}

export interface StatValue {
  add: number;
  mul: number;
}

export type Modifiers = Map<Stat, StatValue>;

function bump(mods: Modifiers, stat: Stat, kind: Effect['kind'], amount: number, times: number) {
  const v = mods.get(stat) ?? { add: 0, mul: 1 };
  if (kind === 'add') v.add += amount * times;
  else v.mul *= Math.pow(amount, times);
  mods.set(stat, v);
}

export function computeModifiers(state: GameState): Modifiers {
  const mods: Modifiers = new Map();
  for (const id of NODE_ORDER) {
    const level = state.nodes[id];
    if (level <= 0) continue;
    const node = NODES[id];
    const times = level * (node.upkeep ? (state.efficiency[id] ?? 1) : 1);
    for (const effect of node.effects) {
      bump(mods, effect.stat, effect.kind, effectiveAmount(state, effect, node.world), times);
    }
  }
  for (const id of JOB_ORDER) {
    const workers = state.jobs[id];
    const job = JOBS[id];
    if (workers <= 0) continue;
    for (const effect of job.effects ?? []) {
      bump(mods, effect.stat, effect.kind, effectiveAmount(state, effect, 'realm'), workers);
    }
  }
  for (const id of META_ORDER) {
    const level = state.meta[id];
    const effects = META[id].effects;
    if (level <= 0 || !effects) continue;
    for (const effect of effects) bump(mods, effect.stat, effect.kind, effect.amount, level);
  }
  return mods;
}

const getAdd = (mods: Modifiers, stat: Stat) => mods.get(stat)?.add ?? 0;
const getMul = (mods: Modifiers, stat: Stat) => mods.get(stat)?.mul ?? 1;

/** What one person in a job produces per second, before multipliers. */
export function jobYield(mods: Modifiers, job: JobId): number {
  const def = JOBS[job];
  return def.baseYield + getAdd(mods, `yield:${def.resource}`);
}

/** What one person in a job actually adds per second, after multipliers. */
export function jobOutput(mods: Modifiers, job: JobId): number {
  const r = JOBS[job].resource;
  return jobYield(mods, job) * getMul(mods, `rate:${r}`) * getMul(mods, `prod:${RESOURCES[r].world}`);
}

/** Gross production per second, before upkeep is paid. */
export function grossRate(state: GameState, mods: Modifiers, resource: ResourceId): number {
  const world = RESOURCES[resource].world;
  let add = getAdd(mods, `rate:${resource}`);
  for (const job of JOB_ORDER) {
    if (JOBS[job].resource === resource) add += state.jobs[job] * jobYield(mods, job);
  }
  if (add <= 0) return 0;
  return add * getMul(mods, `rate:${resource}`) * getMul(mods, `prod:${world}`);
}

/** Upkeep being paid per second right now, at last tick's efficiency. */
export function upkeepRate(state: GameState, resource: ResourceId): number {
  let total = 0;
  for (const id of NODE_ORDER) {
    const node = NODES[id];
    const per = node.upkeep?.[resource];
    if (!per || state.nodes[id] <= 0) continue;
    total += per * state.nodes[id] * (state.efficiency[id] ?? 1);
  }
  return total;
}

export function netRate(state: GameState, mods: Modifiers, resource: ResourceId): number {
  return grossRate(state, mods, resource) - upkeepRate(state, resource);
}

export function clickValue(mods: Modifiers, resource: ResourceId): number {
  const def = RESOURCES[resource];
  if (!def.click) return 0;
  const base = def.click + getAdd(mods, `click:${resource}`);
  return base * getMul(mods, `click:${resource}`) * getMul(mods, `prod:${def.world}`);
}

// ------------------------------------------------------------ cross links

export interface ActiveLink {
  /** The building, tech or job the effect comes from. */
  source: NodeId | JobId;
  sourceName: string;
  /** Levels owned, or workers assigned. */
  count: number;
  from: WorldId;
  to: WorldId;
  effect: Effect;
  /** Combined value across all levels: a sum for `add`, a product for `mul`. */
  total: number;
  helpful: boolean;
  /** Below 1 when the node is starved of upkeep. */
  efficiency: number;
}

export function activeLinks(state: GameState): ActiveLink[] {
  const links: ActiveLink[] = [];
  for (const id of NODE_ORDER) {
    const level = state.nodes[id];
    if (level <= 0) continue;
    const node = NODES[id];
    const efficiency = node.upkeep ? (state.efficiency[id] ?? 1) : 1;
    for (const effect of node.effects) {
      const to = statWorld(effect.stat);
      if (to === node.world) continue;
      const amount = effectiveAmount(state, effect, node.world);
      const times = level * efficiency;
      links.push({
        source: id,
        sourceName: node.name,
        count: level,
        from: node.world,
        to,
        effect,
        total: effect.kind === 'add' ? amount * times : Math.pow(amount, times),
        helpful: isHelpful(effect),
        efficiency,
      });
    }
  }
  // A building that burns another world's resource is a harmful link too.
  for (const id of NODE_ORDER) {
    const level = state.nodes[id];
    const node = NODES[id];
    if (level <= 0 || !node.upkeep) continue;
    const efficiency = state.efficiency[id] ?? 1;
    for (const [r, per] of Object.entries(node.upkeep) as [ResourceId, number][]) {
      const to = RESOURCES[r].world;
      if (to === node.world) continue;
      const effect: Effect = { stat: `rate:${r}`, kind: 'add', amount: -per };
      links.push({
        source: id,
        sourceName: node.name,
        count: level,
        from: node.world,
        to,
        effect,
        total: -per * level * efficiency,
        helpful: false,
        efficiency,
      });
    }
  }
  for (const id of JOB_ORDER) {
    const workers = state.jobs[id];
    if (workers <= 0) continue;
    for (const effect of JOBS[id].effects ?? []) {
      const to = statWorld(effect.stat);
      if (to === 'realm') continue;
      const amount = effectiveAmount(state, effect, 'realm');
      links.push({
        source: id,
        sourceName: JOBS[id].name,
        count: workers,
        from: 'realm',
        to,
        effect,
        total: effect.kind === 'add' ? amount * workers : Math.pow(amount, workers),
        helpful: isHelpful(effect),
        efficiency: 1,
      });
    }
  }
  return links;
}

// ------------------------------------------------------------- population

export function housing(mods: Modifiers): number {
  return POPULATION.baseHousing + getAdd(mods, 'housing');
}

/** People arriving per second while there is free housing. */
export function arrivalRate(mods: Modifiers): number {
  return Math.max(POPULATION.minArrival, POPULATION.arrivalPerHousing * housing(mods));
}

export function assignedWorkers(state: GameState): number {
  return JOB_ORDER.reduce((sum, id) => sum + state.jobs[id], 0);
}

export function idleWorkers(state: GameState): number {
  return Math.max(0, Math.floor(state.population) - assignedWorkers(state));
}

export function isJobAvailable(state: GameState, job: JobId): boolean {
  return (JOBS[job].requires ?? []).every((req) => state.nodes[req] > 0);
}

/** Moves up to `delta` people into (positive) or out of (negative) a job. Returns how many moved. */
export function assignJob(state: GameState, job: JobId, delta: number): number {
  if (delta > 0) {
    if (!isJobAvailable(state, job)) return 0;
    const moved = Math.min(delta, idleWorkers(state));
    state.jobs[job] += moved;
    return moved;
  }
  const moved = Math.min(-delta, state.jobs[job]);
  state.jobs[job] -= moved;
  return -moved;
}

/** Keeps jobs consistent with population and unlocks, taking people off the last jobs first. */
function settleJobs(state: GameState) {
  for (const id of JOB_ORDER) {
    if (!isJobAvailable(state, id)) state.jobs[id] = 0;
  }
  let excess = assignedWorkers(state) - Math.floor(state.population);
  for (const id of [...JOB_ORDER].reverse()) {
    if (excess <= 0) break;
    const take = Math.min(excess, state.jobs[id]);
    state.jobs[id] -= take;
    excess -= take;
  }
}

// ------------------------------------------------------------------ nodes

export function nodeCost(state: GameState, id: NodeId, mods = computeModifiers(state)): Cost {
  const node = NODES[id];
  const scale = Math.pow(node.costGrowth, state.nodes[id]) * getMul(mods, `cost:${node.world}`);
  const cost: Cost = {};
  for (const [r, base] of Object.entries(node.baseCost) as [ResourceId, number][]) {
    cost[r] = base * scale;
  }
  return cost;
}

export function maxLevel(id: NodeId): number {
  const node = NODES[id];
  return node.kind === 'tech' ? 1 : (node.maxLevel ?? Infinity);
}

/** Total building levels owned in a world. */
export function buildingCount(state: GameState, world: WorldId): number {
  return NODE_ORDER.filter((id) => NODES[id].world === world && NODES[id].kind === 'building').reduce(
    (sum, id) => sum + state.nodes[id],
    0,
  );
}

/** The node's world is open and every prerequisite is met. */
export function isNodeAvailable(state: GameState, id: NodeId): boolean {
  const node = NODES[id];
  if (!isWorldUnlocked(state, node.world)) return false;
  if (node.requiresBuildings && buildingCount(state, node.world) < node.requiresBuildings) return false;
  return (node.requires ?? []).every((req) => state.nodes[req] > 0);
}

export function canAfford(state: GameState, cost: Cost): boolean {
  return (Object.entries(cost) as [ResourceId, number][]).every(([r, n]) => state.resources[r] >= n);
}

export function canBuyNode(state: GameState, id: NodeId): boolean {
  return (
    isNodeAvailable(state, id) &&
    state.nodes[id] < maxLevel(id) &&
    canAfford(state, nodeCost(state, id))
  );
}

export function buyNode(state: GameState, id: NodeId): boolean {
  if (!canBuyNode(state, id)) return false;
  const cost = nodeCost(state, id);
  for (const [r, n] of Object.entries(cost) as [ResourceId, number][]) {
    state.resources[r] -= n;
  }
  state.nodes[id] += 1;
  const opens = NODES[id].unlocksWorld;
  if (opens && !isWorldUnlocked(state, opens)) {
    state.unlockedWorlds.push(opens);
    applyHeadStart(state, opens);
  }
  return true;
}

// ------------------------------------------------------------------- time

function gain(state: GameState, resource: ResourceId, amount: number) {
  if (amount <= 0) return;
  state.resources[resource] += amount;
  const def = RESOURCES[resource];
  state.runEarned[def.world] += amount * def.value;
}

export function click(state: GameState, resource: ResourceId): number {
  const def = RESOURCES[resource];
  if (!def.click || !isWorldUnlocked(state, def.world)) return 0;
  const amount = clickValue(computeModifiers(state), resource);
  gain(state, resource, amount);
  return amount;
}

function step(state: GameState, dt: number) {
  settleJobs(state);

  // 1. Pay upkeep. A node that can only partly pay runs at that fraction this step.
  //    Production this step counts as available, so a converter fed by an equal
  //    generator runs at full speed from an empty stockpile.
  const before = computeModifiers(state);
  for (const id of NODE_ORDER) {
    const node = NODES[id];
    const level = state.nodes[id];
    if (!node.upkeep || level <= 0) continue;
    let fraction = 1;
    for (const [r, per] of Object.entries(node.upkeep) as [ResourceId, number][]) {
      const need = per * level * dt;
      const available = state.resources[r] + grossRate(state, before, r) * dt;
      if (need > 0) fraction = Math.min(fraction, Math.max(0, available / need));
    }
    for (const [r, per] of Object.entries(node.upkeep) as [ResourceId, number][]) {
      state.resources[r] -= per * level * dt * fraction;
    }
    state.efficiency[id] = fraction;
  }

  // 2. Produce, using this step's efficiencies.
  const mods = computeModifiers(state);
  for (const r of RESOURCE_ORDER) {
    if (!isWorldUnlocked(state, RESOURCES[r].world)) continue;
    gain(state, r, grossRate(state, mods, r) * dt);
    if (state.resources[r] < 0) state.resources[r] = 0;
  }

  // 3. New people move into free housing, eating Food as they arrive.
  const cap = housing(mods);
  if (state.population < cap) {
    let arriving = Math.min(cap - state.population, arrivalRate(mods) * dt);
    arriving = Math.min(arriving, state.resources.food / POPULATION.foodPerPerson);
    state.population += arriving;
    state.resources.food -= arriving * POPULATION.foodPerPerson;
  }
}

/** Why nobody is moving in right now, if nobody is. */
export function arrivalBlocker(state: GameState, mods: Modifiers): 'housing' | 'food' | null {
  if (state.population >= housing(mods)) return 'housing';
  if (state.resources.food < 1e-9) return 'food';
  return null;
}

/** Advances the game by `seconds`, in steps of at most one second. */
export function tick(state: GameState, seconds: number): void {
  let left = Math.max(0, seconds);
  while (left > 1e-9) {
    const dt = Math.min(MAX_STEP_SECONDS, left);
    step(state, dt);
    left -= dt;
  }
}

// ----------------------------------------------------------- resets, meta

export function echoGain(state: GameState, world: WorldId): number {
  const base = Math.sqrt(state.runEarned[world] / 500);
  return Math.floor(base * (1 + 0.1 * state.meta.attunement));
}

function techValue(id: NodeId): number {
  return (Object.entries(NODES[id].baseCost) as [ResourceId, number][]).reduce(
    (sum, [r, n]) => sum + n * RESOURCES[r].value,
    0,
  );
}

/** The Lab techs a reset would keep under Retained Knowledge: the most valuable owned ones. */
export function retainedTechs(state: GameState): NodeId[] {
  const keep = state.meta.retainedKnowledge;
  if (keep <= 0) return [];
  return NODE_ORDER.filter((id) => NODES[id].kind === 'tech' && state.nodes[id] > 0)
    .sort((a, b) => techValue(b) - techValue(a))
    .slice(0, keep);
}

const HEAD_START_META: Record<WorldId, MetaId> = {
  realm: 'headStartRealm',
  arcana: 'headStartArcana',
  lab: 'headStartLab',
};

export function applyHeadStart(state: GameState, world: WorldId): void {
  const count = 2 * state.meta[HEAD_START_META[world]];
  for (const id of WORLDS[world].headStartNodes) {
    state.nodes[id] = Math.max(state.nodes[id], count);
  }
}

/**
 * Wipes one world's resources and nodes (so every link it sends out disappears),
 * pays Echoes for the run, and restarts it with any Head Start. Other worlds are
 * untouched and opened worlds stay open.
 */
export function resetWorld(state: GameState, world: WorldId): number {
  if (!isWorldUnlocked(state, world)) return 0;
  const reward = echoGain(state, world);
  const keep = world === 'lab' ? new Set(retainedTechs(state)) : new Set<NodeId>();
  state.echoes += reward;
  state.totalEchoes += reward;
  state.resets[world] += 1;
  state.runEarned[world] = 0;
  for (const r of RESOURCE_ORDER) {
    if (RESOURCES[r].world === world) state.resources[r] = 0;
  }
  for (const id of NODE_ORDER) {
    if (NODES[id].world !== world || keep.has(id)) continue;
    state.nodes[id] = 0;
    delete state.efficiency[id];
  }
  if (world === 'realm') {
    state.population = POPULATION.start;
    for (const id of JOB_ORDER) state.jobs[id] = 0;
  }
  applyHeadStart(state, world);
  return reward;
}

export function metaCost(state: GameState, id: MetaId): number {
  const def = META[id];
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, state.meta[id]));
}

export function canBuyMeta(state: GameState, id: MetaId): boolean {
  const def = META[id];
  if (state.meta[id] >= (def.maxLevel ?? Infinity)) return false;
  return state.echoes >= metaCost(state, id);
}

export function buyMeta(state: GameState, id: MetaId): boolean {
  if (!canBuyMeta(state, id)) return false;
  state.echoes -= metaCost(state, id);
  state.meta[id] += 1;
  for (const world of WORLD_ORDER) {
    if (HEAD_START_META[world] === id && isWorldUnlocked(state, world)) applyHeadStart(state, world);
  }
  return true;
}

/** Whether a resource should be shown yet. */
export function isResourceRevealed(state: GameState, resource: ResourceId): boolean {
  const def = RESOURCES[resource];
  if (!isWorldUnlocked(state, def.world)) return false;
  return !def.revealedBy || state.nodes[def.revealedBy] > 0 || state.resources[resource] > 0;
}
