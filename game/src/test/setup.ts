// Minimal Phaser mock for unit tests — only stubs what systems actually touch
(globalThis as any).Phaser = {
  Math: {
    Between: (min: number, max: number) => Math.floor((min + max) / 2),
  },
};
