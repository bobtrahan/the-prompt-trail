// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Timing
export const TOTAL_DAYS = 13;
export const TIME_UNITS_PER_DAY = 10;
export const TYPING_INTERVAL_MS = 4500; // ~4.5 sec per time unit
export const EVENT_INTERVAL_MS = 9000; // event every ~9 sec

// Colors — PromptOS base theme (overridden per class)
export const COLORS = {
  bg: 0x0f1117,
  windowBg: 0x161b22,
  windowBorder: 0x30363d,
  titleBar: 0x21262d,
  text: 0xe6edf3,
  textDim: 0x8b949e,
  accent: 0x58a6ff,
  success: 0x3fb950,
  warning: 0xd29922,
  error: 0xf85149,
  terminal: 0x0d1117,
  terminalText: 0x39d353,
};

// Event tags
export type EventTag = 'requiresCloud' | 'requiresLocal';

export interface PlaceholderEvent {
  title: string;
  body: string;
  choices: string[];
  tags?: EventTag[];
}

// Class theme overrides
export const CLASS_THEMES = {
  techBro: { accent: 0x00ffcc, wallpaper: 'wallpaper_techbro' },
  indieHacker: { accent: 0xf0883e, wallpaper: 'wallpaper_indie' },
  collegeStudent: { accent: 0x58a6ff, wallpaper: 'wallpaper_student' },
  corporateDev: { accent: 0x6e7681, wallpaper: 'wallpaper_corporate' },
};
