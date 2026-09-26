import {
  ACHIEVEMENTS,
  ACHIEVEMENT_ORDER,
  AGES,
  BUILDING_GROUPS,
  DEMONS,
  DEPOSITS,
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
  WORLDS,
  WORLD_ORDER,
} from '../engine/content';
import {
  activeLinks,
  arrivalBlocker,
  arrivalRate,
  crowdingFactor,
  depositRegrowth,
  depositMax,
  nextDepositMax,
  depositGrowthPerReset,
  pollutionFactor,
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
  computeModifiers,
  echoGain,
  canResetWorld,
  activeBuilds,
  buildSlots,
  hasFreeBuildSlot,
  land,
  landUsed,
  needsLand,
  needsPeople,
  resetBlocker,
  isHordeActive,
  effectiveAmount,
  isHelpful,
  isSpellActive,
  canCastSpell,
  spellToReplace,
  toggleSpell,
  isNodeAvailable,
  isResearchListed,
  canSwitchOff,
  isSwitchedOff,
  toggleBuilding,
  isBuildingListed,
  researchTreeColumns,
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
  isResearch,
  startResearch,
  stopResearch,
  canStartResearch,
  researchNeeded,
  researchUpfrontCost,
  researchSecondsLeft,
  resourceCap,
  accidentChance,
  accidentRate,
  wastedWorkers,
  ageTechs,
  ageTechsLeft,
  currentAge,
  decayRate,
  eatingRate,
  isStarving,
  starvationRate,
  isOverflowing,
  costOverCap,
} from '../engine/engine';
import { formatDuration, formatNumber, formatPerHour } from '../engine/format';
import type { AchievementId, DepositId, GameState, JobId, MetaId, NodeId, ResourceId, WorldId } from '../engine/types';
import { describeEffect } from './describe';
import { gameGuide } from './guide';

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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

const RESET_WIPES: Record<WorldId, string> = {
  realm: 'buildings, people and jobs',
  arcana: 'buildings and discoveries',
  lab: 'buildings and techs',
};

type Tab = WorldId | 'shop' | 'achievements' | 'guide';
const TABS: Tab[] = [...WORLD_ORDER, 'shop', 'achievements', 'guide'];
const TAB_NAMES: Record<Exclude<Tab, WorldId>, string> = { shop: 'Echo shop', achievements: 'Achievements', guide: 'Guide' };
const TAB_KEY = 'incremental-worlds-tab';

function loadTab(): Tab {
  try {
    const saved = localStorage.getItem(TAB_KEY);
    if (saved && (TABS as string[]).includes(saved)) return saved as Tab;
  } catch {
    // Storage can be blocked; fall back to the first tab.
  }
  return 'realm';
}

interface TabButton {
  button: HTMLButtonElement;
  label: HTMLElement;
  note: HTMLElement;
}

const echoesLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? 'Echo' : 'Echoes'}`;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** For a repeatable tech, which level is being researched: "Level 4 of 10 · ". Empty for one-level techs. */
function nextLevel(state: GameState, id: NodeId): string {
  const max = maxLevel(id);
  return max > 1 ? `Level ${state.nodes[id] + 1} of ${max} · ` : '';
}

/** What owning a node opens up: the buildings, techs and jobs that require it. Empty when nothing does. */
function unlocksHtml(id: NodeId): string {
  const from = NODES[id].world;
  const tagged = (world: WorldId, name: string) =>
    (world !== from ? `<span class="tag tag-${world}">${WORLDS[world].name}</span> ` : '') + escape(name);
  const items = [
    ...NODE_ORDER.filter((n) => NODES[n].requires?.includes(id)).map((n) => tagged(NODES[n].world, NODES[n].name)),
    ...JOB_ORDER.filter((j) => JOBS[j].requires?.includes(id)).map((j) => tagged('realm', `${JOBS[j].name} job`)),
  ];
  return items.length ? `Unlocks: ${items.join(', ')}` : '';
}

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
  /** On/off switch for buildings that consume resources. */
  power: HTMLButtonElement | null;
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
  idle: HTMLElement;
  idleCount: HTMLElement;
  idleHint: HTMLElement;
  jobs: Record<JobId, JobRow>;
}

interface WorldView {
  panel: HTMLElement;
  locked: HTMLElement;
  lockedProgress: HTMLElement;
  body: HTMLElement;
  resources: Partial<Record<ResourceId, ResourceRow>>;
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
  private landEl = h('div', { class: 'land' });
  private deposits = Object.fromEntries(
    DEPOSIT_ORDER.map((d): [DepositId, HTMLElement] => [d, h('div', { class: `deposit deposit-${d}` })]),
  ) as Record<DepositId, HTMLElement>;
  private echoes: HTMLElement;
  private treeDialog = h('dialog', { class: 'tech-tree' });
  private researchStatus = h('p', { class: 'research-status' });
  private ageStatus = h('p', { class: 'age-status' });
  /** The Realm's building groups, hidden while none of their buildings are listed. */
  private buildingGroups: { section: HTMLElement; ids: NodeId[] }[] = [];
  private treeBody = h('div', { class: 'tree-columns' });
  private shop: HTMLElement;
  private shopHint: HTMLElement;
  private tabs = {} as Record<Tab, TabButton>;
  private tab: Tab = loadTab();
  private achievementPanel!: HTMLElement;
  private guidePanel!: HTMLElement;
  private achievementCards = {} as Record<AchievementId, { card: HTMLElement; status: HTMLElement; bar: HTMLElement }>;
  /** Per world: the on/off switches for buildings that consume resources, listed in the side column. */
  private switches = {} as Record<WorldId, HTMLElement>;
  private logList = h('ol', { class: 'log-list' });

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
    this.shop = h('section', { class: 'shop', role: 'tabpanel' }, h('h2', {}, 'Echo shop'), this.shopHint, shopGrid);
    worldsEl.append(this.shop, this.buildAchievements(), this.buildGuide());

    const nav = h('nav', { class: 'tabs', role: 'tablist' });
    for (const tab of TABS) nav.append(this.buildTab(tab));

    const closeTree = h('button', { class: 'link-button tree-close', type: 'button' }, 'Close');
    closeTree.addEventListener('click', () => this.treeDialog.close());
    // A click on the backdrop (outside the box) closes it too.
    this.treeDialog.addEventListener('click', (e) => {
      if (e.target === this.treeDialog) this.treeDialog.close();
    });
    this.treeDialog.append(
      h('div', { class: 'tree-head' }, h('h2', {}, 'Research tree'), closeTree),
      h('p', { class: 'muted small' }, 'Every Lab tech, one column per age. The last tech of an age needs all the others, and opens the next age.'),
      this.treeBody,
    );

    root.replaceChildren(header, nav, worldsEl, this.treeDialog);
    this.selectTab(this.tab);
  }

  private buildTab(tab: Tab): HTMLElement {
    const label = h('span', { class: 'tab-label' }, tab in WORLDS ? WORLDS[tab as WorldId].name : TAB_NAMES[tab as Exclude<Tab, WorldId>]);
    const note = h('span', { class: 'tab-note' });
    const button = h('button', { class: `tab tab-${tab}`, type: 'button', role: 'tab' }, label, note);
    button.addEventListener('click', () => this.selectTab(tab));
    this.tabs[tab] = { button, label, note };
    return button;
  }

  private tabPanel(tab: Tab): HTMLElement {
    if (tab === 'shop') return this.shop;
    if (tab === 'achievements') return this.achievementPanel;
    if (tab === 'guide') return this.guidePanel;
    return this.worlds[tab].panel;
  }

  private selectTab(tab: Tab) {
    this.tab = tab;
    for (const t of TABS) {
      const on = t === tab;
      setHidden(this.tabPanel(t), !on);
      this.tabs[t].button.classList.toggle('active', on);
      this.tabs[t].button.setAttribute('aria-selected', String(on));
    }
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      // Remembering the tab is only a convenience.
    }
  }

  /** Tab labels carry a short status so you can tell when another world needs you. */
  private renderTabs(mods: Modifiers) {
    const state = this.state;
    for (const world of WORLD_ORDER) {
      const { button, note } = this.tabs[world];
      const open = isWorldUnlocked(state, world);
      let text: string;
      let attention = false;
      if (!open) text = '🔒';
      else if (world === 'realm') {
        const idle = idleWorkers(state);
        text = `${Math.floor(state.population)} people`;
        if (idle > 0) text += ` · ${idle} idle`;
        attention = idle > 0 || arrivalBlocker(state, mods) === 'food' || isStarving(state, mods);
      } else if (world === 'lab') {
        const id = state.researching;
        const idleResearch = !id && netRate(state, mods, 'research') > 0;
        text = id ? NODES[id].name : idleResearch ? 'nothing researched' : '';
        attention = idleResearch;
      } else {
        const on = NODE_ORDER.filter((id) => NODES[id].world === world && NODES[id].spell && isSpellActive(state, id));
        text = on.length ? on.map((id) => NODES[id].name).join(', ') : '';
      }
      setText(note, text);
      button.classList.toggle('is-locked', !open);
      button.classList.toggle('attention', attention);
    }
    const shop = this.tabs.shop;
    const affordable = META_ORDER.some((id) => canBuyMeta(state, id));
    setText(shop.note, `${formatNumber(state.echoes)} ✦`);
    shop.button.classList.toggle('attention', affordable);
    setText(this.tabs.achievements.note, `${state.achievements.length} / ${ACHIEVEMENT_ORDER.length} reached`);
  }

  /** Every building, tech, job and rule, built once from the game content (the same source as GAME_CONTENT.md). */
  private buildGuide(): HTMLElement {
    const sections = gameGuide().map((s, i) => {
      const body: HTMLElement[] = [];
      if (s.intro) body.push(h('p', { class: 'muted' }, s.intro));
      if (s.list) body.push(h('ul', { class: 'guide-list' }, ...s.list.map((l) => h('li', {}, l))));
      if (s.table) {
        const table = h(
          'table',
          { class: 'guide-table' },
          h('thead', {}, h('tr', {}, ...s.table.columns.map((c) => h('th', {}, c)))),
          h('tbody', {}, ...s.table.rows.map((row) => h('tr', {}, ...row.map((c) => h('td', {}, c))))),
        );
        body.push(h('div', { class: 'guide-scroll' }, table));
      }
      return h('details', { class: 'guide-section', ...(i < 2 ? { open: '' } : {}) }, h('summary', {}, s.title), ...body);
    });

    const search = h('input', { class: 'guide-search', type: 'search', placeholder: 'Search the guide, e.g. "Warehouse" or "pollution"' });
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      for (const section of sections) {
        let hits = 0;
        for (const row of section.querySelectorAll<HTMLElement>('tbody tr, .guide-list li')) {
          const show = !q || (row.textContent ?? '').toLowerCase().includes(q);
          row.hidden = !show;
          if (show) hits++;
        }
        const titleHit = !!q && (section.querySelector('summary')?.textContent ?? '').toLowerCase().includes(q);
        if (titleHit) for (const row of section.querySelectorAll<HTMLElement>('tbody tr, .guide-list li')) row.hidden = false;
        section.hidden = !!q && hits === 0 && !titleHit;
        if (q) section.open = true;
      }
    });

    this.guidePanel = h(
      'section',
      { class: 'guide', role: 'tabpanel' },
      h('h2', {}, 'Guide'),
      h('p', { class: 'muted' }, 'Everything in the game, read straight from its content: costs, effects and what each thing needs.'),
      search,
      ...sections,
    );
    return this.guidePanel;
  }

  private buildAchievements(): HTMLElement {
    const grid = h('div', { class: 'achievement-grid' });
    for (const id of ACHIEVEMENT_ORDER) {
      const def = ACHIEVEMENTS[id];
      const status = h('span', { class: 'achievement-status' });
      const bar = h('div', { class: 'achievement-bar' });
      const card = h(
        'div',
        { class: 'achievement' },
        h('div', { class: 'node-title' }, h('span', { class: 'node-name' }, def.name), status),
        h('div', { class: 'achievement-goal' }, def.goal),
        bar,
        h('div', { class: 'achievement-reward' }, 'Reward: ' + def.reward),
      );
      grid.append(card);
      this.achievementCards[id] = { card, status, bar };
    }
    this.achievementPanel = h(
      'section',
      { class: 'achievements', role: 'tabpanel' },
      h('h2', {}, 'Achievements'),
      h('p', { class: 'muted' }, 'Goals to reach across all your runs. Once reached they stay reached, and their rewards last through every reset.'),
      grid,
    );
    return this.achievementPanel;
  }

  private renderAchievements(mods: Modifiers) {
    const state = this.state;
    for (const id of ACHIEVEMENT_ORDER) {
      const { card, status, bar } = this.achievementCards[id];
      const done = state.achievements.includes(id);
      const [current, target] = ACHIEVEMENTS[id].progress(state, mods);
      card.classList.toggle('done', done);
      setText(status, done ? '✓ Reached' : `${formatNumber(Math.min(current, target))} / ${formatNumber(target)}`);
      bar.style.setProperty('--progress', `${done ? 100 : Math.min(100, (current / target) * 100).toFixed(1)}%`);
    }
  }

  private buildWorld(world: WorldId): HTMLElement {
    const def = WORLDS[world];
    const lockedProgress = h('p', { class: 'muted' });
    const locked = h('div', { class: 'locked' }, h('p', {}, '🔒 ' + def.unlockHint), lockedProgress);

    const resources: WorldView['resources'] = {};
    const resList = h('div', { class: 'resources' });
    for (const r of RESOURCE_ORDER) {
      const rd = RESOURCES[r];
      if (rd.world !== world) continue;
      const amount = h('span', { class: 'amount' });
      const rate = h('span', { class: 'rate' });
      const row = h('div', { class: 'resource' }, h('span', { class: 'name' }, rd.name), amount, rate);
      resList.append(row);
      resources[r] = { row, amount, rate };
    }

    const populationEl = world === 'realm' ? this.buildPopulation() : null;
    const switchList = h('div', { class: 'switch-list' });
    this.switches[world] = h(
      'div',
      { class: 'switches' },
      h('h3', {}, 'Switches'),
      h('p', { class: 'muted small' }, 'Buildings that use up resources. Switch one off to stop its upkeep and its output.'),
      switchList,
    );

    const buildings = h('div', { class: world === 'realm' ? 'building-groups' : 'nodes' });
    const techs = h('div', { class: 'nodes' });
    const spells = h('div', { class: 'nodes' });
    // The Realm has many buildings: they are shown in groups, each with its own heading.
    const groupOf = new Map<NodeId, HTMLElement>();
    if (world === 'realm') {
      for (const group of BUILDING_GROUPS) {
        const grid = h('div', { class: 'nodes' });
        const section = h('div', { class: 'building-group' }, h('h4', {}, group.name), grid);
        buildings.append(section);
        this.buildingGroups.push({ section, ids: group.ids });
        for (const id of group.ids) groupOf.set(id, grid);
      }
    }
    for (const id of NODE_ORDER) {
      const node = NODES[id];
      if (node.world !== world) continue;
      const home = node.spell ? spells : node.kind === 'tech' ? techs : (groupOf.get(id) ?? buildings);
      home.append(this.buildNode(id, switchList));
    }

    const incoming = h('ul', { class: 'links' });
    const outgoing = h('ul', { class: 'links' });
    const resetButton = h('button', { class: 'reset', type: 'button' });
    const resetNote = h('p', { class: 'muted small' });
    resetButton.addEventListener('click', () => {
      const gain = echoGain(this.state, world);
      const msg =
        `Reset ${def.name}? Its resources and ${RESET_WIPES[world]} go back to zero, ` +
        `along with its effects on the other worlds (except what is kept for good, like Library Research). You gain ${echoesLabel(gain)}.`;
      if (!canResetWorld(this.state, world)) return;
      if (confirm(msg)) {
        resetWorld(this.state, world);
        this.hooks.onChange();
      }
    });

    const side = h(
      'aside',
      { class: 'world-side' },
      ...(world === 'realm'
        ? [h('div', { class: 'deposits' }, this.landEl, ...DEPOSIT_ORDER.map((d) => this.deposits[d]))]
        : []),
      ...(populationEl ? [populationEl] : []),
      this.switches[world],
      ...(world === 'realm'
        ? [h('details', { class: 'log-box', open: '' }, h('summary', {}, 'Chronicle'), this.logList)]
        : []),
      h('details', { class: 'link-box', open: '' }, h('summary', {}, 'Effects from other worlds'), incoming),
      h('details', { class: 'link-box', open: '' }, h('summary', {}, 'Effects this world sends out'), outgoing),
      h('div', { class: 'reset-box' }, resetButton, resetNote),
    );

    const main = h(
      'div',
      { class: 'world-main' },
      h('h3', {}, 'Buildings'),
      buildings,
      ...(techs.childElementCount
        ? [h('h3', {}, world === 'arcana' ? 'Discoveries' : 'Research'), ...(world === 'lab' ? [this.ageStatus, this.researchStatus, this.treeButton()] : []), techs]
        : []),
      ...(spells.childElementCount
        ? [h('h3', {}, 'Spells'), h('p', { class: 'muted small' }, 'Learn a spell once, then click it to switch it on or off. It only costs upkeep while on. Only one spell can be on at a time (Multicast in the Echo shop adds more), so switching one on swaps out the oldest. Summon Demons is the exception: it takes no slot, but once cast it runs until the Realm is down to 2 survivors.'), spells]
        : []),
    );

    const body = h('div', { class: 'world-body' }, resList, h('div', { class: 'world-columns' }, side, main));

    const panel = h(
      'section',
      { class: `world world-${world}`, role: 'tabpanel' },
      h('div', { class: 'world-head' }, h('h2', {}, def.name), h('p', { class: 'tagline' }, def.tagline)),
      locked,
      body,
    );
    this.worlds[world] = { panel, locked, lockedProgress, body, resources, incoming, outgoing, resetButton, resetNote };
    return panel;
  }

  private treeButton(): HTMLElement {
    const button = h('button', { class: 'reset tree-button', type: 'button' }, 'Show full research tree');
    button.addEventListener('click', () => {
      this.renderTree(computeModifiers(this.state));
      this.treeDialog.showModal();
    });
    return h('p', { class: 'small' }, h('span', { class: 'muted' }, 'Only research you can start now is listed. '), button);
  }

  private renderTree(mods: Modifiers) {
    const state = this.state;
    const now = currentAge(state);
    const cols = researchTreeColumns().map((ids, col) => {
      const age = col + 1;
      const done = ids.filter((id) => state.nodes[id] > 0).length;
      const head =
        `<div class="tree-age${age === now ? ' tree-age-now' : age > now ? ' tree-age-later' : ''}">` +
        `<span>Age ${ROMAN[col]}: ${escape(AGES[col]!)}</span><span>${done} / ${ids.length}</span></div>`;
      const items = ids.map((id) => {
        const node = NODES[id];
        const level = state.nodes[id];
        const max = maxLevel(id);
        const busy = state.researching === id;
        const done = level >= max;
        const open = !done && isNodeAvailable(state, id);
        const cls = busy ? 'busy' : done ? 'done' : open ? 'open' : level > 0 ? 'open' : 'locked';
        const progress = state.researchProgress[id];
        const pct = progress === undefined ? 0 : Math.floor((progress / Math.max(1e-9, researchNeeded(state, id, mods))) * 100);
        const status = busy
          ? `${nextLevel(state, id)}Researching ${pct}%`
          : progress !== undefined
            ? `${nextLevel(state, id)}Paused at ${pct}%`
            : done
            ? 'Researched'
            : max > 1
              ? `${level} / ${max} done`
              : open
                ? 'Available'
                : 'Locked';
        const cost = done
          ? ''
          : Object.entries(nodeCost(state, id, mods))
              .map(([r, n]) => `${formatNumber(n)} ${RESOURCES[r as ResourceId].name}`)
              .join(' · ');
        const effects = node.effects
          .map((e) => {
            const to = statWorld(e.stat);
            const tag = to !== 'lab' ? `<span class="tag tag-${to}">${WORLDS[to].name}</span> ` : '';
            const amount = effectiveAmount(state, e, 'lab');
            return `<li class="${isHelpful({ ...e, amount }) ? '' : 'bad'}">${tag}${escape(describeEffect(e, amount))}</li>`;
          })
          .join('');
        const needs = node.capstone
          ? `<span class="${ageTechsLeft(state, age).filter((t) => t !== id).length ? 'unmet' : 'met'}">every other ${escape(AGES[col]!)} tech</span>`
          : (node.requires ?? [])
              .map((req) => {
                const w = NODES[req].world;
                const tag = w !== 'lab' ? `<span class="tag tag-${w}">${WORLDS[w].name}</span> ` : '';
                return `<span class="${state.nodes[req] > 0 ? 'met' : 'unmet'}">${tag}${escape(NODES[req].name)}</span>`;
              })
              .join(', ');
        return (
          `<div class="tree-node tree-${cls}">` +
          `<div class="tree-title"><span class="tree-name">${escape(node.name)}</span><span class="tree-status">${status}</span></div>` +
          (effects ? `<ul class="tree-effects">${effects}</ul>` : '') +
          (cost ? `<div class="tree-cost">${cost}</div>` : '') +
          (needs ? `<div class="tree-needs">Needs ${needs}</div>` : '') +
          `</div>`
        );
      });
      return `<div class="tree-column">${head}${items.join('')}</div>`;
    });
    setHtml(this.treeBody, cols.join(''));
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
    const idleCount = h('span', { class: 'idle-count' });
    const idleHint = h('span', { class: 'idle-hint' });
    const idle = h('div', { class: 'idle-box' }, idleCount, idleHint);
    this.population = { summary, idle, idleCount, idleHint, jobs };
    return h('div', { class: 'population' }, h('h3', {}, 'People'), summary, idle, list);
  }

  private renderDeposits(mods: Modifiers) {
    const state = this.state;
    const total = land(state, mods);
    const used = landUsed(state);
    this.landEl.style.setProperty('--used', `${Math.min(100, (used / total) * 100).toFixed(1)}%`);
    setText(
      this.landEl,
      `🗺️ Land: ${used} / ${formatNumber(total)} squares used` +
        (used >= total ? ' · explore in the Lab (Cartography, Expeditions) to build more' : ''),
    );
    this.landEl.classList.toggle('attention', used >= total);
    const smog = 1 - pollutionFactor(mods);
    for (const id of DEPOSIT_ORDER) {
      const el = this.deposits[id];
      const shown = isResourceRevealed(state, id);
      setHidden(el, !shown);
      if (!shown) continue;
      const def = DEPOSITS[id];
      const d = state.deposits[id];
      const max = depositMax(state, mods, id);
      el.style.setProperty('--left', `${((max > 0 ? Math.min(1, d.left / max) : 0) * 100).toFixed(1)}%`);
      const refill = depositRegrowth(mods, id);
      const name = RESOURCES[id].name;
      if (max <= 0) {
        // Stone and Clay only exist once a Quarry or Clay Pit opens them up.
        const opener = NODE_ORDER.map((n) => ({ n, e: NODES[n].effects.find((e) => e.stat === `size:${id}` && e.amount > 0) })).find((o) => o.e);
        setText(
          el,
          `${def.icon} ${def.name}: none yet` +
            (opener ? ` · each ${NODES[opener.n].name} opens up ${formatNumber(opener.e!.amount)} ${name}` : ''),
        );
        el.classList.remove('attention');
        continue;
      }
      let text = `${def.icon} ${def.name}: ${formatNumber(Math.min(d.left, max))} / ${formatNumber(max)} ${name}`;
      if (d.left < 1) {
        text += refill > 0 ? ` · used up: ${name} only comes as fast as it refills` : ` · used up: no more ${name} this run`;
      }
      // The refill rate gets a line of its own.
      if (refill > 0) {
        text += `\n↻ ${id === 'wood' ? 'Regrows' : 'Refills'} ${formatNumber(refill)} ${name}/s`;
        if (def.pollutionSlows && smog >= 0.005) text += ` (pollution −${Math.round(smog * 100)}%)`;
      }
      setText(el, text);
      el.classList.toggle('attention', d.left < 1);
    }
  }

  private renderPopulation(mods: Modifiers) {
    const state = this.state;
    const { summary, jobs } = this.population;
    const cap = housing(mods);
    const people = Math.floor(state.population);
    const idle = idleWorkers(state);
    const starving = isStarving(state, mods);
    let text = starving
      ? `STARVING: someone dies about every ${formatDuration(1 / starvationRate(mods))} until there is Food · `
      : '';
    text += `${people} / ${formatNumber(cap)} people · eating ${formatNumber(eatingRate(state))} Food/s`;
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
    const slowed = 1 - crowdingFactor(mods);
    if (slowed >= 0.005) text += ` · crowding slows growth by ${Math.round(slowed * 100)}%`;
    const smog = 1 - pollutionFactor(mods);
    if (smog >= 0.005) text += ` · pollution slows growth by ${Math.round(smog * 100)}%`;
    const deaths = deathRate(mods) * 3600;
    if (deaths > 0) {
      const horde = state.demons > 0 ? `${formatNumber(Math.floor(state.demons))} demons` : 'demons';
      text += ` · ${horde} kill ${formatPerHour(deaths)}`;
    }
    const accidents = accidentRate(state, mods);
    if (accidents > 0) text += ` · work accidents kill ~${formatPerHour(accidents)}`;
    setText(summary, text);
    summary.classList.toggle('attention', blocker === 'food' || starving);
    summary.classList.toggle('starving', starving);
    const { idle: idleBox, idleCount, idleHint } = this.population;
    setText(idleCount, `${idle} idle ${idle === 1 ? 'worker' : 'workers'}`);
    setText(idleHint, idle > 0 ? 'Use + below to give them a job (Shift+click assigns all)' : `All ${people} people are working`);
    idleBox.classList.toggle('has-idle', idle > 0);

    for (const id of JOB_ORDER) {
      const row = jobs[id];
      const job = JOBS[id];
      const available = isJobAvailable(state, id);
      setHidden(row.row, !available);
      if (!available) continue;
      setText(row.count, String(state.jobs[id]));
      const wasted = wastedWorkers(state, mods, id);
      const name = RESOURCES[job.resource].name;
      row.count.classList.toggle('wasted', !!wasted);
      row.count.title =
        wasted === 'full'
          ? `${name} storage is full, so what these workers make is lost. Build more storage or move them.`
          : wasted === 'depleted'
            ? `The ${name} deposit is used up. It only regrows ${formatNumber(depositRegrowth(mods, job.resource as DepositId))}/s, ` +
              `which fewer workers could keep up with. Move the rest to other jobs.`
            : '';
      const parts = [
        `<span>+${formatNumber(jobOutput(mods, id))} ${RESOURCES[job.resource].name}/s each</span>`,
        `<span class="risk" title="Chance per minute that each worker in this job dies in an accident">☠ ${formatNumber((accidentChance(mods, id) / 60) * 100)}%/min</span>`,
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

  private buildNode(id: NodeId, switchList: HTMLElement): HTMLElement {
    const node = NODES[id];
    const level = h('span', { class: 'level' });
    const cost = h('div', { class: 'cost' });
    const effects = h('ul', { class: 'effects' });
    const needs = h('div', { class: 'needs' });
    const time = h('div', { class: 'build-time' });
    const unlocks = h('div', { class: 'unlocks' });
    unlocks.innerHTML = unlocksHtml(id);
    const button = h(
      'button',
      { class: 'node-button', type: 'button' },
      h('div', { class: 'node-title' }, h('span', { class: 'node-name' }, node.name), level),
      h('div', { class: 'node-desc' }, node.description),
      effects,
      unlocks,
      h('div', { class: 'node-meta' }, cost, time),
      needs,
    );
    button.addEventListener('click', () => {
      if (NODES[id].horde && this.state.nodes[id] > 0 && canCastSpell(this.state, id)) {
        const ok = confirm(
          'Summon Demons? This cannot be undone. The horde doubles every 3 minutes, boosting Arcana while it ' +
            'kills the Realm\'s people, and only ends when 2 survivors are left (or you reset the Realm). ' +
            'While it runs, Arcana cannot be reset.',
        );
        if (ok) toggleSpell(this.state, id);
      } else if (NODES[id].spell && this.state.nodes[id] > 0) toggleSpell(this.state, id);
      else if (isResearch(id)) {
        if (this.state.researching === id) stopResearch(this.state);
        else if (!startResearch(this.state, id)) return;
      } else if (!buyNode(this.state, id)) return;
      this.hooks.onChange();
    });
    const card = h('div', { class: `node node-${node.kind}` }, button);
    let power: HTMLButtonElement | null = null;
    if (canSwitchOff(id)) {
      power = h('button', { class: 'power', type: 'button' });
      power.addEventListener('click', () => {
        toggleBuilding(this.state, id);
        this.hooks.onChange();
      });
      switchList.append(power);
    }
    this.nodes[id] = { card, button, level, cost, effects, needs, time, power };
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
    this.renderDeposits(mods);
    for (const id of NODE_ORDER) this.renderNode(id, mods);
    if (this.treeDialog.open) this.renderTree(mods);
    this.renderTabs(mods);
    this.renderSwitches();
    for (const g of this.buildingGroups) setHidden(g.section, g.ids.every((id) => this.nodes[id].card.hidden));
    this.renderLog();
    this.renderAchievements(mods);

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

  private renderLog() {
    const log = this.state.log;
    const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHtml(
      this.logList,
      log.length
        ? [...log]
            .reverse()
            .map((e) => `<li class="log-${e.kind}"><time>${time(e.time)}</time> ${escape(e.text)}</li>`)
            .join('')
        : '<li class="muted">Nothing has happened yet. Everyone who joins the village or dies is written down here.</li>',
    );
  }

  private renderSwitches() {
    const state = this.state;
    const shown = {} as Record<WorldId, boolean>;
    for (const id of NODE_ORDER) {
      const power = this.nodes[id].power;
      if (!power) continue;
      const owned = state.nodes[id] > 0;
      setHidden(power, !owned);
      if (!owned) continue;
      shown[NODES[id].world] = true;
      const off = isSwitchedOff(state, id);
      setText(power, `⏻ ${NODES[id].name}${state.nodes[id] > 1 ? ' ×' + state.nodes[id] : ''}: ${off ? 'Off' : 'On'}`);
      power.title = off ? 'Click to switch on' : 'Click to switch off';
      power.classList.toggle('is-off', off);
    }
    for (const world of WORLD_ORDER) setHidden(this.switches[world], !shown[world]);
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
      const missing = bridge ? (NODES[bridge].requires ?? []).filter((r) => NODES[r].world !== 'realm' && state.nodes[r] <= 0) : [];
      setText(
        v.lockedProgress,
        [
          need ? `Realm buildings: ${buildingCount(state, 'realm')} / ${need}` : '',
          ...missing.map((r) => `${NODES[r].name} (${WORLDS[NODES[r].world].name}): not yet`),
        ]
          .filter(Boolean)
          .join(' · '),
      );
      return;
    }

    for (const r of RESOURCE_ORDER) {
      const row = v.resources[r];
      if (!row) continue;
      const shown = isResourceRevealed(state, r);
      setHidden(row.row, !shown);
      if (!shown) continue;
      // Research never piles up: it streams straight into the research target.
      const cap = resourceCap(mods, r);
      const capped = Number.isFinite(cap);
      setText(
        row.amount,
        r === 'research' ? '' : formatNumber(state.resources[r]) + (capped ? ` / ${formatNumber(cap)}` : ''),
      );
      const rate = netRate(state, mods, r);
      // At the cap, anything more made is lost, so the rate would only mislead.
      const full = capped && isOverflowing(state, r);
      setText(row.rate, full ? 'full' : rate === 0 ? '' : `${rate > 0 ? '+' : ''}${formatNumber(rate)}/s`);
      row.rate.classList.toggle('negative', rate < 0);
      row.rate.classList.toggle('full', full);
      const decay = decayRate(state, mods, r);
      row.row.title = capped
        ? `Holds at most ${formatNumber(cap)} ${RESOURCES[r].name}. More is lost; storage buildings raise the limit.` +
          (decay > 0 ? ` Spoiling in Warehouses: ${formatNumber(decay)}/s (included in the rate).` : '')
        : '';
    }

    if (world === 'lab') this.renderResearchStatus(mods);

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
        world === 'realm'
          ? depositGrowthPerReset(state) > 0
            ? `The forest comes back full and bigger by ${Math.round(depositGrowthPerReset(state) * 100)}% of the Wood cut this run: ` +
              `${formatNumber(nextDepositMax(state, 'wood'))} Wood. Quarries, Clay Pits and mines are gone, and their deposits with them.`
            : 'The forest comes back full, at the same size (Rich Earth in the Echo shop makes it grow). Quarries, Clay Pits and mines are gone, and their deposits with them.'
          : '',
        harms && !blocker ? `Clears ${harms} harmful effect${harms === 1 ? '' : 's'} on other worlds.` : '',
        kept.length ? `Keeps: ${kept.map((id) => NODES[id].name).join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  private renderResearchStatus(mods: Modifiers) {
    const state = this.state;
    const age = currentAge(state);
    const techs = ageTechs(age);
    const done = techs.filter((t) => state.nodes[t] > 0).length;
    setText(
      this.ageStatus,
      `Age ${ROMAN[age - 1]}: ${AGES[age - 1]} · ${done} of ${techs.length} techs researched` +
        (done === techs.length ? ' · every age is done' : ''),
    );
    const id = state.researching;
    const rate = netRate(state, mods, 'research');
    if (id) {
      const need = researchNeeded(state, id, mods);
      const secs = researchSecondsLeft(state, mods);
      setText(
        this.researchStatus,
        `Researching ${NODES[id].name}${maxLevel(id) > 1 ? ` (level ${state.nodes[id] + 1} of ${maxLevel(id)})` : ''}: ${formatNumber(state.researchProgress[id] ?? 0)} / ${formatNumber(need)} Research` +
          (Number.isFinite(secs) ? ` · ${formatDuration(secs)} left` : ' · no Research coming in'),
      );
    } else {
      setText(
        this.researchStatus,
        rate > 0
          ? `Nothing is being researched: pick a tech below. ${formatNumber(rate)} Research/s is going to waste.`
          : 'Pick a tech below to research. Research streams into it as it is made; it never piles up.',
      );
    }
    this.researchStatus.classList.toggle('attention', !id && rate > 0);
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
    // Lab research only lists what you can start now; the full tree has its own view.
    // Buildings stay hidden until everything they require is unlocked.
    const shown =
      node.kind === 'tech' && node.world === 'lab'
        ? isResearchListed(state, id)
        : node.kind === 'building'
          ? isBuildingListed(state, id)
          : isWorldUnlocked(state, node.world) && (available || level > 0 || frontier);
    setHidden(c.card, !shown);
    if (!shown) return;

    const max = maxLevel(id);
    const maxed = level >= max;
    const building = state.construction[id];
    const research = isResearch(id);
    const target = research && state.researching === id;
    const progress = research ? state.researchProgress[id] : undefined;
    const researchPct = progress === undefined ? 0 : Math.min(100, (progress / Math.max(1e-9, researchNeeded(state, id, mods))) * 100);
    if (target) {
      c.button.style.setProperty('--progress', `${researchPct.toFixed(1)}%`);
      const secs = researchSecondsLeft(state, mods);
      setText(c.level, `${nextLevel(state, id)}Researching ${Math.floor(researchPct)}%${Number.isFinite(secs) ? ' · ' + formatDuration(secs) : ''} · click to pause`);
    } else if (progress !== undefined) {
      setText(c.level, `${nextLevel(state, id)}Paused at ${Math.floor(researchPct)}%`);
    } else if (building) {
      const pct = Math.min(100, (building.done / building.needed) * 100);
      c.button.style.setProperty('--progress', `${pct.toFixed(1)}%`);
      const verb = node.kind === 'building' ? 'Building' : node.world === 'arcana' ? 'Discovering' : 'Researching';
      setText(c.level, `${verb}… ${formatDuration(constructionSecondsLeft(state, id, mods))}`);
    } else if (node.horde && level > 0) {
      const on = isSpellActive(state, id);
      const n = Math.floor(state.demons);
      setText(c.level, on ? `${formatNumber(n)} demon${n === 1 ? '' : 's'} · no way back` : 'Not summoned');
    } else if (node.spell && level > 0) {
      const on = isSpellActive(state, id);
      const eff = state.efficiency[id] ?? 1;
      const swap = on ? null : spellToReplace(state);
      setText(
        c.level,
        on ? (eff < 0.999 ? `On · ${Math.round(eff * 100)}% power` : 'On') : swap ? `Off · swaps out ${NODES[swap].name}` : 'Off',
      );
    } else if (node.kind === 'tech' && max > 1) {
      setText(c.level, `${level} / ${max} done`);
    } else if (node.kind === 'tech') {
      setText(c.level, level > 0 ? (node.world === 'arcana' ? 'Discovered' : 'Researched') : '');
    } else {
      setText(c.level, String(level));
    }
    c.card.classList.toggle('switched-off', !!c.power && isSwitchedOff(state, id) && level > 0);
    c.card.classList.toggle('constructing', !!building || target);
    c.card.classList.toggle('owned', node.kind === 'tech' && maxed);

    const effectsHtml = node.effects
      .map((e) => {
        const to = statWorld(e.stat);
        const cross = to !== node.world;
        const amount = effectiveAmount(state, e, node.world);
        const helpful = isHelpful({ ...e, amount });
        const tag = cross ? `<span class="tag tag-${to}">${WORLDS[to].name}</span> ` : '';
        const per = node.kind === 'building' ? ' each' : node.horde ? ' per demon' : '';
        return `<li class="${cross ? (helpful ? 'good' : 'bad') : helpful ? '' : 'bad'}">${tag}${escape(describeEffect(e, amount))}${per}</li>`;
      })
      .concat(
        node.upkeep
          ? Object.entries(node.upkeep).map(
              ([r, n]) => {
                const from = RESOURCES[r as ResourceId].world;
                const tag = from !== node.world ? `<span class="tag tag-${from}">${WORLDS[from].name}</span> ` : '';
                const when = node.spell ? ' while on' : ' each';
                return `<li class="${tag ? 'bad' : 'upkeep'}">${tag}Uses ${formatNumber(n)} ${RESOURCES[r as ResourceId].name}/s${when}</li>`;
              },
            )
          : [],
      )
      .concat(node.unlocksWorld && !isWorldUnlocked(state, node.unlocksWorld) ? [`<li class="good">Opens ${WORLDS[node.unlocksWorld].name}</li>`] : [])
      .concat(
        // Lasting techs reset with the Lab, but what they found is kept: show the running total.
        node.lasting && (state.lasting[id] ?? 0) > 0
          ? node.effects.map(
              (e) => `<li class="good">Kept for good: ${escape(describeEffect(e, e.amount * (state.lasting[id] ?? 0)))} so far</li>`,
            )
          : [],
      )
      .join('');
    setHtml(c.effects, effectsHtml);

    if (maxed) {
      setHtml(c.cost, '');
    } else if (research) {
      const upfront = progress === undefined ? researchUpfrontCost(state, id, mods) : {};
      const parts = [`${formatNumber(researchNeeded(state, id, mods))} Research`];
      for (const [r, n] of Object.entries(upfront) as [ResourceId, number][]) {
        parts.push(`<span class="${state.resources[r] < n ? 'short' : ''}">${formatNumber(n)} ${RESOURCES[r].name}</span>`);
      }
      setHtml(c.cost, parts.join(' · ') + (Object.keys(upfront).length ? ' <span class="muted">(paid when started)</span>' : ''));
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

    if (research) {
      const rate = netRate(state, mods, 'research');
      const left = researchNeeded(state, id, mods) - (progress ?? 0);
      setText(c.time, maxed || target || rate <= 0 ? '' : `⏱ ${formatDuration(left / rate)} at the current rate`);
    } else {
      setText(c.time, maxed || building ? '' : `⏱ ${formatDuration(buildSeconds(state, id, mods))}`);
    }

    const needs: string[] = [];
    for (const req of node.requires ?? []) {
      if (state.nodes[req] > 0) continue;
      const w = NODES[req].world;
      const tag = w !== node.world ? `<span class="tag tag-${w}">${WORLDS[w].name}</span> ` : '';
      needs.push(tag + escape(NODES[req].name));
    }
    if (node.capstone && level <= 0) {
      const left = ageTechsLeft(state, node.age ?? 1).filter((t) => t !== id);
      if (left.length) needs.push(`the rest of the ${AGES[(node.age ?? 1) - 1]} age: ${left.map((t) => escape(NODES[t].name)).join(', ')}`);
    }
    if (node.requiresBuildings) {
      const have = buildingCount(state, node.world);
      if (have < node.requiresBuildings) needs.push(`${have}/${node.requiresBuildings} ${WORLDS[node.world].name} buildings`);
    }
    if (available && !building && !maxed && needsLand(state, id, mods)) {
      needs.push(`free land (${landUsed(state)}/${formatNumber(land(state, mods))} squares used)`);
    }
    if (available && !building && !maxed && needsPeople(state, id)) {
      const n = node.people ?? 0;
      needs.push(`${n} idle Realm ${n === 1 ? 'person' : 'people'} (${idleWorkers(state)} idle)`);
    }
    if (available && !building && !maxed && !research && !hasFreeBuildSlot(state, node.world)) {
      needs.push(`a free build slot (${activeBuilds(state, node.world)}/${buildSlots(state)} in use)`);
    }
    if (!maxed && !building) {
      const over = costOverCap(research ? (progress === undefined ? researchUpfrontCost(state, id, mods) : {}) : nodeCost(state, id, mods), mods);
      if (over) {
        const fix =
          RESOURCES[over].world === 'realm'
            ? state.nodes.warehousing > 0
              ? 'build a Warehouse'
              : 'research Warehousing in the Lab for Warehouses'
            : over === 'mana'
              ? 'build a Mana Cistern'
              : '';
        needs.push(`more ${RESOURCES[over].name} storage (holds ${formatNumber(resourceCap(mods, over))}${fix ? `; ${fix}` : ''})`);
      }
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
      : research
        ? !target && !canStartResearch(state, id)
        : maxed || !!building || !available || !hasFreeBuildSlot(state, node.world) || needsLand(state, id, mods) || needsPeople(state, id) || !canAfford(state, nodeCost(state, id, mods));
  }
}
