import Phaser from 'phaser';
import { MIN_VIEWPORT_WIDTH } from './utils/constants';
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
import { BugBountySelectScene } from './scenes/BugBountySelectScene';
import { BugHuntScene } from './scenes/BugHuntScene';
import { FinalScene } from './scenes/FinalScene';
import { ScanlineScene } from './ui/Scanlines';

// Check viewport width and show overlay if too narrow
function checkViewportWidth(): boolean {
  const viewportWidth = window.innerWidth;
  if (viewportWidth < MIN_VIEWPORT_WIDTH) {
    showViewportOverlay();
    return false;
  }
  return true;
}

function showViewportOverlay(): void {
  const container = document.getElementById('game-container');
  if (!container) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'viewport-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: 'Courier New', monospace;
  `;

  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    text-align: center;
    padding: 40px;
    border: 2px solid #58a6ff;
    background: rgba(15, 17, 23, 0.9);
    border-radius: 4px;
    max-width: 500px;
    box-shadow: 0 0 20px rgba(88, 166, 255, 0.3);
  `;

  // Title
  const title = document.createElement('h1');
  title.textContent = '⚠ Desktop Required';
  title.style.cssText = `
    color: #58a6ff;
    font-size: 28px;
    margin-bottom: 16px;
    text-shadow: 0 0 10px rgba(88, 166, 255, 0.5);
  `;

  // Message
  const message = document.createElement('p');
  message.textContent = 'This game requires a desktop browser with a viewport width of at least 768px.';
  message.style.cssText = `
    color: #e6edf3;
    font-size: 16px;
    margin-bottom: 12px;
    line-height: 1.6;
  `;

  // Subtext
  const subtext = document.createElement('p');
  subtext.textContent = `Current width: ${window.innerWidth}px`;
  subtext.style.cssText = `
    color: #9da5b0;
    font-size: 14px;
    margin-top: 12px;
    font-style: italic;
  `;

  messageContainer.appendChild(title);
  messageContainer.appendChild(message);
  messageContainer.appendChild(subtext);
  overlay.appendChild(messageContainer);
  container.appendChild(overlay);
}

// Initialize game only if viewport is wide enough
if (checkViewportWidth()) {
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
    callbacks: {
      postBoot: (game) => {
        game.canvas.setAttribute('tabindex', '1');
        game.canvas.focus();
      },
    },
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
      BugBountySelectScene,
      BugBountyScene,
      BugHuntScene,
      FinalScene,
      ScanlineScene,
    ],
  };

  new Phaser.Game(config);
}
