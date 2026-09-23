import { RESOURCES, WORLDS } from '../engine/content';
import { formatMultiplier, formatNumber } from '../engine/format';
import type { Effect, ResourceId, WorldId } from '../engine/types';

/** Human text for one effect at a given strength, e.g. "+0.5 Wood/s" or "All Realm production ×1.25". */
export function describeEffect(effect: Effect, amount: number): string {
  if (effect.stat === 'housing') return `+${formatNumber(amount)} housing`;
  if (effect.stat === 'growth') {
    return effect.kind === 'add'
      ? `+${formatNumber(amount * 60)} people/min growth`
      : `Population growth ${formatMultiplier(amount)}`;
  }
  if (effect.stat === 'deaths') {
    return effect.kind === 'add' ? `Kills ${formatNumber(amount)} people/hour` : `Deaths ${formatMultiplier(amount)}`;
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
    case 'click': {
      const name = RESOURCES[target as ResourceId].name;
      return effect.kind === 'add' ? `${value} ${name} per click` : `${name} per click ${value}`;
    }
    case 'yield': {
      const name = RESOURCES[target as ResourceId].name;
      return `${value} ${name}/s per worker`;
    }
    case 'prod':
      return `All ${WORLDS[target as WorldId].name} production ${value}`;
    case 'cost':
      return `${WORLDS[target as WorldId].name} costs ${value}`;
    default:
      return effect.stat;
  }
}
