/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NODE_ORDER, NODES } from '../src/engine/content';
import { gameGuide, guideMarkdown } from '../src/ui/guide';

const FILE = new URL('../GAME_CONTENT.md', import.meta.url);

describe('GAME_CONTENT.md', () => {
  it('matches the game content (run `npm run docs` to regenerate it)', () => {
    const fresh = guideMarkdown();
    if (process.env.UPDATE_DOCS) writeFileSync(FILE, fresh);
    expect(readFileSync(FILE, 'utf8')).toBe(fresh);
  });

  it('lists every building, tech and spell', () => {
    const text = gameGuide()
      .flatMap((s) => s.table?.rows ?? [])
      .map((row) => row[0]);
    for (const id of NODE_ORDER) expect(text).toContain(NODES[id].name);
  });
});
