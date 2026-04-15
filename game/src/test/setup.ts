import { vi } from 'vitest';

// Stub Phaser global with minimal surface for unit tests.
// Systems under test (ScoringSystem, EconomySystem, etc.) don't import Phaser,
// so only a shallow stub is needed if any transitive import touches the global.
vi.stubGlobal('Phaser', {
  Math: { Between: (a: number, b: number) => Math.floor((a + b) / 2) },
});
