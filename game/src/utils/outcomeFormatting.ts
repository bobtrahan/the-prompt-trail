import type { EventEffect } from '../data/events';

export interface OutcomePart {
  text: string;
  color: string;
}

export function buildOutcomeParts(effects: EventEffect[]): OutcomePart[] {
  const parts: OutcomePart[] = [];
  for (const effect of effects) {
    if (effect.type === 'budget' && typeof effect.value === 'number') {
      const sym = effect.value >= 0 ? '💰' : '💸';
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push({
        text: `${sym} ${sign}$${Math.abs(effect.value)}`,
        color: effect.value >= 0 ? '#3fb950' : '#f85149',
      });
    } else if (effect.type === 'time' && typeof effect.value === 'number') {
      const secs = effect.value * 3;
      const sign = secs >= 0 ? '+' : '−';
      parts.push({
        text: `⏱ ${sign}${Math.abs(secs)}s`,
        color: secs >= 0 ? '#3fb950' : '#d29922',
      });
    } else if (effect.type === 'hardware' && typeof effect.value === 'number') {
      const sym = effect.value >= 0 ? '💪' : '🔥';
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push({
        text: `${sym} ${sign}${Math.abs(effect.value)} HP`,
        color: effect.value >= 0 ? '#3fb950' : '#f0883e',
      });
    } else if (effect.type === 'reputation' && typeof effect.value === 'number') {
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push({
        text: `★ ${sign}${Math.abs(effect.value)} rep`,
        color: effect.value >= 0 ? '#3fb950' : '#f0883e',
      });
    } else if (effect.type === 'agentSpeed' && typeof effect.value === 'number') {
      const secs = Math.round(45 * (effect.value / 100));
      if (secs !== 0) {
        parts.push({
          text: secs >= 0 ? `⏱ +${secs}s` : `⏱ −${Math.abs(secs)}s`,
          color: secs >= 0 ? '#3fb950' : '#d29922',
        });
      }
    } else if (effect.type === 'modelSwitch' && typeof effect.value === 'string') {
      const v = effect.value;
      if (v === 'sketchy') parts.push({ text: '🔀 sketchy model', color: '#9da5b0' });
      else if (v === 'backup') parts.push({ text: '🔀 backup model', color: '#9da5b0' });
    }
    // flag/tomorrowTimer/nightBonus: omit
  }
  return parts;
}

export function buildOutcomeLine(effects: EventEffect[]): string {
  const parts: string[] = [];
  for (const effect of effects) {
    if (effect.type === 'budget' && typeof effect.value === 'number') {
      const sym = effect.value >= 0 ? '💰' : '💸';
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push(`${sym} ${sign}$${Math.abs(effect.value)}`);
    } else if (effect.type === 'time' && typeof effect.value === 'number') {
      const secs = effect.value * 3;
      const sign = secs >= 0 ? '+' : '−';
      parts.push(`⏱ ${sign}${Math.abs(secs)}s`);
    } else if (effect.type === 'hardware' && typeof effect.value === 'number') {
      const sym = effect.value >= 0 ? '💪' : '🔥';
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push(`${sym} ${sign}${Math.abs(effect.value)} HP`);
    } else if (effect.type === 'reputation' && typeof effect.value === 'number') {
      const sign = effect.value >= 0 ? '+' : '−';
      parts.push(`★ ${sign}${Math.abs(effect.value)} rep`);
    } else if (effect.type === 'agentSpeed' && typeof effect.value === 'number') {
      const secs = Math.round(45 * (effect.value / 100));
      if (secs !== 0) parts.push(secs >= 0 ? `⏱ +${secs}s` : `⏱ −${Math.abs(secs)}s`);
    } else if (effect.type === 'modelSwitch' && typeof effect.value === 'string') {
      const v = effect.value;
      if (v === 'sketchy') parts.push('🔀 sketchy model');
      else if (v === 'backup') parts.push('🔀 backup model');
    }
    // flag/tomorrowTimer/nightBonus: omit
  }
  return parts.length > 0 ? parts.join('  ') : '—';
}

export function outcomeLineColor(effects: EventEffect[]): string {
  for (const e of effects) {
    if (e.type === 'budget' && typeof e.value === 'number' && e.value < 0) return '#f85149';
  }
  for (const e of effects) {
    if (e.type === 'hardware' && typeof e.value === 'number' && e.value < 0) return '#f0883e';
    if (e.type === 'reputation' && typeof e.value === 'number' && e.value < 0) return '#f0883e';
  }
  for (const e of effects) {
    if (e.type === 'budget' && typeof e.value === 'number' && e.value > 0) return '#3fb950';
    if (e.type === 'agentSpeed' && typeof e.value === 'number' && e.value > 0) return '#3fb950';
  }
  for (const e of effects) {
    if (e.type === 'time' && typeof e.value === 'number' && e.value < 0) return '#d29922';
    if (e.type === 'agentSpeed' && typeof e.value === 'number' && e.value < 0) return '#d29922';
  }
  return '#9da5b0';
}
