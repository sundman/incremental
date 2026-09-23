import { describe, expect, it } from 'vitest';
import { createInitialState, tick } from '../src/engine/engine';
import { formatDuration, formatMultiplier, formatNumber, formatPerHour } from '../src/engine/format';
import { deserialize, loadGame, saveGame, serialize } from '../src/engine/save';

describe('save', () => {
  it('round-trips a game in progress', () => {
    const state = createInitialState();
    state.nodes.lumberCamp = 3;
    state.unlockedWorlds.push('lab');
    state.meta.amplify = 2;
    state.echoes = 7;
    tick(state, 5);
    state.construction.quarry = { done: 3, needed: 5 };
    state.activeSpells = ['haste'];
    const loaded = deserialize(serialize(state));
    expect(loaded.construction).toEqual({ quarry: { done: 3, needed: 5 } });
    expect(loaded.activeSpells).toEqual(['haste']);
    expect(loaded.resources).toEqual(state.resources);
    expect(loaded.nodes).toEqual(state.nodes);
    expect(loaded.unlockedWorlds).toEqual(['realm', 'lab']);
    expect(loaded.meta.amplify).toBe(2);
    expect(loaded.echoes).toBe(7);
  });

  it('keeps a summoned horde only while its spell is on', () => {
    const state = createInitialState();
    state.nodes.summoningCircle = 1;
    state.activeSpells = ['summoningCircle'];
    state.demons = 12.5;
    expect(deserialize(serialize(state)).demons).toBe(12.5);
    state.activeSpells = [];
    expect(deserialize(serialize(state)).demons).toBe(0);
  });

  it('keeps deposits, and reads the forest from saves made before other deposits existed', () => {
    const state = createInitialState();
    state.deposits.clay = { left: 100, max: 30000, cut: 29900 };
    expect(deserialize(serialize(state)).deposits.clay).toEqual({ left: 100, max: 30000, cut: 29900 });
    const old = deserialize(JSON.stringify({ forest: 500, forestMax: 9000, forestCut: 8500 }));
    expect(old.deposits.wood).toEqual({ left: 500, max: 9000, cut: 8500 });
    expect(old.deposits.coal.left).toBe(old.deposits.coal.max);
  });

  it('keeps only as many spells on as there are slots when loading', () => {
    const loaded = deserialize(JSON.stringify({ activeSpells: ['haste', 'fertilityRite'], meta: { multicast: 0 } }));
    expect(loaded.activeSpells).toHaveLength(1);
    const horde = deserialize(JSON.stringify({ activeSpells: ['haste', 'summoningCircle'], demons: 3 }));
    expect(horde.activeSpells).toEqual(expect.arrayContaining(['haste', 'summoningCircle']));
  });

  it('falls back to defaults for missing, unknown or broken fields', () => {
    const loaded = deserialize(
      JSON.stringify({ resources: { wood: 5, stone: 'lots', unobtainium: 9 }, nodes: null, unlockedWorlds: ['nowhere'] }),
    );
    expect(loaded.resources.wood).toBe(5);
    expect(loaded.resources.stone).toBe(0);
    expect('unobtainium' in loaded.resources).toBe(false);
    expect(loaded.nodes.lumberCamp).toBe(0);
    expect(loaded.unlockedWorlds).toEqual(['realm']);
  });

  it('starts fresh on unreadable saves', () => {
    expect(deserialize('not json').resources.wood).toBe(0);
    expect(deserialize('null').resources.wood).toBe(0);
  });

  it('reads and writes through storage', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    const state = createInitialState();
    state.resources.wood = 42;
    expect(saveGame(state, storage)).toBe(true);
    expect(loadGame(storage).resources.wood).toBe(42);
  });
});

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [1.5, '1.5'],
    [3.14159, '3.14'],
    [42.25, '42.3'],
    [999.9, '999'],
    [1234, '1.23K'],
    [12_345, '12.3K'],
    [999_999, '1M'],
    [4_560_000, '4.56M'],
    [-2500, '-2.5K'],
    [1e40, '1.00e40'],
  ])('%s -> %s', (n, expected) => {
    expect(formatNumber(n)).toBe(expected);
  });

  it('formats multipliers', () => {
    expect(formatMultiplier(0.95)).toBe('×0.95');
    expect(formatMultiplier(1.25)).toBe('×1.25');
    expect(formatMultiplier(1.5)).toBe('×1.5');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [4.2, '5s'],
    [59, '59s'],
    [185, '3m 05s'],
    [4800, '1h 20m'],
  ])('%s -> %s', (n, expected) => {
    expect(formatDuration(n)).toBe(expected);
  });

  it('shows death rates per hour, switching to per minute above 60 an hour', () => {
    expect(formatPerHour(6)).toBe('6/hour');
    expect(formatPerHour(60)).toBe('60/hour');
    expect(formatPerHour(90)).toBe('1.5/min');
    expect(formatPerHour(3600)).toBe('60/min');
  });
});
