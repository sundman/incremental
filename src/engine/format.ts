const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** 12, 3.4, 1.23K, 45.6M, then 1.23e36 past the named suffixes. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 1000) {
    if (abs === 0) return '0';
    if (abs < 10) return sign + trim(abs.toFixed(2));
    if (abs < 100) return sign + trim(abs.toFixed(1));
    return sign + Math.floor(abs).toString();
  }
  let tier = Math.floor(Math.log10(abs) / 3);
  let scaled = abs / Math.pow(1000, tier);
  // 999.96K would print as "1000K"; roll it over to "1M" instead.
  if (Number(scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0)) >= 1000) {
    tier += 1;
    scaled /= 1000;
  }
  if (tier >= SUFFIXES.length) return sign + abs.toExponential(2).replace('e+', 'e');
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return sign + trim(scaled.toFixed(digits)) + SUFFIXES[tier];
}

function trim(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

export function formatMultiplier(m: number): string {
  return '×' + trim(m.toFixed(m >= 10 ? 1 : 2));
}

/** 8s, 3m 05s, 1h 20m. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
}

/** A rate given per hour, e.g. "6/hour"; above 60 an hour it reads per minute instead, e.g. "4.02/min". */
export function formatPerHour(perHour: number): string {
  return perHour > 60 ? `${formatNumber(perHour / 60)}/min` : `${formatNumber(perHour)}/hour`;
}
