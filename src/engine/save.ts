import { createInitialState, SAVE_VERSION } from './engine';
import type { GameState } from './types';
import { WORLD_ORDER } from './content';

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

  return {
    version: SAVE_VERSION,
    resources: mergeNumbers(fresh.resources, raw.resources),
    nodes: mergeNumbers(fresh.nodes, raw.nodes),
    unlockedWorlds: Array.from(new Set([...fresh.unlockedWorlds, ...unlocked])),
    runEarned: mergeNumbers(fresh.runEarned, raw.runEarned),
    echoes: num(raw.echoes, 0),
    totalEchoes: num(raw.totalEchoes, 0),
    resets: mergeNumbers(fresh.resets, raw.resets),
    meta: mergeNumbers(fresh.meta, raw.meta),
    population: num(raw.population, fresh.population),
    jobs: mergeNumbers(fresh.jobs, raw.jobs),
    efficiency: {},
  };
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
