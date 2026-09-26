import { DEPOSITS, JOBS, JOB_ORDER, RESOURCES, WORLDS } from '../engine/content';
import { formatMultiplier, formatNumber, formatPerHour } from '../engine/format';
import type { DepositId, Effect, ResourceId, WorldId } from '../engine/types';

/** Human text for one effect at a given strength, e.g. "+0.5 Wood/s" or "All Realm production ×1.25". */
export function describeEffect(effect: Effect, amount: number): string {
  if (effect.stat === 'housing') return `+${formatNumber(amount)} housing`;
  if (effect.stat === 'land') return `+${formatNumber(amount)} ${amount === 1 ? 'square' : 'squares'} of land`;
  if (effect.stat === 'growth') {
    return effect.kind === 'add'
      ? `+${formatNumber(amount * 60)} people/min growth`
      : `Population growth ${formatMultiplier(amount)}`;
  }
  if (effect.stat === 'crowding') {
    return effect.kind === 'add'
      ? `+${formatNumber(amount)} crowding (slows growth)`
      : `Crowding −${formatNumber((1 - amount) * 100)}%`;
  }
  if (effect.stat === 'pollution') {
    return effect.kind === 'add'
      ? `+${formatNumber(amount)} pollution (slows growth)`
      : `Pollution −${formatNumber((1 - amount) * 100)}%`;
  }
  if (effect.stat.startsWith('regrow:')) {
    const deposit = effect.stat.slice('regrow:'.length) as DepositId;
    const verb = deposit === 'wood' ? 'regrows' : 'refill';
    return effect.kind === 'add'
      ? `${DEPOSITS[deposit].name} ${verb} +${formatNumber(amount)} ${RESOURCES[deposit].name}/s`
      : `${DEPOSITS[deposit].name} ${verb} ${formatMultiplier(amount)}`;
  }
  if (effect.stat.startsWith('size:')) {
    const deposit = effect.stat.slice('size:'.length) as DepositId;
    return effect.kind === 'add'
      ? `${DEPOSITS[deposit].name} holds ${amount >= 0 ? '+' : '−'}${formatNumber(Math.abs(amount))} ${RESOURCES[deposit].name}`
      : `${DEPOSITS[deposit].name} size ${formatMultiplier(amount)}`;
  }
  if (effect.stat.startsWith('risk:')) {
    const resource = effect.stat.slice('risk:'.length) as ResourceId;
    const job = JOB_ORDER.find((j) => JOBS[j].resource === resource);
    const who = job ? JOBS[job].name : `${RESOURCES[resource].name} workers`;
    const pct = formatNumber(Math.abs(amount - 1) * 100);
    return `${who}' accidents ${amount >= 1 ? '+' : '−'}${pct}%`;
  }
  if (effect.stat === 'starvation') {
    return `Starvation −${formatNumber((1 - amount) * 100)}%`;
  }
  if (effect.stat === 'accidents') {
    return `Work accidents −${formatNumber((1 - amount) * 100)}%`;
  }
  if (effect.stat === 'deaths') {
    return effect.kind === 'add' ? `Kills ${formatPerHour(amount)} people` : `Deaths ${formatMultiplier(amount)}`;
  }
  if (effect.stat.startsWith('storage:')) {
    const world = WORLDS[effect.stat.slice('storage:'.length) as WorldId].name;
    return effect.kind === 'add' ? `+${formatNumber(amount * 100)}% ${world} storage` : `${world} storage ${formatMultiplier(amount)}`;
  }
  if (effect.stat.startsWith('decay:')) {
    return effect.kind === 'add'
      ? `Goods in Warehouses spoil ${amount >= 0 ? '+' : '−'}${formatNumber(Math.abs(amount) * 100)}%/s`
      : `Warehouse spoilage −${formatNumber((1 - amount) * 100)}%`;
  }
  if (effect.stat.startsWith('speed:')) {
    return `${WORLDS[effect.stat.slice('speed:'.length) as WorldId].name} build speed ${formatMultiplier(amount)}`;
  }
  const [type, target] = effect.stat.split(':') as [string, string];
  const value =
    effect.kind === 'add'
      ? `${amount >= 0 ? '+' : ''}${formatNumber(amount)}`
      : effect.linear
        ? `+${formatNumber((amount - 1) * 100)}%`
        : formatMultiplier(amount);
  switch (type) {
    case 'rate': {
      const name = RESOURCES[target as ResourceId].name;
      return effect.kind === 'add' ? `${value} ${name}/s` : `${name}/s ${value}`;
    }
    case 'yield': {
      const name = RESOURCES[target as ResourceId].name;
      return `${value} ${name}/s per worker`;
    }
    case 'cap': {
      const name = RESOURCES[target as ResourceId].name;
      return effect.kind === 'add' ? `Stores ${value} ${name}` : `${name} storage ${value}`;
    }
    case 'prod':
      return `All ${WORLDS[target as WorldId].name} production ${value}`;
    case 'cost':
      return `${WORLDS[target as WorldId].name} costs ${value}`;
    default:
      return effect.stat;
  }
}
