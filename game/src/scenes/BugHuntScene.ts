import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Telemetry } from '../systems/Telemetry';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';

// ── Constants ─────────────────────────────────────────────────────────────────

const WIN_W = 900;
const WIN_H = 520;
const TIMER_BAR_H = 8;
const ARENA_OFFSET = 24;   // px below caAbsY where arena starts (room for timer bar + stats)
const AMMO_BAR_H = 36;
const AMMO_CELL_W = 18;
const AMMO_CELL_H = 14;
const AMMO_CELL_GAP = 3;
const GAME_DURATION = 30_000;
const PLAYER_SPEED = 300;
const AMMO_MAX = 10;
const AMMO_REGEN_MS = 3000;
const CROSSHAIR_DIST = 90;
const PLAYER_HW = 10;   // player hitbox half-width
const PLAYER_HH = 12;   // player hitbox half-height
const BULLET_SPEED = 600;
const BULLET_LEN = 8;
const BULLET_THICKNESS = 3;
const BULLET_TRAIL_LEN = 12;
const BULLET_TRAIL_ALPHA = 0.3;
const BULLET_RADIUS = 4;
const BULLET_DEPTH = 17;
const BULLET_TRAIL_DEPTH = 16;
const SPARK_DEPTH = 18;

// ── Types ─────────────────────────────────────────────────────────────────────

interface CodeBlock {
  x: number;  // top-left absolute scene coord
  y: number;
  w: number;
  h: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  graphics: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
}

// ── Code obstacle text definitions ────────────────────────────────────────────

const OBSTACLE_SNIPPETS: string[][] = [
  ['class Server {', '  port = 3000', '  start(): void {}', '}'],
  ['function deploy() {', '  await push(remote)', '  notify("shipped")', '}'],
  ['import { fetch, cache }', 'from "./api/client"'],
  ['const heap = []', '// grows unbounded...'],
  ['async function getModel(', '  id: string', '): Promise<Model> {', '  return registry.get(id)', '}'],
  ['try {', '  runInferPipeline()', '} catch (e) {', '  // TODO: handle', '}'],
  ['export default', '  new Router({', '    prefix: "/"', '  })'],
  ['interface ModelConfig {', '  tier: ModelTier', '  tokens: number', '}'],
];

const SYNTAX_ACCENT_COLORS = [0x3fb950, 0x58a6ff, 0xf0883e, 0xf85149];

// ── Scene ─────────────────────────────────────────────────────────────────────

export class BugHuntScene extends Phaser.Scene {
  // UI
  private win!: Window;
  private taskbar!: Taskbar;
  private statsText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerBarBg!: Phaser.GameObjects.Rectangle;
  private ammoCells: Phaser.GameObjects.Rectangle[] = [];

  // Theme
  private accentColor = COLORS.accent;

  // Arena bounds (absolute scene coords)
  private arenaX = 0;
  private arenaY = 0;
  private arenaW = 0;
  private arenaH = 0;

  // Code block obstacles
  private codeBlocks: CodeBlock[] = [];

  // Player
  private playerX = 0;
  private playerY = 0;
  private playerGfx!: Phaser.GameObjects.Graphics;

  // Aiming
  private crosshairGfx!: Phaser.GameObjects.Graphics;
  private aimAngle = 0;
  private crosshairX = 0;
  private crosshairY = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Game state
  private bugCount = 0;
  private totalEarned = 0;
  private ammo = AMMO_MAX;
  private shotsFired = 0;
  private lastAmmoRegen = 0;
  private startTime = 0;
  private ended = false;
  private bullets: Bullet[] = [];

  constructor() {
    super({ key: 'BugHunt' });
  }

  create(): void {
    // Reset state (critical for scene re-entry)
    this.bugCount = 0;
    this.totalEarned = 0;
    this.ammo = AMMO_MAX;
    this.shotsFired = 0;
    this.lastAmmoRegen = 0;
    this.startTime = 0;
    this.ended = false;
    this.codeBlocks = [];
    this.ammoCells = [];
    this.bullets = [];

    AudioManager.getInstance().playMusic('bugbounty');

    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.accentColor = theme.accent;

    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    this.taskbar = new Taskbar(this, theme.accent);

    // Window — centered
    const winX = (GAME_WIDTH - WIN_W) / 2;
    const winY = (GAME_HEIGHT - WIN_H) / 2;

    this.win = new Window({
      scene: this,
      x: winX,
      y: winY,
      width: WIN_W,
      height: WIN_H,
      title: 'Bug Hunt ── Terminal',
      titleIcon: '🐛',
      accentColor: theme.accent,
    });
    this.win.setDepth(10);

    const ca = this.win.contentArea;
    const caAbsX = winX + ca.x;
    const caAbsY = winY + ca.y;

    // ── Timer bar ────────────────────────────────────────────────────────────
    this.timerBarBg = this.add.rectangle(caAbsX, caAbsY, ca.width, TIMER_BAR_H, 0x21262d).setOrigin(0);
    this.timerBar   = this.add.rectangle(caAbsX, caAbsY, ca.width, TIMER_BAR_H, COLORS.success).setOrigin(0);
    this.timerBarBg.setDepth(11);
    this.timerBar.setDepth(12);

    // ── Stats text ───────────────────────────────────────────────────────────
    this.statsText = this.add.text(
      caAbsX + ca.width - 4,
      caAbsY + TIMER_BAR_H + 6,
      this.statsStr(),
      { fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3' }
    ).setOrigin(1, 0).setDepth(12);

    // ── Arena bounds ─────────────────────────────────────────────────────────
    this.arenaX = caAbsX;
    this.arenaY = caAbsY + ARENA_OFFSET;
    this.arenaW = ca.width;
    this.arenaH = ca.height - ARENA_OFFSET - AMMO_BAR_H;

    // Arena background — dark terminal green-black
    this.add.rectangle(this.arenaX, this.arenaY, this.arenaW, this.arenaH, 0x0a0f0a)
      .setOrigin(0).setDepth(11);

    // Faint grid lines
    this.drawGrid();

    // ── Code block obstacles ─────────────────────────────────────────────────
    this.placeCodeBlocks();

    // ── Ammo bar ─────────────────────────────────────────────────────────────
    this.buildAmmoBar(caAbsX, this.arenaY + this.arenaH, ca.width);

    // ── Player ───────────────────────────────────────────────────────────────
    this.playerX = this.arenaX + this.arenaW / 2;
    this.playerY = this.arenaY + this.arenaH / 2;

    this.playerGfx = this.add.graphics().setDepth(22);
    this.redrawPlayer();

    // ── Crosshair ────────────────────────────────────────────────────────────
    this.crosshairGfx = this.add.graphics().setDepth(23);
    this.redrawCrosshair();

    // Gentle alpha pulse on crosshair
    this.tweens.add({
      targets: this.crosshairGfx,
      alpha: { from: 0.55, to: 1.0 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Input ─────────────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    const wasdKeys = kb.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keyW = wasdKeys['W'];
    this.keyA = wasdKeys['A'];
    this.keyS = wasdKeys['S'];
    this.keyD = wasdKeys['D'];
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on('pointerdown', this.fireBullet, this);
    this.keySpace.on('down', this.fireBullet, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.fireBullet, this);
      this.keySpace.off('down', this.fireBullet, this);
      this.destroyAllBullets();
      AudioManager.getInstance().playMusic('night');
    });
  }

  // ── Grid lines ────────────────────────────────────────────────────────────

  private drawGrid(): void {
    const GRID = 40;
    const gfx = this.add.graphics().setDepth(11);
    gfx.lineStyle(1, 0x1a2a1a, 0.5);

    for (let gx = this.arenaX; gx <= this.arenaX + this.arenaW; gx += GRID) {
      gfx.beginPath();
      gfx.moveTo(gx, this.arenaY);
      gfx.lineTo(gx, this.arenaY + this.arenaH);
      gfx.strokePath();
    }
    for (let gy = this.arenaY; gy <= this.arenaY + this.arenaH; gy += GRID) {
      gfx.beginPath();
      gfx.moveTo(this.arenaX, gy);
      gfx.lineTo(this.arenaX + this.arenaW, gy);
      gfx.strokePath();
    }
  }

  // ── Code block placement ─────────────────────────────────────────────────

  private placeCodeBlocks(): void {
    const MARGIN = 24;
    const PAD = 20;  // min gap between blocks
    const count = 6 + Math.floor(Math.random() * 3); // 6–8

    for (let i = 0; i < count; i++) {
      const lines = OBSTACLE_SNIPPETS[i % OBSTACLE_SNIPPETS.length];
      const longestLen = Math.max(...lines.map(l => l.length));
      const blockW = Math.max(120, longestLen * 7 + 20);
      const blockH = lines.length * 16 + 14;

      let placed = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const bx = this.arenaX + MARGIN + Math.random() * (this.arenaW - blockW - MARGIN * 2);
        const by = this.arenaY + MARGIN + Math.random() * (this.arenaH - blockH - MARGIN * 2);

        const overlaps = this.codeBlocks.some(b =>
          bx < b.x + b.w + PAD &&
          bx + blockW + PAD > b.x &&
          by < b.y + b.h + PAD &&
          by + blockH + PAD > b.y
        );

        if (!overlaps) {
          this.drawCodeBlock(bx, by, blockW, blockH, lines, i);
          this.codeBlocks.push({ x: bx, y: by, w: blockW, h: blockH });
          placed = true;
          break;
        }
      }

      if (!placed) break; // arena full — stop trying
    }
  }

  private drawCodeBlock(x: number, y: number, w: number, h: number, lines: string[], idx: number): void {
    const gfx = this.add.graphics().setDepth(13);

    // Dark background
    gfx.fillStyle(0x161b22, 1);
    gfx.fillRect(x, y, w, h);

    // Border
    gfx.lineStyle(1, 0x30363d, 1);
    gfx.strokeRect(x, y, w, h);

    // Syntax accent bar on left edge
    gfx.fillStyle(SYNTAX_ACCENT_COLORS[idx % SYNTAX_ACCENT_COLORS.length], 0.7);
    gfx.fillRect(x, y, 3, h);

    // Code text lines
    lines.forEach((line, i) => {
      this.add.text(x + 8, y + 7 + i * 16, line, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3a5c3a',
      }).setDepth(14);
    });
  }

  // ── Ammo bar ──────────────────────────────────────────────────────────────

  private buildAmmoBar(barX: number, barY: number, barW: number): void {
    this.add.rectangle(barX, barY, barW, AMMO_BAR_H, 0x161b22)
      .setOrigin(0).setDepth(12);

    this.add.text(
      barX + 8, barY + (AMMO_BAR_H - 13) / 2,
      'Ammo:',
      { fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0' }
    ).setOrigin(0).setDepth(13);

    const LABEL_W = 52;
    for (let i = 0; i < AMMO_MAX; i++) {
      const cellX = barX + 8 + LABEL_W + i * (AMMO_CELL_W + AMMO_CELL_GAP);
      const cellY = barY + (AMMO_BAR_H - AMMO_CELL_H) / 2;
      const cell = this.add.rectangle(cellX, cellY, AMMO_CELL_W, AMMO_CELL_H, this.accentColor)
        .setOrigin(0).setDepth(13).setAlpha(i < this.ammo ? 1.0 : 0.18);
      this.ammoCells.push(cell);
    }
  }

  // ── Player drawing ────────────────────────────────────────────────────────

  private redrawPlayer(): void {
    this.playerGfx.clear();
    this.playerGfx.x = this.playerX;
    this.playerGfx.y = this.playerY;
    // Tip of triangle points "up" at rest; rotate to face aimAngle
    this.playerGfx.rotation = this.aimAngle + Math.PI / 2;

    // Glow layer — larger, low alpha
    this.playerGfx.fillStyle(this.accentColor, 0.22);
    this.playerGfx.fillTriangle(0, -17, -14, 15, 14, 15);

    // Main cursor triangle
    this.playerGfx.fillStyle(this.accentColor, 1);
    this.playerGfx.fillTriangle(0, -12, -10, 10, 10, 10);
  }

  // ── Crosshair drawing ─────────────────────────────────────────────────────

  private redrawCrosshair(): void {
    this.crosshairGfx.clear();

    const cx = this.playerX + Math.cos(this.aimAngle) * CROSSHAIR_DIST;
    const cy = this.playerY + Math.sin(this.aimAngle) * CROSSHAIR_DIST;
    this.crosshairX = cx;
    this.crosshairY = cy;
    const ARM = 8;
    const GAP = 3;

    this.crosshairGfx.lineStyle(2, this.accentColor, 1);

    // Horizontal arms (left, right)
    this.crosshairGfx.beginPath();
    this.crosshairGfx.moveTo(cx - ARM - GAP, cy);
    this.crosshairGfx.lineTo(cx - GAP, cy);
    this.crosshairGfx.strokePath();
    this.crosshairGfx.beginPath();
    this.crosshairGfx.moveTo(cx + GAP, cy);
    this.crosshairGfx.lineTo(cx + ARM + GAP, cy);
    this.crosshairGfx.strokePath();

    // Vertical arms (top, bottom)
    this.crosshairGfx.beginPath();
    this.crosshairGfx.moveTo(cx, cy - ARM - GAP);
    this.crosshairGfx.lineTo(cx, cy - GAP);
    this.crosshairGfx.strokePath();
    this.crosshairGfx.beginPath();
    this.crosshairGfx.moveTo(cx, cy + GAP);
    this.crosshairGfx.lineTo(cx, cy + ARM + GAP);
    this.crosshairGfx.strokePath();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  private statsStr(): string {
    return `Bugs: ${this.bugCount} | Earned: $${this.totalEarned}`;
  }

  private updateAmmoDisplay(): void {
    for (let i = 0; i < AMMO_MAX; i++) {
      this.ammoCells[i].setAlpha(i < this.ammo ? 1.0 : 0.18);
    }
  }

  private fireBullet(): void {
    if (this.ended || this.ammo <= 0) return;

    const dirX = this.crosshairX - this.playerX;
    const dirY = this.crosshairY - this.playerY;
    const len = Math.hypot(dirX, dirY);
    if (len === 0) return;

    const dx = dirX / len;
    const dy = dirY / len;
    const trail = this.add.graphics().setDepth(BULLET_TRAIL_DEPTH);
    const graphics = this.add.graphics().setDepth(BULLET_DEPTH);
    const bullet: Bullet = {
      x: this.playerX,
      y: this.playerY,
      dx,
      dy,
      graphics,
      trail,
    };

    this.bullets.push(bullet);
    this.ammo--;
    this.shotsFired++;
    this.updateAmmoDisplay();
    this.redrawBullet(bullet);
  }

  private redrawBullet(bullet: Bullet): void {
    const angle = Math.atan2(bullet.dy, bullet.dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    bullet.graphics.clear();
    bullet.graphics.x = bullet.x;
    bullet.graphics.y = bullet.y;
    bullet.graphics.rotation = angle;
    bullet.graphics.fillStyle(0xf8fafc, 1);
    bullet.graphics.fillRect(-BULLET_LEN / 2, -BULLET_THICKNESS / 2, BULLET_LEN, BULLET_THICKNESS);
    bullet.graphics.fillStyle(this.accentColor, 0.95);
    bullet.graphics.fillRect(0, -BULLET_THICKNESS / 2, BULLET_LEN / 2, BULLET_THICKNESS);

    bullet.trail.clear();
    bullet.trail.x = bullet.x - cos * 7;
    bullet.trail.y = bullet.y - sin * 7;
    bullet.trail.rotation = angle;
    bullet.trail.fillStyle(this.accentColor, BULLET_TRAIL_ALPHA);
    bullet.trail.fillRect(-BULLET_TRAIL_LEN / 2, -2, BULLET_TRAIL_LEN, 4);
  }

  private updateBullets(deltaSec: number): void {
    const activeBullets: Bullet[] = [];

    for (const bullet of this.bullets) {
      bullet.x += bullet.dx * BULLET_SPEED * deltaSec;
      bullet.y += bullet.dy * BULLET_SPEED * deltaSec;

      if (!this.isPointInArena(bullet.x, bullet.y)) {
        this.destroyBullet(bullet);
        continue;
      }

      if (this.hitCodeBlock(bullet)) {
        this.spawnSpark(bullet.x, bullet.y);
        this.destroyBullet(bullet);
        continue;
      }

      this.redrawBullet(bullet);
      activeBullets.push(bullet);
    }

    this.bullets = activeBullets;
  }

  private hitCodeBlock(bullet: Bullet): boolean {
    return this.codeBlocks.some(block =>
      bullet.x + BULLET_RADIUS > block.x &&
      bullet.x - BULLET_RADIUS < block.x + block.w &&
      bullet.y + BULLET_RADIUS > block.y &&
      bullet.y - BULLET_RADIUS < block.y + block.h
    );
  }

  private isPointInArena(x: number, y: number): boolean {
    return (
      x >= this.arenaX &&
      x <= this.arenaX + this.arenaW &&
      y >= this.arenaY &&
      y <= this.arenaY + this.arenaH
    );
  }

  private spawnSpark(x: number, y: number): void {
    const spark = this.add.graphics().setDepth(SPARK_DEPTH);
    spark.fillStyle(0xf8fafc, 1);
    spark.fillRect(-7, -1, 14, 2);
    spark.fillRect(-1, -7, 2, 14);
    spark.x = x;
    spark.y = y;

    this.tweens.add({
      targets: spark,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }

  private destroyBullet(bullet: Bullet): void {
    bullet.graphics.destroy();
    bullet.trail.destroy();
  }

  private destroyAllBullets(): void {
    this.bullets.forEach((bullet) => this.destroyBullet(bullet));
    this.bullets = [];
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (this.ended) return;

    if (this.startTime === 0) {
      this.startTime = time;
      this.lastAmmoRegen = time;
    }

    const elapsed = time - this.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);

    this.timerBar.width = this.win.contentArea.width * (remaining / GAME_DURATION);

    if (remaining <= 0) {
      this.endGame();
      return;
    }

    // Ammo regen — 1 every 3 seconds
    if (this.ammo < AMMO_MAX && time - this.lastAmmoRegen >= AMMO_REGEN_MS) {
      this.ammo = Math.min(AMMO_MAX, this.ammo + 1);
      this.lastAmmoRegen = time;
      this.updateAmmoDisplay();
    }

    // ── Movement ─────────────────────────────────────────────────────────────
    const dt = delta / 1000;
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown  || this.keyA.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keyD.isDown) dx += 1;
    if (this.cursors.up.isDown    || this.keyW.isDown) dy -= 1;
    if (this.cursors.down.isDown  || this.keyS.isDown) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx /= Math.SQRT2;
      dy /= Math.SQRT2;
    }

    let newX = this.playerX + dx * PLAYER_SPEED * dt;
    let newY = this.playerY + dy * PLAYER_SPEED * dt;

    // Constrain to arena bounds
    newX = Phaser.Math.Clamp(newX, this.arenaX + PLAYER_HW, this.arenaX + this.arenaW - PLAYER_HW);
    newY = Phaser.Math.Clamp(newY, this.arenaY + PLAYER_HH, this.arenaY + this.arenaH - PLAYER_HH);

    // Code block AABB collision resolution
    for (const block of this.codeBlocks) {
      const r = this.resolveAABB(newX, newY, block);
      newX = r.x;
      newY = r.y;
    }

    this.playerX = newX;
    this.playerY = newY;

    // ── Aim from mouse ────────────────────────────────────────────────────────
    const ptr = this.input.activePointer;
    this.aimAngle = Math.atan2(ptr.y - this.playerY, ptr.x - this.playerX);

    this.updateBullets(dt);

    // ── Redraw dynamic objects ────────────────────────────────────────────────
    this.redrawPlayer();
    this.redrawCrosshair();
  }

  // ── AABB push-out collision resolution ───────────────────────────────────

  private resolveAABB(px: number, py: number, b: CodeBlock): { x: number; y: number } {
    const pL  = px - PLAYER_HW;
    const pR  = px + PLAYER_HW;
    const pT  = py - PLAYER_HH;
    const pBo = py + PLAYER_HH;
    const bR  = b.x + b.w;
    const bBo = b.y + b.h;

    // No overlap
    if (pR <= b.x || pL >= bR || pBo <= b.y || pT >= bBo) {
      return { x: px, y: py };
    }

    // Penetration depths on each axis
    const oL  = pR  - b.x;
    const oR  = bR  - pL;
    const oT  = pBo - b.y;
    const oBo = bBo - pT;

    // Push out on the axis with smallest overlap
    if (Math.min(oL, oR) < Math.min(oT, oBo)) {
      return { x: oL < oR ? b.x - PLAYER_HW : bR + PLAYER_HW, y: py };
    } else {
      return { x: px, y: oT < oBo ? b.y - PLAYER_HH : bBo + PLAYER_HH };
    }
  }

  // ── End game ──────────────────────────────────────────────────────────────

  private endGame(): void {
    if (this.ended) return;
    this.ended = true;
    this.destroyAllBullets();

    const state = getState();
    const returnScene = state.bugHuntReturnScene || 'Night';
    state.bugHuntReturnScene = 'Night';

    const earned1_5x = Math.floor(this.totalEarned * 1.5);
    state.budget += earned1_5x;
    if (returnScene === 'Night') {
      state.bountyPlayedTonight = true;
    }
    Telemetry.patchBugBounty(this.totalEarned, this.bugCount, 'oldschool', this.shotsFired, 0);

    // End overlay — same structure as BugBountyScene
    const overlayX = GAME_WIDTH / 2;
    const overlayY = GAME_HEIGHT / 2;

    type LineEntry = { text: string; color: string; size: string };
    const lines: LineEntry[] = [
      { text: "Time's up!", color: '#58a6ff', size: '26px' },
      { text: `Bugs squashed: ${this.bugCount}`, color: '#e6edf3', size: '16px' },
      { text: `Earned: $${this.totalEarned}`, color: '#e6edf3', size: '16px' },
      { text: `Shots fired: ${this.shotsFired}`, color: '#9da5b0', size: '16px' },
      { text: 'Old School Bonus: ×1.5', color: '#ffd700', size: '16px' },
      { text: `Total: $${earned1_5x}`, color: '#3fb950', size: '18px' },
    ];

    const overlayH = 120 + lines.length * 34;
    this.add.rectangle(overlayX, overlayY, WIN_W - 40, overlayH, 0x0f1117, 0.95)
      .setDepth(50).setStrokeStyle(1, COLORS.windowBorder);

    const startY = overlayY - (lines.length * 34) / 2;
    lines.forEach((line, i) => {
      this.add.text(overlayX, startY + i * 34, line.text, {
        fontFamily: 'monospace',
        fontSize: line.size,
        color: line.color,
      }).setOrigin(0.5).setDepth(51);
    });

    const btnLabel = returnScene === 'Results' ? '[ Collect → Results ]' : '[ Collect → Night ]';
    const btnY = startY + lines.length * 34 + 20;
    const btn = this.add.text(overlayX, btnY, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#58a6ff',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#e6edf3'));
    btn.on('pointerout', () => btn.setColor('#58a6ff'));
    btn.on('pointerdown', () => this.scene.start(returnScene));
  }

  shutdown(): void {}
}
