import { canSwitchOff, createInitialState, isResearch, LOG_LIMIT, SAVE_VERSION } from './engine';
import type { GameState, LogEntry } from './types';
import { DEMONS, DEPOSIT_ORDER, NODES, NODE_ORDER, WORLD_ORDER } from './content';

export const SAVE_KEY = 'incremental-worlds-save';

export function serialize(state: GameState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION });
}

/** Copies only known keys holding finite numbers, so stale or damaged saves fall back to defaults. */
function mergeNumbers<T extends Record<string, number>>(defaults: T, raw: unknown): T {
  const out = { ...defaults };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = (raw as Record<string, unknown>)[key as string];
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value as T[keyof T];
    }
  }
  return out;
}

function readLog(raw: unknown): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e): e is LogEntry =>
        !!e && typeof e === 'object' && typeof e.text === 'string' && typeof e.time === 'number' && Number.isFinite(e.time),
    )
    .map((e) => ({ time: e.time, text: e.text }))
    .slice(-LOG_LIMIT);
}

function readConstruction(raw: unknown): GameState['construction'] {
  const out: GameState['construction'] = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of NODE_ORDER) {
    const c = (raw as Record<string, unknown>)[id] as { done?: unknown; needed?: unknown } | undefined;
    if (!c || typeof c !== 'object') continue;
    const { done, needed } = c;
    if (typeof done === 'number' && typeof needed === 'number' && Number.isFinite(done) && Number.isFinite(needed)) {
      out[id] = { done, needed };
    }
  }
  return out;
}

function readDeposits(raw: Record<string, unknown>, fresh: GameState['deposits']): GameState['deposits'] {
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const saved = (raw.deposits && typeof raw.deposits === 'object' ? raw.deposits : {}) as Record<string, unknown>;
  // Saves from before Stone, Clay and Coal ran out kept the forest in its own fields.
  const legacyWood = { left: raw.forest, max: raw.forestMax, cut: raw.forestCut };
  const out = {} as GameState['deposits'];
  for (const id of DEPOSIT_ORDER) {
    const d = (id === 'wood' && !saved.wood ? legacyWood : (saved[id] ?? {})) as Record<string, unknown>;
    const max = Math.max(1, num(d.max, fresh[id].max));
    out[id] = { left: Math.min(max, Math.max(0, num(d.left, max))), max, cut: Math.max(0, num(d.cut, 0)) };
  }
  return out;
}

export function deserialize(text: string): GameState {
  const fresh = createInitialState();
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fresh;
  }
  if (!raw || typeof raw !== 'object') return fresh;

  const unlocked = Array.isArray(raw.unlockedWorlds)
    ? WORLD_ORDER.filter((w) => (raw.unlockedWorlds as unknown[]).includes(w))
    : fresh.unlockedWorlds;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const meta = mergeNumbers(fresh.meta, raw.meta);
  // Keep only as many spells on as there are slots. A running horde takes no slot.
  const saved = Array.isArray(raw.activeSpells)
    ? NODE_ORDER.filter((id) => NODES[id].spell && (raw.activeSpells as unknown[]).includes(id))
    : [];
  const activeSpells = [
    ...saved.filter((id) => !NODES[id].horde).slice(0, 1 + meta.multicast),
    ...saved.filter((id) => NODES[id].horde),
  ];

  const construction = readConstruction(raw.construction);
  const research = readResearch(raw, construction);

  return {
    version: SAVE_VERSION,
    resources: mergeNumbers(fresh.resources, raw.resources),
    nodes: mergeNumbers(fresh.nodes, raw.nodes),
    unlockedWorlds: Array.from(new Set([...fresh.unlockedWorlds, ...unlocked])),
    runEarned: mergeNumbers(fresh.runEarned, raw.runEarned),
    echoes: num(raw.echoes, 0),
    totalEchoes: num(raw.totalEchoes, 0),
    resets: mergeNumbers(fresh.resets, raw.resets),
    meta,
    population: num(raw.population, fresh.population),
    jobs: mergeNumbers(fresh.jobs, raw.jobs),
    activeSpells,
    switchedOff: Array.isArray(raw.switchedOff)
      ? NODE_ORDER.filter((id) => canSwitchOff(id) && (raw.switchedOff as unknown[]).includes(id))
      : [],
    deposits: readDeposits(raw, fresh.deposits),
    // A horde only exists while its spell is on.
    demons: activeSpells.some((id) => NODES[id].horde) ? Math.max(DEMONS.start, num(raw.demons, 0)) : 0,
    construction,
    efficiency: {},
    ...research,
    log: readLog(raw.log),
  };
}

/**
 * Reads the research target and progress. Older saves built Lab techs like buildings, so a
 * tech still under construction becomes a started tech (its costs were paid) and the target.
 */
function readResearch(
  raw: Record<string, unknown>,
  construction: GameState['construction'],
): Pick<GameState, 'researching' | 'researchProgress'> {
  const researchProgress: GameState['researchProgress'] = {};
  const saved = (raw.researchProgress && typeof raw.researchProgress === 'object' ? raw.researchProgress : {}) as Record<
    string,
    unknown
  >;
  for (const id of NODE_ORDER) {
    const v = saved[id];
    if (isResearch(id) && typeof v === 'number' && Number.isFinite(v)) researchProgress[id] = Math.max(0, v);
  }
  let researching = NODE_ORDER.find((id) => isResearch(id) && raw.researching === id) ?? null;
  for (const id of NODE_ORDER) {
    if (!isResearch(id) || !construction[id]) continue;
    delete construction[id];
    researchProgress[id] ??= 0;
    researching ??= id;
  }
  return { researching, researchProgress };
}

export function loadGame(storage: Pick<Storage, 'getItem'> = localStorage): GameState {
  try {
    const text = storage.getItem(SAVE_KEY);
    return text ? deserialize(text) : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveGame(state: GameState, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try {
    storage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}
