import type { EventEffect } from '../data/events';
import { ROLL_RESOLUTIONS } from '../data/rollResolutions';

export interface OutcomePart {
  text: string;
  color: string;
}

function summarizeEffects(effects: EventEffect[]): string {
  const parts: string[] = [];
  for (const e of effects) {
    if (e.type === 'budget' && typeof e.value === 'number') {
      parts.push(e.value >= 0 ? `💰 +$${e.value}` : `💸 −$${Math.abs(e.value)}`);
    } else if (e.type === 'time' && typeof e.value === 'number') {
      const s = e.value * 3; parts.push(s >= 0 ? `⏱ +${s}s` : `⏱ −${Math.abs(s)}s`);
    } else if (e.type === 'hardware' && typeof e.value === 'number') {
      parts.push(e.value >= 0 ? `💪 +${e.value} HP` : `🔥 −${Math.abs(e.value)} HP`);
    } else if (e.type === 'reputation' && typeof e.value === 'number') {
      parts.push(e.value >= 0 ? `★ +${e.value} rep` : `★ −${Math.abs(e.value)} rep`);
    } else if (e.type === 'agentSpeed' && typeof e.value === 'number') {
      const s = Math.round(45 * (e.value / 100));
      if (s !== 0) parts.push(s >= 0 ? `⏱ +${s}s` : `⏱ −${Math.abs(s)}s`);
    }
  }
  return parts.join(' ') || '—';
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
    } else if (effect.type === 'flag' && typeof effect.value === 'string') {
      const res = ROLL_RESOLUTIONS[effect.value];
      if (res) {
        const pct = Math.round(res.chance * 100);
        const goodText = summarizeEffects(res.good.effects);
        const badText = summarizeEffects(res.bad.effects);
        parts.push({ text: `🎲 ${pct}%: ${goodText} / ${badText}`, color: '#d29922' });
      }
    }
    // non-roll flag/tomorrowTimer/nightBonus: omit
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
    } else if (effect.type === 'flag' && typeof effect.value === 'string') {
      const res = ROLL_RESOLUTIONS[effect.value];
      if (res) {
        const pct = Math.round(res.chance * 100);
        const goodText = summarizeEffects(res.good.effects);
        const badText = summarizeEffects(res.bad.effects);
        parts.push(`🎲 ${pct}%: ${goodText} / ${badText}`);
      }
    }
    // non-roll flag/tomorrowTimer/nightBonus: omit
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
