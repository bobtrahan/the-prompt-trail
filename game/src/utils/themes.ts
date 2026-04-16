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
  // Per-class extensions
  terminalTextColor: string;
  terminalBg: number;
  titleBarBg: number;
  taskbarBg: number;
  taskbarBorder: number;
  cursorChar: string;
}

const DEFAULTS = {
  terminalTextColor: '#39d353',
  terminalBg: 0x0d1117,
  titleBarBg: 0x161b22,
  taskbarBg: 0x161b22,
  taskbarBorder: 0x30363d,
  cursorChar: '█',
};

export function getTheme(playerClass?: PlayerClass): Theme {
  const base: Theme = {
    ...COLORS,
    ...DEFAULTS,
  };

  if (playerClass) {
    const override = CLASS_THEMES[playerClass];
    if (override) {
      base.accent = override.accent;
      base.terminalTextColor = override.terminalText;
      base.terminalBg = override.terminalBg;
      base.titleBarBg = override.titleBarBg;
      base.taskbarBg = override.taskbarBg;
      base.taskbarBorder = override.taskbarBorder;
      base.cursorChar = override.cursorChar;
    }
  }
  return base;
}
