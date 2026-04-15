import { COLORS, CLASS_THEMES } from './constants';
import type { PlayerClass } from './playerClass';

export interface Theme {
  bg: number;
  windowBg: number;
  windowBorder: number;
  titleBar: number;
  text: number;
  textDim: number;
  accent: number;
  success: number;
  warning: number;
  error: number;
  terminal: number;
  terminalText: number;
}

export function getTheme(playerClass?: PlayerClass): Theme {
  const base = { ...COLORS };
  if (playerClass) {
    const override = CLASS_THEMES[playerClass];
    if (override) {
      base.accent = override.accent;
    }
  }
  return base;
}
