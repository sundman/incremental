import {
  DEMONS,
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
} from '../engine/content';
import {
  activeLinks,
  arrivalBlocker,
  arrivalRate,
  deathRate,
  assignJob,
  housing,
  idleWorkers,
  isJobAvailable,
  jobOutput,
  buildingCount,
  buyMeta,
  buildSeconds,
  buyNode,
  canAfford,
  constructionSecondsLeft,
  canBuyMeta,
  click,
  clickValue,
  computeModifiers,
  echoGain,
  canResetWorld,
  resetBlocker,
  isHordeActive,
  effectiveAmount,
  isHelpful,
  isSpellActive,
  canCastSpell,
  toggleSpell,
  isNodeAvailable,
  isResourceRevealed,
  isWorldUnlocked,
  maxLevel,
  metaCost,
  netRate,
  nodeCost,
  resetWorld,
  retainedTechs,
  statWorld,
  type ActiveLink,
  type Modifiers,
} from '../engine/engine';
import { formatDuration, formatNumber } from '../engine/format';
import type { GameState, JobId, MetaId, NodeId, ResourceId, WorldId } from '../engine/types';
import { describeEffect } from './describe';

type Attrs = Record<string, string>;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

function setText(el: HTMLElement, text: string) {
  if (el.textContent !== text) el.textContent = text;
}

function setHidden(el: HTMLElement, hidden: boolean) {
  if (el.hidden !== hidden) el.hidden = hidden;
}

const lastHtml = new WeakMap<HTMLElement, string>();

/** Replaces children only when the markup changes, so hover and text selection survive re-renders. */
function setHtml(el: HTMLElement, html: string) {
  if (lastHtml.get(el) === html) return;
  lastHtml.set(el, html);
  el.innerHTML = html;
}

const RESET_WIPES: Record<WorldId, string> = {
  realm: 'buildings, people and jobs',
  arcana: 'buildings and discoveries',
  lab: 'buildings and techs',
};

const echoesLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? 'Echo' : 'Echoes'}`;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

interface ResourceRow {
  row: HTMLElement;
  amount: HTMLElement;
  rate: HTMLElement;
}

interface NodeCard {
  card: HTMLElement;
  button: HTMLButtonElement;
  level: HTMLElement;
  cost: HTMLElement;
  effects: HTMLElement;
  needs: HTMLElement;
  time: HTMLElement;
}

interface JobRow {
  row: HTMLElement;
  count: HTMLElement;
  info: HTMLElement;
  minus: HTMLButtonElement;
  plus: HTMLButtonElement;
}

interface PopulationView {
  summary: HTMLElement;
  jobs: Record<JobId, JobRow>;
}

interface WorldView {
  panel: HTMLElement;
  locked: HTMLElement;
  lockedProgress: HTMLElement;
  body: HTMLElement;
  resources: Partial<Record<ResourceId, ResourceRow>>;
  clicks: Partial<Record<ResourceId, HTMLButtonElement>>;
  incoming: HTMLElement;
  outgoing: HTMLElement;
  resetButton: HTMLButtonElement;
  resetNote: HTMLElement;
}

interface MetaCard {
  card: HTMLElement;
  button: HTMLButtonElement;
  level: HTMLElement;
  cost: HTMLElement;
}

export class GameView {
  private worlds = {} as Record<WorldId, WorldView>;
  private nodes = {} as Record<NodeId, NodeCard>;
  private metas = {} as Record<MetaId, MetaCard>;
  private population!: PopulationView;
  private echoes: HTMLElement;
  private shop: HTMLElement;
  private shopHint: HTMLElement;

  constructor(
    root: HTMLElement,
    private state: GameState,
    private hooks: { onHardReset: () => void; onChange: () => void },
  ) {
    this.echoes = h('span', { class: 'echo-count' });
    const hardReset = h('button', { class: 'link-button', type: 'button' }, 'Wipe save');
    hardReset.addEventListener('click', () => {
      if (confirm('Wipe ALL progress, including Echoes and the Echo shop? This cannot be undone.')) {
        this.hooks.onHardReset();
      }
    });

    const header = h(
      'header',
      { class: 'top' },
      h('h1', {}, 'Incremental Worlds'),
      h('div', { class: 'echoes', title: 'Earned by resetting a world. Spent in the Echo shop.' }, 'Echoes: ', this.echoes),
      hardReset,
    );

    const worldsEl = h('main', { class: 'worlds' });
    for (const world of WORLD_ORDER) worldsEl.append(this.buildWorld(world));

    this.shopHint = h('p', { class: 'muted' }, 'Reset a world to earn Echoes, then spend them here on upgrades that survive every reset.');
    const shopGrid = h('div', { class: 'shop-grid' });
    for (const id of META_ORDER) shopGrid.append(this.buildMeta(id));
    this.shop = h('section', { class: 'shop' }, h('h2', {}, 'Echo shop'), this.shopHint, shopGrid);

    root.replaceChildren(header, worldsEl, this.shop);
  }

  private buildWorld(world: WorldId): HTMLElement {
    const def = WORLDS[world];
    const lockedProgress = h('p', { class: 'muted' });
    const locked = h('div', { class: 'locked' }, h('p', {}, '🔒 ' + def.unlockHint), lockedProgress);

    const resources: WorldView['resources'] = {};
    const clicks: WorldView['clicks'] = {};
    const resList = h('div', { class: 'resources' });
    const clickRow = h('div', { class: 'clicks' });
    for (const r of RESOURCE_ORDER) {
      const rd = RESOURCES[r];
      if (rd.world !== world) continue;
      const amount = h('span', { class: 'amount' });
      const rate = h('span', { class: 'rate' });
      const row = h('div', { class: 'resource' }, h('span', { class: 'name' }, rd.name), amount, rate);
      resList.append(row);
      resources[r] = { row, amount, rate };
      if (rd.click) {
        const btn = h('button', { class: 'gather', type: 'button' });
        btn.addEventListener('click', () => {
          click(this.state, r);
          this.hooks.onChange();
        });
        clickRow.append(btn);
        clicks[r] = btn;
      }
    }

    const populationEl = world === 'realm' ? this.buildPopulation() : null;

    const buildings = h('div', { class: 'nodes' });
    const techs = h('div', { class: 'nodes' });
    const spells = h('div', { class: 'nodes' });
    for (const id of NODE_ORDER) {
      const node = NODES[id];
      if (node.world !== world) continue;
      (node.spell ? spells : node.kind === 'tech' ? techs : buildings).append(this.buildNode(id));
    }

    const incoming = h('ul', { class: 'links' });
    const outgoing = h('ul', { class: 'links' });
    const resetButton = h('button', { class: 'reset', type: 'button' });
    const resetNote = h('p', { class: 'muted small' });
    resetButton.addEventListener('click', () => {
      const gain = echoGain(this.state, world);
      const msg =
        `Reset ${def.name}? Its resources and ${RESET_WIPES[world]} go back to zero, ` +
        `along with every effect it has on the other worlds. You gain ${echoesLabel(gain)}.`;
      if (!canResetWorld(this.state, world)) return;
      if (confirm(msg)) {
        resetWorld(this.state, world);
        this.hooks.onChange();
      }
    });

    const body = h(
      'div',
      { class: 'world-body' },
      resList,
      clickRow,
      ...(populationEl ? [populationEl] : []),
      h('details', { class: 'link-box', open: '' }, h('summary', {}, 'Effects from other worlds'), incoming),
      h('h3', {}, 'Buildings'),
      buildings,
      ...(techs.childElementCount ? [h('h3', {}, world === 'arcana' ? 'Discoveries' : 'Research'), techs] : []),
      ...(spells.childElementCount
        ? [h('h3', {}, 'Spells'), h('p', { class: 'muted small' }, 'Learn a spell once, then click it to switch it on or off. It only costs upkeep while on. Summon Demons is the exception: once cast, it runs until the Realm is down to 2 survivors.'), spells]
        : []),
      h('details', { class: 'link-box' }, h('summary', {}, 'Effects this world sends out'), outgoing),
      h('div', { class: 'reset-box' }, resetButton, resetNote),
    );

    const panel = h(
      'section',
      { class: `world world-${world}` },
      h('h2', {}, def.name),
      h('p', { class: 'tagline' }, def.tagline),
      locked,
      body,
    );
    this.worlds[world] = { panel, locked, lockedProgress, body, resources, clicks, incoming, outgoing, resetButton, resetNote };
    return panel;
  }

  private buildPopulation(): HTMLElement {
    const summary = h('div', { class: 'pop-summary' });
    const jobs = {} as Record<JobId, JobRow>;
    const list = h('div', { class: 'jobs' });
    for (const id of JOB_ORDER) {
      const count = h('span', { class: 'job-count' });
      const info = h('span', { class: 'job-info' });
      const minus = h('button', { class: 'job-btn', type: 'button', title: 'Take one off (Shift: all)' }, '−');
      const plus = h('button', { class: 'job-btn', type: 'button', title: 'Assign one (Shift: all idle)' }, '+');
      minus.addEventListener('click', (e) => {
        assignJob(this.state, id, e.shiftKey ? -Infinity : -1);
        this.hooks.onChange();
      });
      plus.addEventListener('click', (e) => {
        assignJob(this.state, id, e.shiftKey ? Infinity : 1);
        this.hooks.onChange();
      });
      const row = h(
        'div',
        { class: 'job' },
        h('span', { class: 'job-name' }, JOBS[id].name),
        info,
        minus,
        count,
        plus,
      );
      list.append(row);
      jobs[id] = { row, count, info, minus, plus };
    }
    this.population = { summary, jobs };
    return h('div', { class: 'population' }, h('h3', {}, 'People'), summary, list);
  }

  private renderPopulation(mods: Modifiers) {
    const state = this.state;
    const { summary, jobs } = this.population;
    const cap = housing(mods);
    const people = Math.floor(state.population);
    const idle = idleWorkers(state);
    let text = `${people} / ${formatNumber(cap)} people · ${idle} idle`;
    const blocker = arrivalBlocker(state, mods);
    const growth = arrivalRate(mods);
    if (blocker === 'housing') {
      text += ' · build housing for more';
    } else if (blocker === 'food') {
      text += ` · newcomers need ${POPULATION.foodPerPerson} Food each`;
    } else if (growth > 0) {
      const secs = Math.ceil((Math.floor(state.population) + 1 - state.population) / growth);
      text += ` · growing ${formatNumber(growth * 60)}/min, next in ${secs}s`;
    }
    const deaths = deathRate(mods) * 3600;
    if (deaths > 0) {
      const horde = state.demons > 0 ? `${formatNumber(Math.floor(state.demons))} demons` : 'demons';
      text += ` · ${horde} kill ${formatNumber(deaths)}/hour`;
    }
    setText(summary, text);
    summary.classList.toggle('attention', idle > 0 || blocker === 'food');

    for (const id of JOB_ORDER) {
      const row = jobs[id];
      const job = JOBS[id];
      const available = isJobAvailable(state, id);
      setHidden(row.row, !available);
      if (!available) continue;
      setText(row.count, String(state.jobs[id]));
      const parts = [
        `<span>+${formatNumber(jobOutput(mods, id))} ${RESOURCES[job.resource].name}/s each</span>`,
        ...(job.effects ?? []).map((e) => {
          const to = statWorld(e.stat);
          const amount = effectiveAmount(state, e, 'realm');
          const cls = isHelpful({ ...e, amount }) ? 'good' : 'bad';
          return `<span class="${cls}"><span class="tag tag-${to}">${WORLDS[to].name}</span> ${escape(describeEffect(e, amount))} each</span>`;
        }),
      ];
      setHtml(row.info, parts.join(' '));
      row.minus.disabled = state.jobs[id] <= 0;
      row.plus.disabled = idle <= 0;
    }
  }

  private buildNode(id: NodeId): HTMLElement {
    const node = NODES[id];
    const level = h('span', { class: 'level' });
    const cost = h('div', { class: 'cost' });
    const effects = h('ul', { class: 'effects' });
    const needs = h('div', { class: 'needs' });
    const time = h('div', { class: 'build-time' });
    const button = h(
      'button',
      { class: 'node-button', type: 'button' },
      h('div', { class: 'node-title' }, h('span', { class: 'node-name' }, node.name), level),
      h('div', { class: 'node-desc' }, node.description),
      effects,
      cost,
      time,
      needs,
    );
    button.addEventListener('click', () => {
      if (NODES[id].spell && this.state.nodes[id] > 0) toggleSpell(this.state, id);
      else if (!buyNode(this.state, id)) return;
      this.hooks.onChange();
    });
    const card = h('div', { class: `node node-${node.kind}` }, button);
    this.nodes[id] = { card, button, level, cost, effects, needs, time };
    return card;
  }

  private buildMeta(id: MetaId): HTMLElement {
    const def = META[id];
    const level = h('span', { class: 'level' });
    const cost = h('div', { class: 'cost' });
    const button = h(
      'button',
      { class: 'node-button', type: 'button' },
      h('div', { class: 'node-title' }, h('span', { class: 'node-name' }, def.name), level),
      h('div', { class: 'node-desc' }, def.description),
      cost,
    );
    button.addEventListener('click', () => {
      if (buyMeta(this.state, id)) this.hooks.onChange();
    });
    const card = h('div', { class: 'node meta' }, button);
    this.metas[id] = { card, button, level, cost };
    return card;
  }

  setState(state: GameState) {
    this.state = state;
  }

  render() {
    const state = this.state;
    const mods = computeModifiers(state);
    const links = activeLinks(state);
    setText(this.echoes, formatNumber(state.echoes));

    for (const world of WORLD_ORDER) this.renderWorld(world, mods, links);
    this.renderPopulation(mods);
    for (const id of NODE_ORDER) this.renderNode(id, mods);

    const anyGain = WORLD_ORDER.some((w) => isWorldUnlocked(state, w) && echoGain(state, w) > 0);
    setHidden(this.shopHint, state.totalEchoes > 0);
    this.shop.classList.toggle('dim', state.totalEchoes === 0 && !anyGain);
    for (const id of META_ORDER) {
      const { button, level, cost } = this.metas[id];
      const max = META[id].maxLevel;
      const maxed = max !== undefined && state.meta[id] >= max;
      setText(level, `${state.meta[id]}${max !== undefined ? ' / ' + max : ''}`);
      setText(cost, maxed ? 'Maxed' : echoesLabel(metaCost(state, id)));
      button.disabled = !canBuyMeta(state, id);
    }
  }

  private renderWorld(world: WorldId, mods: Modifiers, links: ActiveLink[]) {
    const state = this.state;
    const v = this.worlds[world];
    const open = isWorldUnlocked(state, world);
    setHidden(v.locked, open);
    setHidden(v.body, !open);
    v.panel.classList.toggle('is-locked', !open);
    if (!open) {
      const bridge = NODE_ORDER.find((id) => NODES[id].unlocksWorld === world);
      const need = bridge ? (NODES[bridge].requiresBuildings ?? 0) : 0;
      setText(v.lockedProgress, need ? `Realm buildings: ${buildingCount(state, 'realm')} / ${need}` : '');
      return;
    }

    for (const r of RESOURCE_ORDER) {
      const row = v.resources[r];
      if (!row) continue;
      const shown = isResourceRevealed(state, r);
      setHidden(row.row, !shown);
      if (!shown) continue;
      setText(row.amount, formatNumber(state.resources[r]));
      const rate = netRate(state, mods, r);
      setText(row.rate, rate === 0 ? '' : `${rate > 0 ? '+' : ''}${formatNumber(rate)}/s`);
      row.rate.classList.toggle('negative', rate < 0);
      const btn = v.clicks[r];
      if (btn) setText(btn, `Gather ${RESOURCES[r].name} (+${formatNumber(clickValue(mods, r))})`);
    }

    const linkHtml = (l: ActiveLink, other: WorldId) => {
      const cls = l.helpful ? 'good' : 'bad';
      const lvl = l.count;
      const starved = l.efficiency < 0.999 ? ` <span class="muted">(${Math.round(l.efficiency * 100)}% upkeep)</span>` : '';
      return (
        `<li class="${cls}"><span class="tag tag-${other}">${WORLDS[other].name}</span> ` +
        `${escape(l.sourceName)}${lvl > 1 ? ' ×' + lvl : ''}: ${escape(describeEffect(l.effect, l.total))}${starved}</li>`
      );
    };
    const incoming = links.filter((l) => l.to === world);
    const outgoing = links.filter((l) => l.from === world);
    setHtml(v.incoming, incoming.length ? incoming.map((l) => linkHtml(l, l.from)).join('') : '<li class="muted">None right now.</li>');
    setHtml(v.outgoing, outgoing.length ? outgoing.map((l) => linkHtml(l, l.to)).join('') : '<li class="muted">None right now.</li>');

    const gain = echoGain(state, world);
    setText(v.resetButton, `Reset ${WORLDS[world].name} for ${echoesLabel(gain)}`);
    const blocker = resetBlocker(state, world);
    v.resetButton.disabled = !!blocker;
    const harms = outgoing.filter((l) => !l.helpful).length;
    const kept = world === 'lab' ? retainedTechs(state) : [];
    setText(
      v.resetNote,
      [
        blocker
          ? `Can't reset while ${NODES[blocker].name} is running. It ends when the Realm is down to 2 people, or when you reset the Realm.`
          : '',
        world === 'realm' && isHordeActive(state) ? 'Also ends Summon Demons: only 2 survivors are left.' : '',
        harms && !blocker ? `Clears ${harms} harmful effect${harms === 1 ? '' : 's'} on other worlds.` : '',
        kept.length ? `Keeps: ${kept.map((id) => NODES[id].name).join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  private renderNode(id: NodeId, mods: Modifiers) {
    const state = this.state;
    const node = NODES[id];
    const c = this.nodes[id];
    const level = state.nodes[id];
    const available = isNodeAvailable(state, id);
    // Show what is buyable plus the next step (one whose own prerequisites are met), so goals are visible.
    // Requirements in other worlds never hide a card, so the whole tree is visible as a goal.
    const frontier = (node.requires ?? []).every(
      (req) => NODES[req].world !== node.world || state.nodes[req] > 0 || isNodeAvailable(state, req),
    );
    const shown = isWorldUnlocked(state, node.world) && (available || level > 0 || frontier);
    setHidden(c.card, !shown);
    if (!shown) return;

    const max = maxLevel(id);
    const maxed = level >= max;
    const building = state.construction[id];
    if (building) {
      const pct = Math.min(100, (building.done / building.needed) * 100);
      c.button.style.setProperty('--progress', `${pct.toFixed(1)}%`);
      const verb = node.kind === 'building' ? 'Building' : node.world === 'arcana' ? 'Discovering' : 'Researching';
      setText(c.level, `${verb}… ${formatDuration(constructionSecondsLeft(state, id, mods))}`);
    } else if (node.horde && level > 0) {
      const on = isSpellActive(state, id);
      setText(c.level, on ? `${formatNumber(Math.floor(state.demons))} demons · no way back` : 'Not summoned');
    } else if (node.spell && level > 0) {
      const on = isSpellActive(state, id);
      const eff = state.efficiency[id] ?? 1;
      setText(c.level, on ? (eff < 0.999 ? `On · ${Math.round(eff * 100)}% power` : 'On') : 'Off');
    } else if (node.kind === 'tech') {
      setText(c.level, level > 0 ? (node.world === 'arcana' ? 'Discovered' : 'Researched') : '');
    } else {
      setText(c.level, String(level));
    }
    c.card.classList.toggle('constructing', !!building);
    c.card.classList.toggle('owned', node.kind === 'tech' && level > 0);

    const effectsHtml = node.effects
      .map((e) => {
        const to = statWorld(e.stat);
        const cross = to !== node.world;
        const amount = effectiveAmount(state, e, node.world);
        const helpful = isHelpful({ ...e, amount });
        const tag = cross ? `<span class="tag tag-${to}">${WORLDS[to].name}</span> ` : '';
        const per = node.kind === 'building' ? ' each' : node.horde ? ' per demon' : '';
        return `<li class="${cross ? (helpful ? 'good' : 'bad') : ''}">${tag}${escape(describeEffect(e, amount))}${per}</li>`;
      })
      .concat(
        node.upkeep
          ? Object.entries(node.upkeep).map(
              ([r, n]) => {
                const from = RESOURCES[r as ResourceId].world;
                const tag = from !== node.world ? `<span class="tag tag-${from}">${WORLDS[from].name}</span> ` : '';
                const when = node.spell ? ' while on' : ' each';
                return `<li class="${tag ? 'bad' : 'muted'}">${tag}Uses ${formatNumber(n)} ${RESOURCES[r as ResourceId].name}/s${when}</li>`;
              },
            )
          : [],
      )
      .concat(node.unlocksWorld && !isWorldUnlocked(state, node.unlocksWorld) ? [`<li class="good">Opens ${WORLDS[node.unlocksWorld].name}</li>`] : [])
      .join('');
    setHtml(c.effects, effectsHtml);

    if (maxed) {
      setHtml(c.cost, '');
    } else {
      const cost = nodeCost(state, id, mods);
      setHtml(
        c.cost,
        Object.entries(cost)
          .map(([r, n]) => {
            const short = state.resources[r as ResourceId] < n;
            return `<span class="${short ? 'short' : ''}">${formatNumber(n)} ${RESOURCES[r as ResourceId].name}</span>`;
          })
          .join(' · '),
      );
    }

    setText(c.time, maxed || building ? '' : `⏱ ${formatDuration(buildSeconds(state, id, mods))}`);

    const needs: string[] = [];
    for (const req of node.requires ?? []) {
      if (state.nodes[req] > 0) continue;
      const w = NODES[req].world;
      const tag = w !== node.world ? `<span class="tag tag-${w}">${WORLDS[w].name}</span> ` : '';
      needs.push(tag + escape(NODES[req].name));
    }
    if (node.requiresBuildings) {
      const have = buildingCount(state, node.world);
      if (have < node.requiresBuildings) needs.push(`${have}/${node.requiresBuildings} ${WORLDS[node.world].name} buildings`);
    }
    if (node.horde && level > 0 && !isSpellActive(state, id) && state.population <= DEMONS.survivors) {
      needs.push(`more than ${DEMONS.survivors} people to feed on`);
    }
    setHtml(c.needs, needs.length ? `Needs: ${needs.join(', ')}` : '');

    const learnedSpell = !!node.spell && level > 0;
    c.card.classList.toggle('spell-on', learnedSpell && isSpellActive(state, id));
    c.card.classList.toggle('spell-off', learnedSpell && !isSpellActive(state, id));
    c.card.classList.toggle('horde', !!node.horde);
    c.button.disabled = learnedSpell
      ? !isSpellActive(state, id) && !canCastSpell(state, id)
      : maxed || !!building || !available || !canAfford(state, nodeCost(state, id, mods));
  }
}
