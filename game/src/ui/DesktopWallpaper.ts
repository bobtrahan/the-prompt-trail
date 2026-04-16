import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { getState } from '../systems/GameState';

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
export function drawWallpaper(scene: Phaser.Scene, playerClass?: string | null): void {
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

  // Floating hex values at random grid intersections
  for (let i = 0; i < 8; i++) {
    const col = Math.floor(rand() * colsCount);
    const row = Math.floor(rand() * rowsCount);
    const hex = `0x${Math.floor(rand() * 0xFFFF).toString(16).padStart(4, '0')}`;
    scene.add.text(col * STEP + 4, row * STEP + 2, hex, {
      fontFamily: 'monospace', fontSize: '8px', color: '#00ffcc',
    }).setAlpha(0.06).setDepth(-10);
  }
}

function drawIndieHacker(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const color = 0xf0883e;
  const baseY = GAME_HEIGHT * 0.7;

  // Star scatter above the mountain line
  const state = getState();
  const rand = makeLCG((state.day ?? 1) + 100);
  for (let i = 0; i < 30; i++) {
    const sx = Math.floor(rand() * GAME_WIDTH);
    const sy = Math.floor(rand() * baseY * 0.8);
    const size = 1 + Math.floor(rand() * 2);
    const alpha = 0.03 + rand() * 0.05;
    gfx.fillStyle(0xffffff, alpha);
    gfx.fillRect(sx, sy, size, size);
  }

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

  // Doodle scribbles — scattered notebook marginalia
  const doodles = [
    { x: 120, y: 80, text: 'TODO' },
    { x: 900, y: 150, text: '← fix this' },
    { x: 600, y: 500, text: '???' },
    { x: 200, y: 400, text: '(╯°□°)╯' },
    { x: 1050, y: 380, text: 'due tmrw' },
    { x: 400, y: 120, text: '☆ ☆ ☆' },
  ];
  for (const d of doodles) {
    scene.add.text(d.x, d.y, d.text, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff79c6',
    }).setAlpha(0.04).setDepth(-10);
  }

  // Doodle circles
  gfx.lineStyle(1, 0xff79c6, 0.03);
  gfx.strokeCircle(750, 280, 20);
  gfx.strokeCircle(300, 550, 15);
  // Arrow
  gfx.lineStyle(1, 0x8be9fd, 0.04);
  gfx.beginPath();
  gfx.moveTo(500, 300);
  gfx.lineTo(540, 280);
  gfx.lineTo(535, 290);
  gfx.strokePath();
}

function drawCorporateDev(scene: Phaser.Scene): void {
  const gfx = scene.add.graphics();
  gfx.setDepth(-10);

  const color = 0x6e7681;
  const STEP = 20;

  // Vertical pinstripes
  for (let i = 0, x = 0; x <= GAME_WIDTH; x += STEP, i++) {
    const alpha = i % 5 === 0 ? 0.05 : 0.03;
    gfx.lineStyle(1, color, alpha);
    gfx.beginPath();
    gfx.moveTo(x, 0);
    gfx.lineTo(x, GAME_HEIGHT);
    gfx.strokePath();
  }

  // Horizontal lines — spreadsheet cells
  for (let y = 0; y <= GAME_HEIGHT; y += STEP * 2) {
    gfx.lineStyle(1, color, 0.025);
    gfx.beginPath();
    gfx.moveTo(0, y);
    gfx.lineTo(GAME_WIDTH, y);
    gfx.strokePath();
  }

  // CONFIDENTIAL watermark
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CONFIDENTIAL', {
    fontFamily: 'monospace', fontSize: '48px', color: '#6e7681',
  }).setOrigin(0.5).setAlpha(0.02).setDepth(-10).setAngle(-15);
}
