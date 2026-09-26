import {
  ACHIEVEMENTS,
  ACHIEVEMENT_ORDER,
  BUILD_TIME_GROWTH,
  DEMONS,
  DEPOSITS,
  DEPOSIT_GROWTH_PER_LEVEL,
  DEPOSIT_ORDER,
  JOBS,
  JOB_ORDER,
  LAND,
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
} from '../engine/content';
import { statWorld } from '../engine/engine';
import { formatDuration, formatNumber } from '../engine/format';
import type { Cost, Effect, NodeDef, NodeId, ResourceId, WorldId } from '../engine/types';
import { describeEffect } from './describe';

/**
 * The game's content as plain sections, read straight from `content.ts`. Both the in-game
 * Guide tab and GAME_CONTENT.md (`npm run docs`) are rendered from this, so they always
 * match the game.
 */
export interface GuideSection {
  title: string;
  intro?: string;
  list?: string[];
  table?: { columns: string[]; rows: string[][] };
}

const costText = (cost: Cost) =>
  (Object.entries(cost) as [ResourceId, number][]).map(([r, n]) => `${formatNumber(n)} ${RESOURCES[r].name}`).join(', ') || '—';

const effectText = (effect: Effect, owner: WorldId) => describeEffect(effect, effect.amount) + worldNote(effect, owner);

/** "(Arcana)" after an effect that reaches into another world. */
function worldNote(effect: Effect, owner: WorldId): string {
  const world = statWorld(effect.stat);
  return world !== owner ? ` (${WORLDS[world].name})` : '';
}

const requiresText = (node: NodeDef) => {
  const reqs = (node.requires ?? []).map((id) => NODES[id].name + (NODES[id].world !== node.world ? ` (${WORLDS[NODES[id].world].name})` : ''));
  if (node.requiresBuildings) reqs.push(`${node.requiresBuildings} ${WORLDS[node.world].name} buildings`);
  return reqs.join(', ') || '—';
};

function nodeEffects(node: NodeDef): string {
  const parts = node.effects.map((e) => effectText(e, node.world));
  if (node.upkeep) {
    parts.push(
      `Uses ${(Object.entries(node.upkeep) as [ResourceId, number][])
        .map(([r, n]) => `${formatNumber(n)} ${RESOURCES[r].name}/s`)
        .join(', ')}${node.spell ? ' while on' : ''}`,
    );
  }
  if (node.people) parts.push(`Takes ${node.people} idle Realm ${node.people === 1 ? 'person' : 'people'}`);
  if (node.unlocksWorld) parts.push(`Opens ${WORLDS[node.unlocksWorld].name}`);
  if (node.lasting) parts.push('Kept for good; the tech resets, so each run can add more');
  return parts.join('; ') || '—';
}

function costGrowthText(node: NodeDef): string {
  if (node.maxLevel === 1 || node.kind === 'tech') return node.maxLevel && node.maxLevel > 1 ? `×${node.costGrowth} per level` : '—';
  if (node.levelCosts) {
    return `Then: ${node.levelCosts.map(costText).join(' → ')}; ×${node.costGrowth} per level after`;
  }
  return `×${node.costGrowth} per level`;
}

function buildingTable(world: WorldId): GuideSection['table'] {
  const ids = NODE_ORDER.filter((id) => NODES[id].world === world && NODES[id].kind === 'building');
  return {
    columns: ['Building', 'Cost', 'Cost growth', 'Build time', 'Max', 'Needs', 'Effects (each)'],
    rows: ids.map((id) => {
      const n = NODES[id];
      return [
        n.name,
        costText(n.baseCost),
        costGrowthText(n),
        `${formatDuration(TIER_SECONDS[n.tier])} (×${BUILD_TIME_GROWTH} per level)`,
        n.maxLevel ? String(n.maxLevel) : '∞',
        requiresText(n),
        nodeEffects(n),
      ];
    }),
  };
}

function techTable(ids: NodeId[], research: boolean): GuideSection['table'] {
  return {
    columns: ['Name', 'Cost', ...(research ? ['Levels'] : ['Time']), 'Needs', 'Effects'],
    rows: ids.map((id) => {
      const n = NODES[id];
      const levels = n.maxLevel && n.maxLevel > 1 ? `${n.maxLevel} (cost ×${n.costGrowth} each)` : '1';
      return [n.name, costText(n.baseCost), research ? levels : formatDuration(TIER_SECONDS[n.tier]), requiresText(n), nodeEffects(n)];
    }),
  };
}

export function gameGuide(): GuideSection[] {
  const sections: GuideSection[] = [];

  sections.push({
    title: 'Worlds',
    intro: 'Three worlds that feed and hinder each other. Resetting a world earns Echoes to spend in the Echo shop.',
    table: {
      columns: ['World', 'About', 'How it opens'],
      rows: WORLD_ORDER.map((w) => [WORLDS[w].name, WORLDS[w].tagline, WORLDS[w].unlockHint]),
    },
  });

  sections.push({
    title: 'Realm rules',
    list: [
      `A Realm run starts with ${POPULATION.start} people, ${POPULATION.startFood} Food and housing for ${POPULATION.baseHousing}.`,
      `People arrive at ${formatNumber(POPULATION.baseGrowth * 60)}/min while there is free housing, each eating ${POPULATION.foodPerPerson} Food to move in.`,
      `Everyone eats ${POPULATION.foodPerSecond} Food/s. Without Food, one person starves every ${formatNumber(1 / POPULATION.starvationRate)}s (less when some Food still comes in); starvation never takes the last ${POPULATION.starvationSurvivors}.`,
      `Growth is divided by 1 + ${POPULATION.crowdingPenalty} × crowding and by 1 + ${POPULATION.pollutionPenalty} × pollution.`,
      `The Realm has ${LAND.base} squares of land; every building level takes one.`,
      'Every worker has a chance each second of dying at work (see Jobs).',
      `A summoned demon horde starts at ${DEMONS.start} and doubles every ${formatDuration(DEMONS.doublingSeconds)}, until only ${DEMONS.survivors} people are left.`,
      'Storage is capped per resource; production past the cap is lost. Goods kept in Warehouses slowly spoil.',
      `On a Realm reset, the forest grows by ${DEPOSIT_GROWTH_PER_LEVEL * 100}% of the Wood cut that run per Rich Earth level.`,
    ],
  });

  sections.push({
    title: 'Resources',
    table: {
      columns: ['Resource', 'World', 'Storage', 'Echo value', 'Appears with'],
      rows: WORLD_ORDER.flatMap((w) => RESOURCE_ORDER.filter((r) => RESOURCES[r].world === w)).map((r) => {
        const d = RESOURCES[r];
        return [
          d.name,
          WORLDS[d.world].name,
          d.baseCap === undefined ? 'Unlimited' : formatNumber(d.baseCap),
          String(d.value),
          d.revealedBy ? NODES[d.revealedBy].name : '—',
        ];
      }),
    },
  });

  sections.push({
    title: 'Deposits',
    intro: 'Realm resources are dug from deposits that run out. Buildings open up more.',
    table: {
      columns: ['Deposit', 'Resource', 'Starting size', 'Refills on its own', 'Opened up by'],
      rows: DEPOSIT_ORDER.map((id) => {
        const def = DEPOSITS[id];
        const openers = NODE_ORDER.flatMap((n) =>
          NODES[n].effects
            .filter((e) => e.stat === `size:${id}` && e.kind === 'add')
            .map((e) => `${NODES[n].name} ${e.amount > 0 ? '+' : '−'}${formatNumber(Math.abs(e.amount))}`),
        );
        return [
          `${def.icon} ${def.name}`,
          RESOURCES[id].name,
          formatNumber(def.start),
          def.baseRegrow > 0 ? `${def.baseRegrow}/s${def.pollutionSlows ? ' (slowed by pollution)' : ''}` : 'No',
          openers.join(', ') || '—',
        ];
      }),
    },
  });

  sections.push({
    title: 'Jobs',
    table: {
      columns: ['Job', 'Makes', 'Per worker', 'Accident risk', 'Needs', 'Also'],
      rows: JOB_ORDER.map((id) => {
        const j = JOBS[id];
        return [
          j.name,
          RESOURCES[j.resource].name,
          `${j.baseYield}/s`,
          `${j.accidentsPerHour} ${j.accidentsPerHour === 1 ? 'death' : 'deaths'}/h (${formatNumber((j.accidentsPerHour / 60) * 100)}%/min)`,
          (j.requires ?? []).map((n) => NODES[n].name).join(', ') || '—',
          (j.effects ?? []).map((e) => effectText(e, 'realm')).join('; ') || '—',
        ];
      }),
    },
  });

  for (const world of WORLD_ORDER) {
    sections.push({ title: `${WORLDS[world].name} buildings`, table: buildingTable(world) });
  }

  const labTechs = NODE_ORDER.filter((id) => NODES[id].world === 'lab' && NODES[id].kind === 'tech');
  sections.push({
    title: 'Lab research',
    intro: 'Research streams into the tech you pick. Other costs are paid once when a tech is first started.',
    table: techTable(labTechs, true),
  });
  const arcanaTechs = NODE_ORDER.filter((id) => NODES[id].world === 'arcana' && NODES[id].kind === 'tech');
  sections.push({
    title: 'Arcana discoveries',
    table: techTable(arcanaTechs.filter((id) => !NODES[id].spell), false),
  });
  sections.push({
    title: 'Arcana spells',
    intro: 'Learn a spell once, then switch it on and off. Only one can be on at a time (Multicast adds more).',
    table: techTable(arcanaTechs.filter((id) => NODES[id].spell), false),
  });

  sections.push({
    title: 'Echo shop',
    intro: 'Upgrades bought with Echoes. They survive every reset.',
    table: {
      columns: ['Upgrade', 'Effect', 'Cost', 'Max level'],
      rows: META_ORDER.map((id) => {
        const m = META[id];
        return [m.name, m.description, `${m.baseCost} Echoes, ×${m.costGrowth} per level`, m.maxLevel ? String(m.maxLevel) : '∞'];
      }),
    },
  });

  sections.push({
    title: 'Achievements',
    intro: 'Reached once, kept for good.',
    table: {
      columns: ['Achievement', 'Goal', 'Reward'],
      rows: ACHIEVEMENT_ORDER.map((id) => [ACHIEVEMENTS[id].name, ACHIEVEMENTS[id].goal, ACHIEVEMENTS[id].reward]),
    },
  });

  return sections;
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** GAME_CONTENT.md: the guide as Markdown. */
export function guideMarkdown(): string {
  const out = [
    '# Incremental Worlds: game content',
    '',
    '_Generated from `src/engine/content.ts` by `npm run docs`. Do not edit by hand: a test fails when this file is out of date._',
    '',
  ];
  for (const s of gameGuide()) {
    out.push(`## ${s.title}`, '');
    if (s.intro) out.push(s.intro, '');
    if (s.list) out.push(...s.list.map((l) => `- ${l}`), '');
    if (s.table) {
      out.push(`| ${s.table.columns.join(' | ')} |`, `| ${s.table.columns.map(() => '---').join(' | ')} |`);
      for (const row of s.table.rows) out.push(`| ${row.map(cell).join(' | ')} |`);
      out.push('');
    }
  }
  return out.join('\n');
}
