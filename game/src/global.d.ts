import type { RunLog } from './systems/Telemetry';

declare global {
  interface Window {
    __GOD_MODE?: boolean;
    __TELEMETRY?: RunLog;
    __PHASER_GAME__?: Phaser.Game;
  }
}

export {};
