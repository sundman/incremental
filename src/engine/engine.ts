import {
  ACHIEVEMENTS,
  ACHIEVEMENT_ORDER,
  BUILD_TIME_GROWTH,
  DEMONS,
  DEPOSITS,
  LAND,
  DEPOSIT_GROWTH_PER_LEVEL,
  DEPOSIT_ORDER,
  JOBS,
  JOB_ORDER,
  META,
  META_ORDER,
  NODES,
  NODE_ORDER,
  POPULATION,
  RESOURCES,
  RESOURCE_ORDER,
  TIER_SECONDS,
  WORLDS,
  WORLD_ORDER,
} from './content';
import { randomArrival, randomName } from './names';
import type { Cost, DepositId, Effect, GameState, JobId, LogEntry, MetaId, NodeId, ResourceId, Stat, WorldId } from './types';

/**
 * 2: Stone and Clay deposits start empty and grow with each Quarry and Clay Pit.
 * 3: Coal does too, with each Coal Mine, and Iron and Gold become deposits opened by their mines.
 * 4: Rich Earth only grows the forest.
 */
export const SAVE_VERSION = 4;

/** How many chronicle lines are kept. */
export const LOG_LIMIT = 50;

/** Adds a line to the chronicle, dropping the oldest past `LOG_LIMIT`. */
/** Someone died: counts them for this Realm run and writes it in the chronicle. */
function recordDeath(state: GameState, text: string) {
  state.runDeaths += 1;
  addLog(state, text, 'death');
}

export function addLog(state: GameState, text: string, kind: LogEntry['kind'] = 'death') {
  state.log.push({ time: Date.now(), text, kind });
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
}

/** One worker of a job, e.g. "Miner" from "Miners". */
export function jobWorker(job: JobId): string {
  return JOBS[job].name.replace(/s$/, '');
}

/** Longest slice of time simulated in one step, so upkeep and unlocks stay accurate. */
const MAX_STEP_SECONDS = 1;

// ------------------------------------------------------------------ state

export function createInitialState(): GameState {
  const zeroes = <K extends string>(keys: readonly K[]) =>
    Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const state: GameState = {
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
    activeSpells: [],
    switchedOff: [],
    deposits: Object.fromEntries(
      DEPOSIT_ORDER.map((d) => [d, { left: DEPOSITS[d].start, max: DEPOSITS[d].start, cut: 0 }]),
    ) as GameState['deposits'],
    demons: 0,
    construction: {},
    efficiency: {},
    overflow: {},
    researching: null,
    researchProgress: {},
    achievements: [],
    runDeaths: 0,
    hunger: 0,
    log: [],
  };
  state.resources.food = POPULATION.startFood;
  return state;
}

/** People a Realm run starts with: the usual, plus what achievements add. */
export function startPopulation(state: GameState): number {
  return state.achievements.reduce((n, id) => n + (ACHIEVEMENTS[id].startPeople ?? 0), POPULATION.start);
}

/** Marks every achievement whose goal is met, once, and writes it in the chronicle. */
export function checkAchievements(state: GameState) {
  const mods = computeModifiers(state);
  for (const id of ACHIEVEMENT_ORDER) {
    if (state.achievements.includes(id)) continue;
    const [current, target] = ACHIEVEMENTS[id].progress(state, mods);
    if (target <= 0 || current < target) continue;
    state.achievements.push(id);
    growDeposits(state, ACHIEVEMENTS[id].effects ?? []);
    addLog(state, `Achievement: ${ACHIEVEMENTS[id].name}! ${ACHIEVEMENTS[id].reward}`, 'achievement');
  }
}

export function isWorldUnlocked(state: GameState, world: WorldId): boolean {
  return state.unlockedWorlds.includes(world);
}

// -------------------------------------------------------------- modifiers

/** The world a stat belongs to, used to tell local effects from cross-world links. */
export function statWorld(stat: Stat): WorldId {
  if (
    stat === 'housing' ||
    stat === 'land' ||
    stat === 'growth' ||
    stat === 'crowding' ||
    stat === 'pollution' ||
    stat.startsWith('regrow:') ||
    stat.startsWith('size:') ||
    stat === 'deaths' ||
    stat === 'accidents' ||
    stat === 'starvation'
  ) {
    return 'realm';
  }
  if (stat.startsWith('speed:')) return stat.slice('speed:'.length) as WorldId;
  if (stat.startsWith('storage:')) return stat.slice('storage:'.length) as WorldId;
  if (stat.startsWith('decay:')) return stat.slice('decay:'.length) as WorldId;
  const [type, target] = stat.split(':') as [string, string];
  if (type === 'rate' || type === 'yield' || type === 'cap') return RESOURCES[target as ResourceId].world;
  return target as WorldId;
}

/** Whether an effect makes things better for the world it targets. */
export function isHelpful(effect: Effect): boolean {
  const lowerIsBetter =
    effect.stat.startsWith('cost:') ||
    effect.stat === 'deaths' ||
    effect.stat === 'accidents' ||
    effect.stat === 'starvation' ||
    effect.stat.startsWith('decay:') ||
    effect.stat === 'crowding' ||
    effect.stat === 'pollution';
  const increases = effect.kind === 'add' ? effect.amount > 0 : effect.amount > 1;
  return lowerIsBetter ? !increases : increases;
}

/**
 * Scales a cross-world effect by the Amplify / Dampening meta upgrades.
 * Local effects are only scaled by `scaleBy`.
 */
export function effectiveAmount(state: GameState, effect: Effect, sourceWorld: WorldId): number {
  const base = scaledAmount(state, effect);
  if (statWorld(effect.stat) === sourceWorld) return base;
  const factor = isHelpful(effect)
    ? 1 + 0.1 * state.meta.amplify
    : Math.max(0, 1 - 0.1 * state.meta.dampening);
  return effect.kind === 'add' ? base * factor : Math.max(0, 1 + (base - 1) * factor);
}

/** An effect's amount after `scaleBy`: stronger with each level of its node beyond the first. */
export function scaledAmount(state: GameState, effect: Effect): number {
  if (!effect.scaleBy) return effect.amount;
  const strength = 1 + effect.scaleBy.perLevel * Math.max(0, state.nodes[effect.scaleBy.node] - 1);
  return effect.kind === 'add' ? effect.amount * strength : Math.max(0, 1 + (effect.amount - 1) * strength);
}

export interface StatValue {
  add: number;
  mul: number;
}

export type Modifiers = Map<Stat, StatValue>;

/** Combined value of an effect applied `times` times: a sum for `add`, a product for `mul`. */
function combined(effect: Effect, amount: number, times: number): number {
  if (effect.kind === 'add') return amount * times;
  return effect.linear ? 1 + (amount - 1) * times : Math.pow(amount, times);
}

function bump(mods: Modifiers, effect: Effect, amount: number, times: number) {
  const v = mods.get(effect.stat) ?? { add: 0, mul: 1 };
  if (effect.kind === 'add') v.add += combined(effect, amount, times);
  else v.mul *= combined(effect, amount, times);
  mods.set(effect.stat, v);
}

export function isSpellActive(state: GameState, id: NodeId): boolean {
  return state.activeSpells.includes(id);
}

/**
 * Levels whose effects and upkeep apply right now: a switched-off spell counts as 0,
 * and a horde spell counts its demons.
 */
export function runningLevel(state: GameState, id: NodeId): number {
  if (NODES[id].spell && !isSpellActive(state, id)) return 0;
  if (state.switchedOff.includes(id)) return 0;
  if (NODES[id].horde) return state.demons;
  return state.nodes[id];
}

/** Buildings that consume resources every second can be switched off and on. */
export function canSwitchOff(id: NodeId): boolean {
  const node = NODES[id];
  return node.kind === 'building' && !node.spell && !!node.upkeep;
}

export function isSwitchedOff(state: GameState, id: NodeId): boolean {
  return state.switchedOff.includes(id);
}

/** Switches a consuming building off or back on. Returns whether it is now running. */
export function toggleBuilding(state: GameState, id: NodeId): boolean {
  if (!canSwitchOff(id)) return true;
  if (isSwitchedOff(state, id)) {
    state.switchedOff = state.switchedOff.filter((s) => s !== id);
    return true;
  }
  state.switchedOff.push(id);
  return false;
}

/** Whether a learned spell can be cast now. A horde needs more people than it leaves alive. */
/** How many spells can be on at once (Multicast in the Echo shop adds more). */
export function spellSlots(state: GameState): number {
  return 1 + state.meta.multicast;
}

/** Spells taking up a slot. Summon Demons doesn't count. */
function slottedSpells(state: GameState): NodeId[] {
  return state.activeSpells.filter((id) => !NODES[id].horde);
}

/** The spell that casting another would switch off to make room, if the slots are full. */
export function spellToReplace(state: GameState): NodeId | null {
  const slotted = slottedSpells(state);
  return slotted.length >= spellSlots(state) ? (slotted[0] ?? null) : null;
}

/**
 * Whether a learned spell can be cast now. When the slots are full, casting swaps out
 * the oldest spell. A horde takes no slot, but needs people to feed on.
 */
export function canCastSpell(state: GameState, id: NodeId): boolean {
  const node = NODES[id];
  if (!node.spell || state.nodes[id] <= 0 || isSpellActive(state, id)) return false;
  return !node.horde || state.population > DEMONS.survivors;
}

/** Switches a learned spell on or off. A horde spell can't be switched off. Returns whether it is now on. */
export function toggleSpell(state: GameState, id: NodeId): boolean {
  if (!NODES[id].spell || state.nodes[id] <= 0) return false;
  if (isSpellActive(state, id)) {
    if (NODES[id].horde) return true;
    state.activeSpells = state.activeSpells.filter((s) => s !== id);
    delete state.efficiency[id];
    return false;
  }
  if (!canCastSpell(state, id)) return false;
  const replaced = NODES[id].horde ? null : spellToReplace(state);
  if (replaced) {
    state.activeSpells = state.activeSpells.filter((s) => s !== replaced);
    delete state.efficiency[replaced];
  }
  state.activeSpells.push(id);
  if (NODES[id].horde) state.demons = DEMONS.start;
  return true;
}

export function isHordeActive(state: GameState): boolean {
  return state.activeSpells.some((id) => NODES[id].horde);
}

/** The horde is done: it vanishes and the spell switches itself off. */
function endHorde(state: GameState) {
  state.activeSpells = state.activeSpells.filter((id) => !NODES[id].horde);
  state.demons = 0;
}

export function computeModifiers(state: GameState): Modifiers {
  const mods: Modifiers = new Map();
  for (const id of NODE_ORDER) {
    const level = runningLevel(state, id);
    if (level <= 0) continue;
    const node = NODES[id];
    const times = level * (node.upkeep ? (state.efficiency[id] ?? 1) : 1);
    for (const effect of node.effects) {
      bump(mods, effect, effectiveAmount(state, effect, node.world), times);
    }
  }
  for (const id of JOB_ORDER) {
    const workers = state.jobs[id];
    const job = JOBS[id];
    if (workers <= 0) continue;
    for (const effect of job.effects ?? []) {
      bump(mods, effect, effectiveAmount(state, effect, 'realm'), workers);
    }
  }
  for (const id of META_ORDER) {
    const level = state.meta[id];
    const effects = META[id].effects;
    if (level <= 0 || !effects) continue;
    for (const effect of effects) bump(mods, effect, effect.amount, level);
  }
  for (const id of state.achievements) {
    for (const effect of ACHIEVEMENTS[id].effects ?? []) bump(mods, effect, effect.amount, 1);
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
  const rate = add * getMul(mods, `rate:${resource}`) * getMul(mods, `prod:${world}`);
  // A deposit can only be worked as fast as it holds out (steps are at most one second).
  return isDeposit(resource) ? Math.min(rate, state.deposits[resource].left + depositRegrowth(mods, resource)) : rate;
}

/** How much of a resource can be stored; Infinity for resources without a storage limit. */
export function resourceCap(mods: Modifiers, resource: ResourceId): number {
  const { baseCap: base, world } = RESOURCES[resource];
  if (base === undefined) return Infinity;
  const storage = `storage:${world}` as const;
  const add = base * getAdd(mods, storage) + getAdd(mods, `cap:${resource}`);
  return Math.max(0, (base + add) * getMul(mods, `cap:${resource}`) * getMul(mods, storage));
}

/** Whether production was thrown away last tick because the resource's storage was full. */
export function isOverflowing(state: GameState, resource: ResourceId): boolean {
  return (state.overflow[resource] ?? 0) > 1e-9;
}

/** Whether a resource is at its storage limit, so any more made is lost. */
export function isAtCap(state: GameState, mods: Modifiers, resource: ResourceId): boolean {
  return state.resources[resource] >= resourceCap(mods, resource) - 1e-9;
}

/**
 * Why some of a job's workers are making nothing right now, or null if they all help:
 * - `full`: their resource's storage is full and still filling up, so what they make is lost;
 * - `depleted`: their deposit is used up and more of them are assigned than its regrowth can keep busy.
 */
export function wastedWorkers(state: GameState, mods: Modifiers, job: JobId): 'full' | 'depleted' | null {
  const workers = state.jobs[job];
  if (workers <= 0) return null;
  const resource = JOBS[job].resource;
  // Judged by what was actually thrown away last tick: Warehouse spoilage keeps a full store a hair under its cap.
  if (isOverflowing(state, resource)) return 'full';
  if (isDeposit(resource) && state.deposits[resource].left < 1) {
    const each = jobOutput(mods, job);
    const needed = each > 0 ? Math.ceil(depositRegrowth(mods, resource) / each - 1e-9) : 0;
    if (workers > needed) return 'depleted';
  }
  return null;
}

/** The first resource in a cost that is more than can ever be stored, so storage must grow first. */
export function costOverCap(cost: Cost, mods: Modifiers): ResourceId | null {
  for (const [r, n] of Object.entries(cost) as [ResourceId, number][]) {
    if (n > resourceCap(mods, r) + 1e-9) return r;
  }
  return null;
}

export function isDeposit(resource: ResourceId): resource is DepositId {
  return resource in DEPOSITS;
}

/** How fast a deposit refills per second. Pollution slows the forest's regrowth. */
export function depositRegrowth(mods: Modifiers, deposit: DepositId): number {
  const def = DEPOSITS[deposit];
  const rate = Math.max(0, (def.baseRegrow + getAdd(mods, `regrow:${deposit}`)) * getMul(mods, `regrow:${deposit}`));
  return def.pollutionSlows ? rate * pollutionFactor(mods) : rate;
}

/** The most a deposit can hold right now: its size this run, less what buildings took (Quarries clear forest). */
export function depositMax(state: GameState, mods: Modifiers, deposit: DepositId): number {
  return Math.max(0, (state.deposits[deposit].max + getAdd(mods, `size:${deposit}`)) * getMul(mods, `size:${deposit}`));
}

/** Share of what was gathered that deposits grow by on a Realm reset (Rich Earth in the Echo shop). */
export function depositGrowthPerReset(state: GameState): number {
  return DEPOSIT_GROWTH_PER_LEVEL * state.meta.richEarth;
}

/** How big a deposit will be after the next Realm reset. */
export function nextDepositMax(state: GameState, deposit: DepositId): number {
  const d = state.deposits[deposit];
  // Rich Earth only grows the forest; the other deposits are opened up by buildings instead.
  return deposit === 'wood' ? d.max + depositGrowthPerReset(state) * d.cut : d.max;
}

/** Upkeep being paid per second right now, at last tick's efficiency. */
export function upkeepRate(state: GameState, resource: ResourceId): number {
  let total = 0;
  for (const id of NODE_ORDER) {
    const node = NODES[id];
    const per = node.upkeep?.[resource];
    const level = runningLevel(state, id);
    if (!per || level <= 0) continue;
    total += per * level * (state.efficiency[id] ?? 1);
  }
  return total;
}

/** Net change per second, including the Food that people moving in eat. */
export function netRate(state: GameState, mods: Modifiers, resource: ResourceId): number {
  let net = grossRate(state, mods, resource) - upkeepRate(state, resource);
  if (resource === 'food') {
    net -= eatingRate(state);
    net -= arrivalFoodRate(state, mods, net);
  }
  return net - decayRate(state, mods, resource);
}

/** Food the Realm's people eat per second. */
export function eatingRate(state: GameState): number {
  return Math.floor(state.population) * POPULATION.foodPerSecond;
}

/** People starving to death per second while nobody gets fed; Wells slow it. */
export function starvationRate(mods: Modifiers): number {
  return POPULATION.starvationRate * getMul(mods, 'starvation');
}

/** Whether people are going hungry right now: the stores are empty and what comes in does not feed everyone. */
export function isStarving(state: GameState, mods: Modifiers): boolean {
  return state.resources.food < 1e-9 && grossRate(state, mods, 'food') - upkeepRate(state, 'food') < eatingRate(state) - 1e-9;
}

/**
 * How much of a resource spoils per second: only what is kept in Warehouses (above the starting
 * capacity) decays, and each Warehouse makes all of it decay faster.
 */
export function decayRate(state: GameState, mods: Modifiers, resource: ResourceId): number {
  const { baseCap, world } = RESOURCES[resource];
  if (baseCap === undefined) return 0;
  const share = getAdd(mods, `decay:${world}`);
  return share > 0 ? Math.max(0, state.resources[resource] - baseCap) * share : 0;
}

/** Food eaten per second by people moving into free housing right now. */
export function arrivalFoodRate(
  state: GameState,
  mods: Modifiers,
  foodIncome = grossRate(state, mods, 'food') - upkeepRate(state, 'food') - eatingRate(state),
): number {
  if (state.population >= housing(mods)) return 0;
  const wanted = arrivalRate(mods) * POPULATION.foodPerPerson;
  // With empty stores, newcomers can only eat what comes in.
  return state.resources.food > 1e-9 ? wanted : Math.min(wanted, Math.max(0, foodIncome));
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
    const level = runningLevel(state, id);
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
        total: combined(effect, amount, times),
        helpful: isHelpful(effect),
        efficiency,
      });
    }
  }
  // A building that burns another world's resource is a harmful link too.
  for (const id of NODE_ORDER) {
    const level = runningLevel(state, id);
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

/** How crowded the Realm's homes are, after sanitation. */
export function crowding(mods: Modifiers): number {
  return Math.max(0, getAdd(mods, 'crowding')) * getMul(mods, 'crowding');
}

/** The share of growth left after crowding (1 = no slowdown). */
export function crowdingFactor(mods: Modifiers): number {
  return 1 / (1 + POPULATION.crowdingPenalty * crowding(mods));
}

/** How polluted the Realm is, after parks and filters. */
export function pollution(mods: Modifiers): number {
  return Math.max(0, getAdd(mods, 'pollution')) * getMul(mods, 'pollution');
}

/** The share of growth left after pollution (1 = no slowdown). */
export function pollutionFactor(mods: Modifiers): number {
  return 1 / (1 + POPULATION.pollutionPenalty * pollution(mods));
}

/** People arriving per second while there is free housing. */
export function arrivalRate(mods: Modifiers): number {
  const growth = (POPULATION.baseGrowth + getAdd(mods, 'growth')) * getMul(mods, 'growth');
  return Math.max(0, growth * crowdingFactor(mods) * pollutionFactor(mods));
}

/** People killed per second (e.g. by summoned demons). */
export function deathRate(mods: Modifiers): number {
  return (Math.max(0, getAdd(mods, 'deaths')) * getMul(mods, 'deaths')) / 3600;
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
let random: () => number = Math.random;

/** Replaces the random source (for tests). Returns the previous one. */
export function setRandom(source: () => number): () => number {
  const previous = random;
  random = source;
  return previous;
}

/** Work accidents roll their own dice, so tests can switch them off without upsetting other picks. */
let accidentRandom: () => number = Math.random;

/** Replaces the random source for work accidents (for tests). Returns the previous one. */
export function setAccidentRandom(source: () => number): () => number {
  const previous = accidentRandom;
  accidentRandom = source;
  return previous;
}

/** Chance per hour that one worker in a job dies in an accident; Medicine and Healing Light lower it. */
export function accidentChance(mods: Modifiers, job: JobId): number {
  return JOBS[job].accidentsPerHour * getMul(mods, 'deaths') * getMul(mods, 'accidents');
}

/** Workers expected to die in accidents per hour, across every job. */
export function accidentRate(state: GameState, mods: Modifiers): number {
  return JOB_ORDER.reduce((sum, id) => sum + state.jobs[id] * accidentChance(mods, id), 0);
}

/** Each worker has a small chance of dying at work this step. Returns how many died. */
function workAccidents(state: GameState, mods: Modifiers, dt: number): number {
  let died = 0;
  for (const id of JOB_ORDER) {
    const chance = (accidentChance(mods, id) / 3600) * dt;
    if (chance <= 0) continue;
    let dead = 0;
    for (let i = 0; i < state.jobs[id]; i++) if (accidentRandom() < chance) dead++;
    state.jobs[id] -= dead;
    for (let i = 0; i < dead; i++) recordDeath(state, `${randomName()} the ${jobWorker(id)} ${JOBS[id].accidentText}.`);
    died += dead;
  }
  state.population = Math.max(0, state.population - died);
  return died;
}

/**
 * Lowers the population. While anyone is idle, an idle person steps into the dead
 * one's job, so the idle pool shrinks first. After that each death is a random worker.
 */
/**
 * Kills people until the Realm is down to `population`. Idle people die first, then a
 * random worker or, when `scholarsToo`, a Scholar. A Scholar lives in the Lab, so killing
 * one spares a Realm person.
 */
/**
 * Kills people down to `population`: the idle first, then random workers or, when
 * `scholarsToo`, Scholars. `how` finishes each chronicle line, e.g. "starved to death".
 */
function losePeople(state: GameState, population: number, scholarsToo = true, how = 'was dragged off by demons') {
  let people = Math.floor(state.population);
  const deaths = people - Math.floor(population);
  state.population = population;
  for (let i = 0; i < deaths; i++) {
    const workers = assignedWorkers(state);
    if (people > workers) {
      people--;
      recordDeath(state, `${randomName()} ${how}.`);
      continue;
    }
    const scholars = scholarsToo ? state.nodes.scholar : 0;
    let pick = Math.floor(random() * (workers + scholars));
    if (pick >= workers) {
      state.nodes.scholar -= 1;
      state.population += 1;
      recordDeath(state, `${randomName()} the Scholar was hunted down by demons in the Lab.`);
      continue;
    }
    people--;
    for (const id of JOB_ORDER) {
      if (pick < state.jobs[id]) {
        state.jobs[id] -= 1;
        recordDeath(state, `${randomName()} the ${jobWorker(id)} ${how}.`);
        break;
      }
      pick -= state.jobs[id];
    }
  }
}

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
  const level = state.nodes[id];
  // A ladder of costs (each Warehouse needs finer materials) climbs a rung per level, then grows from the top one.
  const ladder = node.levelCosts;
  const rung = ladder && level > 0 ? Math.min(level, ladder.length) : 0;
  const base = rung > 0 ? ladder![rung - 1]! : node.baseCost;
  const scale = Math.pow(node.costGrowth, level - rung) * getMul(mods, `cost:${node.world}`);
  const cost: Cost = {};
  for (const [r, amount] of Object.entries(base) as [ResourceId, number][]) {
    cost[r] = amount * scale;
  }
  return cost;
}

export function maxLevel(id: NodeId): number {
  const node = NODES[id];
  return node.maxLevel ?? (node.kind === 'tech' ? 1 : Infinity);
}

/** Squares of land the Realm has to build on. */
export function land(state: GameState, mods = computeModifiers(state)): number {
  return LAND.base + getAdd(mods, 'land');
}

/** Squares taken: one per Realm building level, counting levels under construction. */
export function landUsed(state: GameState): number {
  return NODE_ORDER.filter((id) => NODES[id].world === 'realm' && NODES[id].kind === 'building').reduce(
    (sum, id) => sum + state.nodes[id] + (isUnderConstruction(state, id) ? 1 : 0),
    0,
  );
}

/** Whether a node needs a free square and none is left. */
export function needsLand(state: GameState, id: NodeId, mods = computeModifiers(state)): boolean {
  const node = NODES[id];
  return node.world === 'realm' && node.kind === 'building' && landUsed(state) >= land(state, mods);
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

/**
 * Whether a Lab tech belongs in the research list: every tech it builds on is researched,
 * and it can still be researched (again). The full tree is shown separately.
 */
export function isResearchListed(state: GameState, id: NodeId): boolean {
  const node = NODES[id];
  if (node.kind !== 'tech' || node.world !== 'lab' || !isWorldUnlocked(state, 'lab')) return false;
  if (state.researching === id) return true;
  if (state.nodes[id] >= maxLevel(id)) return false;
  return (node.requires ?? []).every((req) => NODES[req].kind !== 'tech' || state.nodes[req] > 0);
}

/** Whether a building card is shown: only once everything it requires is unlocked (or you already have one). */
export function isBuildingListed(state: GameState, id: NodeId): boolean {
  const node = NODES[id];
  if (node.kind !== 'building') return false;
  if (state.nodes[id] > 0 || !!state.construction[id] || isNodeAvailable(state, id)) return true;
  // A building gated by research from another world (a House needs Housing) stays listed once that
  // research is done, even while its own world's buildings are still missing, e.g. after a reset:
  // its card then says what else to build.
  const researched = (node.requires ?? []).some((req) => NODES[req].world !== node.world);
  return researched && isWorldUnlocked(state, node.world) && isReachable(state, id, new Map());
}

/** Whether a node could be built by building up its own world: everything it needs from other worlds is done. */
function isReachable(state: GameState, id: NodeId, known: Map<NodeId, boolean>): boolean {
  if (state.nodes[id] > 0) return true;
  const cached = known.get(id);
  if (cached !== undefined) return cached;
  known.set(id, false); // guards against a requirement loop while this one is worked out
  const node = NODES[id];
  const reachable = (node.requires ?? []).every((req) =>
    NODES[req].world === node.world ? isReachable(state, req, known) : state.nodes[req] > 0,
  );
  known.set(id, reachable);
  return reachable;
}

/** Lab techs by column in the research tree: a tech sits one column right of its deepest Lab prerequisite. */
export function researchTreeColumns(): NodeId[][] {
  const depth = new Map<NodeId, number>();
  const depthOf = (id: NodeId): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    const reqs = (NODES[id].requires ?? []).filter((r) => NODES[r].world === 'lab' && NODES[r].kind === 'tech');
    const d = reqs.length ? 1 + Math.max(...reqs.map(depthOf)) : 0;
    depth.set(id, d);
    return d;
  };
  const columns: NodeId[][] = [];
  for (const id of NODE_ORDER) {
    const node = NODES[id];
    if (node.world !== 'lab' || node.kind !== 'tech') continue;
    (columns[depthOf(id)] ??= []).push(id);
  }
  return columns;
}

export function canAfford(state: GameState, cost: Cost): boolean {
  return (Object.entries(cost) as [ResourceId, number][]).every(([r, n]) => state.resources[r] >= n);
}

export function isUnderConstruction(state: GameState, id: NodeId): boolean {
  return state.construction[id] !== undefined;
}

/** How many things a world can build, discover or research at once. */
export function buildSlots(state: GameState): number {
  return 1 + state.meta.masterBuilders;
}

/** Things under construction in a world right now. */
export function activeBuilds(state: GameState, world: WorldId): number {
  return NODE_ORDER.filter((id) => NODES[id].world === world && isUnderConstruction(state, id)).length;
}

export function hasFreeBuildSlot(state: GameState, world: WorldId): boolean {
  return activeBuilds(state, world) < buildSlots(state);
}

/** Whether buying a level needs more idle Realm people than there are. */
export function needsPeople(state: GameState, id: NodeId): boolean {
  return idleWorkers(state) < (NODES[id].people ?? 0);
}

export function canBuyNode(state: GameState, id: NodeId): boolean {
  return (
    !isResearch(id) &&
    isNodeAvailable(state, id) &&
    !isUnderConstruction(state, id) &&
    hasFreeBuildSlot(state, NODES[id].world) &&
    !needsLand(state, id) &&
    !needsPeople(state, id) &&
    state.nodes[id] < maxLevel(id) &&
    canAfford(state, nodeCost(state, id))
  );
}

/** Build speed in a world: 1 is normal, 2 builds twice as fast. */
export function buildSpeed(mods: Modifiers, world: WorldId): number {
  return getMul(mods, `speed:${world}`);
}

/** Work needed for the next level of a node, in base seconds (before build speed). */
export function baseBuildSeconds(state: GameState, id: NodeId): number {
  return TIER_SECONDS[NODES[id].tier] * Math.pow(BUILD_TIME_GROWTH, state.nodes[id]);
}

/** Real seconds the next level would take to build at the current build speed. */
export function buildSeconds(state: GameState, id: NodeId, mods = computeModifiers(state)): number {
  return baseBuildSeconds(state, id) / buildSpeed(mods, NODES[id].world);
}

/** Real seconds left on a level under construction, or 0. */
export function constructionSecondsLeft(state: GameState, id: NodeId, mods = computeModifiers(state)): number {
  const c = state.construction[id];
  if (!c) return 0;
  return Math.max(0, c.needed - c.done) / buildSpeed(mods, NODES[id].world);
}

/** Pays for the next level and starts building it. The level counts once construction finishes. */
export function buyNode(state: GameState, id: NodeId): boolean {
  if (!canBuyNode(state, id)) return false;
  const cost = nodeCost(state, id);
  for (const [r, n] of Object.entries(cost) as [ResourceId, number][]) {
    state.resources[r] -= n;
  }
  state.population -= NODES[id].people ?? 0;
  state.construction[id] = { done: 0, needed: baseBuildSeconds(state, id) };
  return true;
}

// --------------------------------------------------------------- research

/** Lab techs are researched by streaming Research into them, not built. */
export function isResearch(id: NodeId): boolean {
  return NODES[id].world === 'lab' && NODES[id].kind === 'tech';
}

/** Research the next level of a tech needs in total. */
export function researchNeeded(state: GameState, id: NodeId, mods = computeModifiers(state)): number {
  return nodeCost(state, id, mods).research ?? 0;
}

/** What a tech costs besides Research, paid once when it is first picked. */
export function researchUpfrontCost(state: GameState, id: NodeId, mods = computeModifiers(state)): Cost {
  const cost = nodeCost(state, id, mods);
  delete cost.research;
  return cost;
}

/** Whether a tech's next level is started, so its upfront cost is already paid. */
export function isResearchStarted(state: GameState, id: NodeId): boolean {
  return state.researchProgress[id] !== undefined;
}

export function canStartResearch(state: GameState, id: NodeId): boolean {
  return (
    isResearch(id) &&
    state.researching !== id &&
    isNodeAvailable(state, id) &&
    state.nodes[id] < maxLevel(id) &&
    (isResearchStarted(state, id) || canAfford(state, researchUpfrontCost(state, id)))
  );
}

/**
 * Makes a tech the research target, paying its upfront cost the first time. Research
 * already poured into another tech stays there for when you switch back.
 */
export function startResearch(state: GameState, id: NodeId): boolean {
  if (!canStartResearch(state, id)) return false;
  if (!isResearchStarted(state, id)) {
    for (const [r, n] of Object.entries(researchUpfrontCost(state, id)) as [ResourceId, number][]) {
      state.resources[r] -= n;
    }
    state.researchProgress[id] = 0;
  }
  state.researching = id;
  return true;
}

export function stopResearch(state: GameState) {
  state.researching = null;
}

/** Real seconds until the research target is done at the current rate, or Infinity. */
export function researchSecondsLeft(state: GameState, mods = computeModifiers(state)): number {
  const id = state.researching;
  if (!id) return Infinity;
  const rate = netRate(state, mods, 'research');
  const left = Math.max(0, researchNeeded(state, id, mods) - (state.researchProgress[id] ?? 0));
  return left <= 0 ? 0 : rate > 0 ? left / rate : Infinity;
}

/**
 * Streams the Research made this step into the target. A finished repeatable tech stays
 * the target while its next level costs only Research; anything else leaves no target,
 * and Research made with no target is lost.
 */
function pourResearch(state: GameState) {
  let amount = state.resources.research;
  state.resources.research = 0;
  while (amount > 0 && state.researching) {
    const id = state.researching;
    const need = researchNeeded(state, id);
    const have = state.researchProgress[id] ?? 0;
    if (have + amount < need - 1e-9) {
      state.researchProgress[id] = have + amount;
      return;
    }
    amount -= Math.max(0, need - have);
    delete state.researchProgress[id];
    finishLevel(state, id);
    state.researching = null;
    if (Object.keys(researchUpfrontCost(state, id)).length === 0) startResearch(state, id);
  }
}

/** Finishes a level under construction immediately. */
export function completeConstruction(state: GameState, id: NodeId) {
  if (!state.construction[id]) return;
  delete state.construction[id];
  finishLevel(state, id);
}

/** New deposit size (a Quarry's fresh ground, a bigger forest) is there to be worked at once. */
function growDeposits(state: GameState, effects: Effect[]) {
  for (const effect of effects) {
    if (effect.kind === 'add' && effect.amount > 0 && effect.stat.startsWith('size:')) {
      state.deposits[effect.stat.slice('size:'.length) as DepositId].left += effect.amount;
    }
  }
}

function finishLevel(state: GameState, id: NodeId) {
  state.nodes[id] += 1;
  growDeposits(state, NODES[id].effects);
  const opens = NODES[id].unlocksWorld;
  if (opens && !isWorldUnlocked(state, opens)) {
    state.unlockedWorlds.push(opens);
    applyHeadStart(state, opens);
  }
}

function advanceConstruction(state: GameState, mods: Modifiers, dt: number) {
  for (const id of NODE_ORDER) {
    const c = state.construction[id];
    if (!c) continue;
    c.done += dt * buildSpeed(mods, NODES[id].world);
    if (c.done >= c.needed - 1e-9) completeConstruction(state, id);
  }
}

// ------------------------------------------------------------------- time

/** Adds a resource, and returns how much was actually gained (deposits can run out, storage can be full). */
function gain(state: GameState, mods: Modifiers, resource: ResourceId, amount: number): number {
  amount = Math.min(amount, resourceCap(mods, resource) - state.resources[resource]);
  if (amount <= 0) return 0;
  if (isDeposit(resource)) {
    const d = state.deposits[resource];
    amount = Math.min(amount, d.left);
    d.left -= amount;
    d.cut += amount;
  }
  if (amount <= 0) return 0;
  state.resources[resource] += amount;
  const def = RESOURCES[resource];
  state.runEarned[def.world] += amount * def.value;
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
    const level = runningLevel(state, id);
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

  // 2. Deposits refill, then everything produces, using this step's efficiencies.
  const mods = computeModifiers(state);
  for (const id of DEPOSIT_ORDER) {
    const d = state.deposits[id];
    d.left = Math.min(depositMax(state, mods, id), d.left + depositRegrowth(mods, id) * dt);
  }
  for (const r of RESOURCE_ORDER) {
    if (!isWorldUnlocked(state, RESOURCES[r].world)) continue;
    const made = grossRate(state, mods, r) * dt;
    const room = Math.max(0, resourceCap(mods, r) - state.resources[r]);
    state.overflow[r] = made > room + 1e-9 ? (made - room) / dt : 0;
    gain(state, mods, r, made);
    if (state.resources[r] < 0) state.resources[r] = 0;
    // Goods in Warehouses spoil; the rate is a share of what is there, so it never dips below the starting capacity.
    state.resources[r] -= decayRate(state, mods, r) * dt;
  }
  pourResearch(state);

  // 3. Construction progresses.
  advanceConstruction(state, mods, dt);

  // 4. Everyone eats. Whatever share goes unfed brings the next death by starvation closer.
  const hungry = eatingRate(state) * dt;
  if (hungry > 0) {
    const eaten = Math.min(hungry, state.resources.food);
    state.resources.food -= eaten;
    const unfed = 1 - eaten / hungry;
    if (unfed > 1e-9 && state.population >= POPULATION.starvationSurvivors + 1) {
      state.hunger += unfed * starvationRate(mods) * dt;
      while (state.hunger >= 1 && state.population >= POPULATION.starvationSurvivors + 1) {
        state.hunger -= 1;
        losePeople(state, state.population - 1, false, 'starved to death');
      }
      settleJobs(state);
    } else if (unfed <= 1e-9) {
      state.hunger = 0; // fed again: the hungry recover
    }
  }

  // 5. Deaths, then new people move into free housing, eating Food as they arrive.
  //    A demon horde feeds until only the survivors are left, then vanishes.
  workAccidents(state, mods, dt);
  const dying = deathRate(mods) * dt;
  if (dying > 0) {
    if (isHordeActive(state) && state.population - dying <= DEMONS.survivors) {
      // The last feast is on the town itself, so exactly the survivors are left.
      losePeople(state, Math.min(state.population, DEMONS.survivors), false);
      endHorde(state);
    } else {
      losePeople(state, Math.max(0, state.population - dying));
    }
    settleJobs(state);
  }
  if (isHordeActive(state)) state.demons *= Math.pow(2, dt / DEMONS.doublingSeconds);
  const cap = housing(mods);
  if (state.population < cap) {
    let arriving = Math.min(cap - state.population, arrivalRate(mods) * dt);
    arriving = Math.min(arriving, state.resources.food / POPULATION.foodPerPerson);
    const before = Math.floor(state.population);
    state.population += arriving;
    state.resources.food -= arriving * POPULATION.foodPerPerson;
    for (let i = before; i < Math.floor(state.population); i++) addLog(state, `${randomName()} ${randomArrival()}.`, 'arrival');
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
    checkAchievements(state);
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
  return NODE_ORDER.filter(
    (id) => NODES[id].world === 'lab' && NODES[id].kind === 'tech' && !NODES[id].permanent && state.nodes[id] > 0,
  )
    .sort((a, b) => techValue(b) - techValue(a))
    .slice(0, keep);
}

/** Owned nodes in a world that its reset never takes away. */
export function permanentNodes(state: GameState, world: WorldId): NodeId[] {
  return NODE_ORDER.filter((id) => NODES[id].world === world && NODES[id].permanent && state.nodes[id] > 0);
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
 * unless a horde spell from that world is running (Arcana can't be reset under Summon Demons),
 * pays Echoes for the run, and restarts it with any Head Start. Other worlds are
 * untouched and opened worlds stay open.
 */
/** The horde spell that stops `world` from being reset right now, if any. */
export function resetBlocker(state: GameState, world: WorldId): NodeId | null {
  return state.activeSpells.find((id) => NODES[id].horde && NODES[id].world === world) ?? null;
}

export function canResetWorld(state: GameState, world: WorldId): boolean {
  return isWorldUnlocked(state, world) && !resetBlocker(state, world);
}

export function resetWorld(state: GameState, world: WorldId): number {
  if (!canResetWorld(state, world)) return 0;
  const reward = echoGain(state, world);
  const keep = new Set([...(world === 'lab' ? retainedTechs(state) : []), ...permanentNodes(state, world)]);
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
    delete state.construction[id];
    delete state.researchProgress[id];
    state.activeSpells = state.activeSpells.filter((s) => s !== id);
    state.switchedOff = state.switchedOff.filter((s) => s !== id);
  }
  if (world === 'lab') {
    state.researching = null;
    state.researchProgress = {};
  }
  if (world === 'realm') {
    // Only the survivors are left, so a demon horde has nothing more to eat.
    endHorde(state);
    // Deposits come back full and bigger, the more of them was gathered this run.
    // Full means their whole size, achievement bonuses included (the Realm's buildings are gone by now).
    for (const id of DEPOSIT_ORDER) {
      const max = nextDepositMax(state, id);
      state.deposits[id] = { left: max, max, cut: 0 };
    }
    const fresh = computeModifiers(state);
    for (const id of DEPOSIT_ORDER) state.deposits[id].left = depositMax(state, fresh, id);
    state.population = startPopulation(state);
    state.resources.food = POPULATION.startFood;
    state.hunger = 0;
    state.runDeaths = 0;
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
