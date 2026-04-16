// Game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Timing
export const TOTAL_DAYS = 13;
export const BASE_TIMER_SECONDS = 45;
export const EVENT_INTERVAL_MS = 9000; // event every ~9 sec

// Colors — PromptOS base theme (overridden per class)
export const COLORS = {
  bg: 0x0f1117,
  windowBg: 0x161b22,
  windowBorder: 0x30363d,
  titleBar: 0x21262d,
  text: 0xe6edf3,
  textDim: 0x9da5b0,
  accent: 0x58a6ff,
  success: 0x3fb950,
  warning: 0xd29922,
  error: 0xf85149,
  terminal: 0x0d1117,
  terminalText: 0x39d353,
};

// Class theme overrides
export const CLASS_THEMES = {
  techBro: {
    accent: 0x00ffcc,
    wallpaper: 'wallpaper_techbro',
    terminalText: '#00ffcc',
    terminalBg: 0x0a0f14,
    titleBarBg: 0x0a2020,
    taskbarBg: 0x0a1418,
    taskbarBorder: 0x00ffcc,
    cursorChar: '█',
  },
  indieHacker: {
    accent: 0xf0883e,
    wallpaper: 'wallpaper_indie',
    terminalText: '#f0883e',
    terminalBg: 0x14100a,
    titleBarBg: 0x201a0a,
    taskbarBg: 0x18140e,
    taskbarBorder: 0xf0883e,
    cursorChar: '_',
  },
  collegeStudent: {
    accent: 0x58a6ff,
    wallpaper: 'wallpaper_student',
    terminalText: '#ff79c6',
    terminalBg: 0x0d0a14,
    titleBarBg: 0x0f1020,
    taskbarBg: 0x0a0c18,
    taskbarBorder: 0xff79c6,
    cursorChar: '|',
  },
  corporateDev: {
    accent: 0x6e7681,
    wallpaper: 'wallpaper_corporate',
    terminalText: '#8b949e',
    terminalBg: 0x10121a,
    titleBarBg: 0x1c1f26,
    taskbarBg: 0x1a1d24,
    taskbarBorder: 0x6e7681,
    cursorChar: '▌',
  },
};
