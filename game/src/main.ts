import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { ClassSelectScene } from './scenes/ClassSelectScene';
import { BriefingScene } from './scenes/BriefingScene';
import { PlanningScene } from './scenes/PlanningScene';
import { ExecutionScene } from './scenes/ExecutionScene';
import { ResultsScene } from './scenes/ResultsScene';
import { NightScene } from './scenes/NightScene';
import { TokenMarketScene } from './scenes/TokenMarketScene';
import { BugBountyScene } from './scenes/BugBountyScene';
import { FinalScene } from './scenes/FinalScene';
import { ScanlineScene } from './ui/Scanlines';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: { disableWebAudio: false },
  scene: [
    BootScene,
    TitleScene,
    ClassSelectScene,
    BriefingScene,
    PlanningScene,
    ExecutionScene,
    ResultsScene,
    NightScene,
    TokenMarketScene,
    BugBountyScene,
    FinalScene,
    ScanlineScene,
  ],
};

new Phaser.Game(config);
