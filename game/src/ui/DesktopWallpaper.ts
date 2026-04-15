import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * Simple LCG pseudo-random number generator seeded by a given value.
 * Returns a function that yields floats in [0, 1).
 */
function makeLCG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Draw a procedural class-specific desktop wallpaper pattern at depth -10.
 * Call after setBackgroundColor, before window/taskbar creation.
 */
export function drawWallpaper(scene: Phaser.Scene, playerClass?: string): void {
  if (!playerClass) return;

  switch (playerClass) {
    case 'techBro':
      drawTechBro(scene);
      break;
    case 'indieHacker':
      drawIndieHacker(scene);
      break;
    case 'collegeStudent':
      drawCollegeStudent(scene);
      break;
    case 'corporateDev':
      drawCorporateDev(scene);
      break;
    default:
      break;
  }
}

function drawTechBro(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const STEP = 40;
  const color = 0x00ffcc;

  // Grid lines
  gfx.lineStyle(1, color, 0.03);

  for (let x = 0; x <= GAME_WIDTH; x += STEP) {
    gfx.beginPath();
    gfx.moveTo(x, 0);
    gfx.lineTo(x, GAME_HEIGHT);
    gfx.strokePath();
  }
  for (let y = 0; y <= GAME_HEIGHT; y += STEP) {
    gfx.beginPath();
    gfx.moveTo(0, y);
    gfx.lineTo(GAME_WIDTH, y);
    gfx.strokePath();
  }

  // Random circuit nodes seeded by day
  const { getState } = require('../systems/GameState');
  const state = getState();
  const rand = makeLCG(state.day ?? 1);

  const colsCount = Math.floor(GAME_WIDTH / STEP);
  const rowsCount = Math.floor(GAME_HEIGHT / STEP);

  gfx.fillStyle(color, 0.06);
  for (let i = 0; i < 15; i++) {
    const col = Math.floor(rand() * colsCount);
    const row = Math.floor(rand() * rowsCount);
    gfx.fillRect(col * STEP - 2, row * STEP - 2, 4, 4);
  }
}

function drawIndieHacker(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const color = 0xf0883e;
  const baseY = GAME_HEIGHT * 0.7;

  // Back range (taller peaks, offset, lower alpha)
  gfx.fillStyle(color, 0.02);
  gfx.beginPath();
  const backPeaks = [
    { x: 0, y: GAME_HEIGHT },
    { x: 0, y: baseY - 80 },
    { x: 200, y: baseY - 140 },
    { x: 420, y: baseY - 60 },
    { x: 640, y: baseY - 170 },
    { x: 860, y: baseY - 90 },
    { x: 1080, y: baseY - 155 },
    { x: GAME_WIDTH, y: baseY - 70 },
    { x: GAME_WIDTH, y: GAME_HEIGHT },
  ];
  gfx.moveTo(backPeaks[0].x, backPeaks[0].y);
  for (const pt of backPeaks.slice(1)) {
    gfx.lineTo(pt.x, pt.y);
  }
  gfx.closePath();
  gfx.fillPath();

  // Front range (lower peaks, more visible)
  gfx.fillStyle(color, 0.04);
  gfx.beginPath();
  const frontPeaks = [
    { x: 0, y: GAME_HEIGHT },
    { x: 0, y: baseY - 20 },
    { x: 160, y: baseY - 90 },
    { x: 340, y: baseY - 30 },
    { x: 530, y: baseY - 110 },
    { x: 720, y: baseY - 45 },
    { x: 920, y: baseY - 100 },
    { x: 1100, y: baseY - 25 },
    { x: GAME_WIDTH, y: baseY - 55 },
    { x: GAME_WIDTH, y: GAME_HEIGHT },
  ];
  gfx.moveTo(frontPeaks[0].x, frontPeaks[0].y);
  for (const pt of frontPeaks.slice(1)) {
    gfx.lineTo(pt.x, pt.y);
  }
  gfx.closePath();
  gfx.fillPath();
}

function drawCollegeStudent(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const STEP = 24;
  const gridColor = 0x58a6ff;

  // Horizontal lines
  gfx.lineStyle(1, gridColor, 0.025);
  for (let y = 0; y <= GAME_HEIGHT; y += STEP) {
    gfx.beginPath();
    gfx.moveTo(0, y);
    gfx.lineTo(GAME_WIDTH, y);
    gfx.strokePath();
  }
  // Vertical lines
  for (let x = 0; x <= GAME_WIDTH; x += STEP) {
    gfx.beginPath();
    gfx.moveTo(x, 0);
    gfx.lineTo(x, GAME_HEIGHT);
    gfx.strokePath();
  }

  // Red margin line at x=80
  gfx.lineStyle(2, 0xf85149, 0.04);
  gfx.beginPath();
  gfx.moveTo(80, 0);
  gfx.lineTo(80, GAME_HEIGHT);
  gfx.strokePath();

  // Hole punch circles at x=40, y at 25%/50%/75%
  gfx.lineStyle(2, gridColor, 0.04);
  const holeX = 40;
  for (const frac of [0.25, 0.5, 0.75]) {
    gfx.strokeCircle(holeX, GAME_HEIGHT * frac, 10);
  }
}

function drawCorporateDev(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const color = 0x6e7681;
  const STEP = 20;

  for (let i = 0, x = 0; x <= GAME_WIDTH; x += STEP, i++) {
    const alpha = i % 5 === 0 ? 0.05 : 0.03;
    gfx.lineStyle(1, color, alpha);
    gfx.beginPath();
    gfx.moveTo(x, 0);
    gfx.lineTo(x, GAME_HEIGHT);
    gfx.strokePath();
  }
}
