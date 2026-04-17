import Phaser from 'phaser';
import { TUNING } from '../data/tuning';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Telemetry, type ShotLog, type BugLog } from '../systems/Telemetry';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { BUG_DEFS, pickBugType, type BugType } from '../data/bugs';

// ── Constants ─────────────────────────────────────────────────────────────────

const WIN_W = 900;
const WIN_H = 520;
const TIMER_BAR_H = 8;
const ARENA_OFFSET = 24;
const AMMO_BAR_H = 36;
const AMMO_CELL_W = 18;
const AMMO_CELL_H = 14;
const AMMO_CELL_GAP = 3;
const GAME_DURATION = TUNING.BUG_HUNT.DURATION_MS;
const PLAYER_SPEED = TUNING.BUG_HUNT.PLAYER_SPEED;
const AMMO_MAX = TUNING.BUG_HUNT.AMMO_MAX;
const AMMO_REGEN_MS = TUNING.BUG_HUNT.AMMO_REGEN_MS;
const CROSSHAIR_DIST = 90;
const PLAYER_HW = 10;
const PLAYER_HH = 12;
const BULLET_SPEED = TUNING.BUG_HUNT.BULLET_SPEED;
const BULLET_LEN = 8;
const BULLET_THICKNESS = 3;
const BULLET_TRAIL_LEN = 12;
const BULLET_TRAIL_ALPHA = 0.3;
const BULLET_RADIUS = 4;
const BULLET_DEPTH = 17;
const BULLET_TRAIL_DEPTH = 16;
const SPARK_DEPTH = 18;

// Bug spawning + movement
const BUG_SPAWN_INTERVAL = TUNING.BUG_HUNT.SPAWN_INTERVAL_MS;
const MAX_ALIVE_BUGS = TUNING.BUG_HUNT.MAX_BUGS;
const DESPAWN_WARN_MS = TUNING.BUG_HUNT.DESPAWN_WARN_MS;

// Chip visual dims (mirrors BugBountyScene)
const CHIP_W = 120;
const CHIP_H = 28;
const CHIP_R = 6;

// Bug speeds (px/sec)
const SYNTAX_SPEED      = TUNING.BUG_HUNT.SPEEDS.syntax;
const LOGIC_SPEED       = TUNING.BUG_HUNT.SPEEDS.logic;
const RACE_BURST_SPEED  = TUNING.BUG_HUNT.SPEEDS.race;
const MEMLEAK_SPEED     = TUNING.BUG_HUNT.SPEEDS.memleak;
const HEISEN_SPEED      = TUNING.BUG_HUNT.SPEEDS.heisen;

// Bug hit radii
const HIT_RADIUS: Record<BugType, number> = {
  syntax: 30, logic: 22, race: 15, memleak: 25, heisen: 20, jackpot: 35, fleeing: 25,
};
const HIT_HALF_W: Record<BugType, number> = {
  syntax: 55, logic: 45, race: 40, memleak: 50, heisen: 38, jackpot: 65, fleeing: 45,
};
const HIT_HALF_H = 16;

// ── Types ─────────────────────────────────────────────────────────────────────

interface CodeBlock {
  x: number;
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

interface HuntBug {
  type: BugType;
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  hitRadius: number;
  spawnedAt: number;
  alive: boolean;
  hp: number;
  direction: { x: number; y: number };
  lastPause: number;    // logic: timestamp pause started (0 = not paused)
  lastBurst: number;    // race: timestamp of last burst start; logic: last resume time
  burstDir: { x: number; y: number };  // race: current burst direction
  cracked: boolean;     // memleak: hit once
  invisible: boolean;   // heisen: currently dodging
  invisibleUntil: number;
  growScale: number;    // memleak: current scale
  // Despawn warning
  despawnWarned: boolean;
  despawnFlashTimer: Phaser.Time.TimerEvent | null;
  bgGraphics: Phaser.GameObjects.Graphics;
  borderRect: Phaser.GameObjects.Rectangle;
}

// ── Code obstacle text definitions ────────────────────────────────────────────

// Mix of small (1-2 line) and medium (3-4 line) snippets for varied obstacle sizes
const OBSTACLE_SNIPPETS: string[][] = [
  ['const x = 42'],
  ['// TODO: fix'],
  ['import ai from "./"'],
  ['let bug = true'],
  ['return null'],
  ['class Server {', '  port = 3000', '}'],
  ['function deploy() {', '  push(remote)', '}'],
  ['try {', '  run()', '} catch {}'],
  ['const heap = []', '// unbounded...'],
  ['async getModel(', '  id: string', '): Model {', '  return get(id)', '}'],
];

const SYNTAX_ACCENT_COLORS = [0x3fb950, 0x58a6ff, 0xf0883e, 0xf85149];

// ── Chip helpers (mirrors BugBountyScene) ─────────────────────────────────────

function drawChipBg(gfx: Phaser.GameObjects.Graphics, color: number, alpha = 0.85): void {
  gfx.clear();
  gfx.fillStyle(color, alpha);
  gfx.fillRoundedRect(-CHIP_W / 2, -CHIP_H / 2, CHIP_W, CHIP_H, CHIP_R);
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r   = Math.round(ar + (br - ar) * t);
  const g   = Math.round(ag + (bg - ag) * t);
  const bl2 = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl2;
}

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
  private facingX = 0;
  private facingY = -1; // facing up by default
  private walking = false;

  // Aiming
  private crosshairGfx!: Phaser.GameObjects.Graphics;
  private aimAngle = -Math.PI / 2;
  private crosshairX = 0;
  private crosshairY = 0;

  // Input (raw DOM to avoid Phaser keyboard conflicts)
  private keysDown = new Set<string>(); // audit-ok — .clear() in create()
  private keyDownHandler!: (e: KeyboardEvent) => void;
  private keyUpHandler!: (e: KeyboardEvent) => void;

  // Game state
  private bugCount = 0;
  private totalEarned = 0;
  private ammo = AMMO_MAX;
  private shotsFired = 0;
  private lastAmmoRegen = 0;
  private startTime = 0;
  private ended = false;
  private bullets: Bullet[] = [];

  // Bug system
  private bugs: HuntBug[] = [];
  private escapedBugs = 0;
  private lastSpawn = 0;

  // Scoring + combo
  private shotsHit = 0;

  // Telemetry
  private shotLogs: ShotLog[] = [];
  private bugLogs: Map<HuntBug, BugLog> = new Map();
  private frameCount = 0;
  private fpsMin = Infinity;
  private fpsMax = 0;
  private fpsSum = 0;
  private lastCatchTime = 0;
  private comboCount = 0;
  private maxCombo = 0;
  private comboText!: Phaser.GameObjects.Text;

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
    this.bugs = [];
    this.escapedBugs = 0;
    this.lastSpawn = 0;
    this.facingX = 0;
    this.facingY = -1;
    this.walking = false;
    this.keysDown.clear();
    this.aimAngle = -Math.PI / 2;
    this.crosshairX = 0;
    this.crosshairY = 0;
    this.shotsHit = 0;
    this.lastCatchTime = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.shotLogs = [];
    this.bugLogs = new Map();
    this.frameCount = 0;
    this.fpsMin = Infinity;
    this.fpsMax = 0;
    this.fpsSum = 0;

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

    // ── Combo text ───────────────────────────────────────────────────────────
    this.comboText = this.add.text(
      this.arenaX + 8, this.arenaY + 8, '',
      { fontFamily: 'monospace', fontSize: '24px', color: '#ffff00', fontStyle: 'bold' }
    ).setOrigin(0, 0).setDepth(24).setAlpha(0);

    // ── Code block obstacles ─────────────────────────────────────────────────
    this.placeCodeBlocks();

    // ── Ammo bar ─────────────────────────────────────────────────────────────
    this.buildAmmoBar(caAbsX, this.arenaY + this.arenaH, ca.width);

    // ── Player ───────────────────────────────────────────────────────────────
    this.playerX = this.arenaX + this.arenaW / 2;
    this.playerY = this.arenaY + this.arenaH / 2;
    // Avoid spawning inside code blocks — spiral outward to find clear spot
    const PLAYER_R = 12;
    if (this.codeBlocks.some(b => this.circleOverlapsRect(this.playerX, this.playerY, PLAYER_R, b))) {
      for (let r = 30; r < this.arenaW / 2; r += 20) {
        let found = false;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const tx = this.arenaX + this.arenaW / 2 + Math.cos(a) * r;
          const ty = this.arenaY + this.arenaH / 2 + Math.sin(a) * r;
          if (!this.codeBlocks.some(b => this.circleOverlapsRect(tx, ty, PLAYER_R, b))) {
            this.playerX = tx;
            this.playerY = ty;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

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

    // ── Input (raw DOM — bypasses Phaser keyboard conflicts) ─────────────
    this.keyDownHandler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','enter',' '].includes(k)) {
        e.preventDefault();
      }
      this.keysDown.add(k);
    };
    this.keyUpHandler = (e: KeyboardEvent) => {
      this.keysDown.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.keyDownHandler);
      window.removeEventListener('keyup', this.keyUpHandler);
      this.destroyAllBullets();
      this.destroyAllBugs();
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
    const PAD = 20;
    const count = 6 + Math.floor(Math.random() * 3); // 6–8

    for (let i = 0; i < count; i++) {
      const lines = OBSTACLE_SNIPPETS[i % OBSTACLE_SNIPPETS.length];
      const longestLen = Math.max(...lines.map(l => l.length));
      const blockW = Math.max(60, longestLen * 7 + 12);
      const blockH = lines.length * 14 + 10;

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
      this.add.text(x + 6, y + 5 + i * 14, line, {
        fontFamily: 'monospace',
        fontSize: '10px',
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
    AudioManager.getInstance().playSFX('ui-click');

    // Fire in facing direction
    const dx = this.facingX;
    const dy = this.facingY;
    if (dx === 0 && dy === 0) return;
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

    // Kill any bug the bullet spawns inside (handles player-overlapping-bug case)
    for (const bug of this.bugs) {
      if (!bug.alive) continue;
      if (bug.type === 'heisen' && bug.invisible) continue;
      const hw = (bug.type === 'memleak' ? HIT_HALF_W[bug.type] * bug.growScale : HIT_HALF_W[bug.type]) + BULLET_RADIUS;
      const hh = (bug.type === 'memleak' ? HIT_HALF_H * bug.growScale : HIT_HALF_H) + BULLET_RADIUS;
      if (Math.abs(this.playerX - bug.x) < hw && Math.abs(this.playerY - bug.y) < hh) {
        this.shotsHit++;
        this.hitBug(bug);
        // Remove bullet immediately — it already hit
        this.bullets.pop();
        this.destroyBullet(bullet);
        return;
      }
    }

    this.ammo--;
    this.shotsFired++;
    this.updateAmmoDisplay();
    this.redrawBullet(bullet);

    // Telemetry: start tracking this shot
    (bullet as any)._shotLog = {
      frame: this.frameCount,
      bulletSpawn: { x: bullet.x, y: bullet.y, dx: bullet.dx, dy: bullet.dy },
      result: 'out-of-bounds', // default, overwritten on hit
      deltaSec: 0,
    } as ShotLog;
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

      const shotLog = (bullet as any)._shotLog as ShotLog | undefined;
      if (shotLog) shotLog.deltaSec = deltaSec;

      if (!this.isPointInArena(bullet.x, bullet.y)) {
        if (shotLog) {
          shotLog.result = 'out-of-bounds';
          this.finalizeShotLog(shotLog, bullet);
        }
        this.destroyBullet(bullet);
        continue;
      }

      if (this.hitCodeBlock(bullet)) {
        this.spawnSpark(bullet.x, bullet.y);
        if (shotLog) {
          shotLog.result = 'hit-block';
          this.finalizeShotLog(shotLog, bullet);
        }
        this.destroyBullet(bullet);
        continue;
      }

      if (this.checkBulletHitBug(bullet, deltaSec)) {
        // shotLog finalized inside checkBulletHitBug
        this.destroyBullet(bullet);
        continue;
      }

      this.redrawBullet(bullet);
      activeBullets.push(bullet);
    }

    this.bullets = activeBullets;
  }

  private logShotHit(bullet: Bullet, bug: HuntBug): void {
    const shotLog = (bullet as any)._shotLog as ShotLog | undefined;
    if (shotLog) {
      shotLog.result = 'hit-bug';
      shotLog.hitBugType = bug.type;
      shotLog.hitBugPos = { x: Math.round(bug.x), y: Math.round(bug.y) };
      this.shotLogs.push(shotLog);
    }
  }

  private finalizeShotLog(shotLog: ShotLog, bullet: Bullet): void {
    // Find nearest alive bug at bullet death
    let minDist = Infinity;
    let nearest: { type: string; dist: number; pos: { x: number; y: number } } | undefined;
    for (const bug of this.bugs) {
      if (!bug.alive) continue;
      const dist = Math.hypot(bullet.x - bug.x, bullet.y - bug.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = { type: bug.type, dist: Math.round(dist), pos: { x: Math.round(bug.x), y: Math.round(bug.y) } };
      }
    }
    if (nearest && shotLog.result !== 'hit-bug') {
      shotLog.nearestBugAtDeath = nearest;
    }
    this.shotLogs.push(shotLog);
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

  // ── Bug chip factory ──────────────────────────────────────────────────────

  private buildBugChip(type: BugType): {
    container: Phaser.GameObjects.Container;
    bgGraphics: Phaser.GameObjects.Graphics;
    borderRect: Phaser.GameObjects.Rectangle;
  } {
    const def = BUG_DEFS[type];
    const hw = CHIP_W / 2;

    const glowRect = this.add.rectangle(0, 0, CHIP_W + 8, CHIP_H + 8, def.color, 0.08).setOrigin(0.5);
    const shadow = this.add.rectangle(2, 2, CHIP_W, CHIP_H, 0x000000, 0.3).setOrigin(0.5);
    const bgGraphics = this.add.graphics();
    drawChipBg(bgGraphics, def.color, 0.85);
    const borderRect = this.add.rectangle(0, 0, CHIP_W, CHIP_H, 0x000000, 0)
      .setStrokeStyle(2, 0xffffff, 0)
      .setOrigin(0.5);
    const dotGfx = this.add.graphics();
    dotGfx.fillStyle(def.dotColor, 1);
    dotGfx.fillCircle(-hw + 14, 0, 4);
    const labelText = this.add.text(-hw + 24, 0, def.label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const container = this.add.container(0, 0, [
      glowRect, shadow, bgGraphics, borderRect, dotGfx, labelText,
    ]);

    // Glow pulse
    this.tweens.add({
      targets: glowRect,
      alpha: { from: 0.05, to: 0.12 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return { container, bgGraphics, borderRect };
  }

  // ── Bug spawning ──────────────────────────────────────────────────────────

  private randomUnitVector(): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  private randomDiagonal(): { x: number; y: number } {
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    const angle = angles[Math.floor(Math.random() * 4)];
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  private spawnEdgePosition(hitRadius: number): { x: number; y: number } {
    const margin = hitRadius + 2;
    for (let attempt = 0; attempt < 20; attempt++) {
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      switch (edge) {
        case 0: // top
          x = this.arenaX + margin + Math.random() * (this.arenaW - margin * 2);
          y = this.arenaY + margin;
          break;
        case 1: // bottom
          x = this.arenaX + margin + Math.random() * (this.arenaW - margin * 2);
          y = this.arenaY + this.arenaH - margin;
          break;
        case 2: // left
          x = this.arenaX + margin;
          y = this.arenaY + margin + Math.random() * (this.arenaH - margin * 2);
          break;
        default: // right
          x = this.arenaX + this.arenaW - margin;
          y = this.arenaY + margin + Math.random() * (this.arenaH - margin * 2);
          break;
      }
      if (!this.codeBlocks.some(b => this.circleOverlapsRect(x, y, hitRadius, b))) {
        return { x, y };
      }
    }
    // Fallback: arena center
    return { x: this.arenaX + this.arenaW / 2, y: this.arenaY + this.arenaH / 2 };
  }

  private spawnHuntBug(type: BugType, time: number): void {
    const hitRadius = HIT_RADIUS[type];
    const pos = this.spawnEdgePosition(hitRadius);

    const { container, bgGraphics, borderRect } = this.buildBugChip(type);
    container.setPosition(pos.x, pos.y).setDepth(15).setScale(0);

    this.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    const initDir  = type === 'logic' ? this.randomDiagonal() : this.randomUnitVector();
    const burstDir = type === 'race'  ? this.randomUnitVector() : { x: 0, y: 0 };

    const bug: HuntBug = {
      type,
      x: pos.x,
      y: pos.y,
      container,
      hitRadius,
      spawnedAt: time,
      alive: true,
      hp: type === 'memleak' ? 2 : 1,
      direction: type === 'race' ? { ...burstDir } : initDir,
      lastPause: 0,
      lastBurst: time,
      burstDir,
      cracked: false,
      invisible: false,
      invisibleUntil: 0,
      growScale: 1,
      despawnWarned: false,
      despawnFlashTimer: null,
      bgGraphics,
      borderRect,
    };

    this.bugs.push(bug);

    // Telemetry: track this bug
    this.bugLogs.set(bug, {
      type: bug.type,
      spawnPos: { x: Math.round(pos.x), y: Math.round(pos.y) },
      hitRadius,
      death: 'survived', // default, overwritten on kill/despawn
    });
  }

  // ── Despawn warning ───────────────────────────────────────────────────────

  private startDespawnWarning(bug: HuntBug): void {
    bug.despawnWarned = true;
    bug.borderRect.setStrokeStyle(2, 0xffffff, 1);
    let visible = true;
    bug.despawnFlashTimer = this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        visible = !visible;
        bug.borderRect.setStrokeStyle(2, 0xffffff, visible ? 1 : 0);
      },
    });
  }

  // ── Bug removal ───────────────────────────────────────────────────────────

  removeHuntBug(bug: HuntBug, caught: boolean): void {
    bug.alive = false;
    if (!caught) {
      const bl = this.bugLogs.get(bug);
      if (bl) bl.death = 'despawn';
    }
    if (bug.despawnFlashTimer) {
      bug.despawnFlashTimer.destroy();
      bug.despawnFlashTimer = null;
    }

    if (caught) {
      this.tweens.add({
        targets: bug.container,
        scaleX: 2, scaleY: 2, angle: 360, alpha: 0,
        duration: 250, ease: 'Quad.easeOut',
        onComplete: () => bug.container.destroy(),
      });
    } else {
      // Escaped
      this.totalEarned = Math.max(0, this.totalEarned - TUNING.BUG_BOUNTY.ESCAPED_PENALTY_USD);
      this.escapedBugs++;
      this.statsText.setText(this.statsStr());

      const txt = this.add.text(bug.x, bug.y, `−$${TUNING.BUG_BOUNTY.ESCAPED_PENALTY_USD} ESCAPED`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ff0000',
      }).setDepth(30);
      this.tweens.add({
        targets: txt, y: txt.y - 30, alpha: 0, duration: 600,
        onComplete: () => txt.destroy(),
      });

      this.tweens.add({
        targets: bug.container, y: bug.container.y - 50, alpha: 0, duration: 500,
        onComplete: () => bug.container.destroy(),
      });
    }
  }

  private destroyAllBugs(): void {
    for (const bug of this.bugs) {
      if (bug.despawnFlashTimer) bug.despawnFlashTimer.destroy();
      bug.container.destroy();
    }
    this.bugs = [];
  }

  // ── Bug movement helpers ──────────────────────────────────────────────────

  private circleOverlapsRect(cx: number, cy: number, r: number, block: CodeBlock): boolean {
    const nearX = Phaser.Math.Clamp(cx, block.x, block.x + block.w);
    const nearY = Phaser.Math.Clamp(cy, block.y, block.y + block.h);
    return Math.hypot(cx - nearX, cy - nearY) < r;
  }

  private moveBugLinear(bug: HuntBug, speed: number, dt: number): void {
    let newX = bug.x + bug.direction.x * speed * dt;
    let newY = bug.y + bug.direction.y * speed * dt;

    // Arena edge bounce — X
    if (newX - bug.hitRadius < this.arenaX) {
      bug.direction.x = Math.abs(bug.direction.x);
      newX = this.arenaX + bug.hitRadius;
    } else if (newX + bug.hitRadius > this.arenaX + this.arenaW) {
      bug.direction.x = -Math.abs(bug.direction.x);
      newX = this.arenaX + this.arenaW - bug.hitRadius;
    }

    // Arena edge bounce — Y
    if (newY - bug.hitRadius < this.arenaY) {
      bug.direction.y = Math.abs(bug.direction.y);
      newY = this.arenaY + bug.hitRadius;
    } else if (newY + bug.hitRadius > this.arenaY + this.arenaH) {
      bug.direction.y = -Math.abs(bug.direction.y);
      newY = this.arenaY + this.arenaH - bug.hitRadius;
    }

    // Code block bounce — X axis (test newX vs current Y)
    for (const block of this.codeBlocks) {
      if (this.circleOverlapsRect(newX, bug.y, bug.hitRadius, block)) {
        bug.direction.x = -bug.direction.x;
        newX = bug.x;
        break;
      }
    }

    // Code block bounce — Y axis (test current X vs newY)
    for (const block of this.codeBlocks) {
      if (this.circleOverlapsRect(bug.x, newY, bug.hitRadius, block)) {
        bug.direction.y = -bug.direction.y;
        newY = bug.y;
        break;
      }
    }

    bug.x = newX;
    bug.y = newY;
  }

  // ── Bug update loop ───────────────────────────────────────────────────────

  private updateBugs(time: number, dt: number): void {
    const toRemove: HuntBug[] = [];

    for (const bug of this.bugs) {
      if (!bug.alive) continue;

      const age      = time - bug.spawnedAt;
      const def      = BUG_DEFS[bug.type];
      const timeLeft = def.despawnMs - age;

      if (timeLeft <= 0) {
        toRemove.push(bug);
        continue;
      }

      if (!bug.despawnWarned && timeLeft <= DESPAWN_WARN_MS) {
        this.startDespawnWarning(bug);
      }

      switch (bug.type) {
        case 'syntax':
          this.moveBugLinear(bug, SYNTAX_SPEED, dt);
          break;

        case 'logic': {
          if (bug.lastPause > 0) {
            // In pause — check if 500ms elapsed
            if (time - bug.lastPause >= 500) {
              bug.direction = this.randomDiagonal();
              bug.lastBurst = time; // resume timestamp
              bug.lastPause = 0;
            }
            // else: frozen
          } else {
            // Moving — check if 2s elapsed since last resume
            if (time - bug.lastBurst >= 2000) {
              bug.lastPause = time; // enter pause
            } else {
              this.moveBugLinear(bug, LOGIC_SPEED, dt);
            }
          }
          break;
        }

        case 'race': {
          const elapsed = time - bug.lastBurst;
          if (elapsed < 800) {
            // Burst phase
            this.moveBugLinear(bug, RACE_BURST_SPEED, dt);
          } else if (elapsed >= 1300) {
            // Start new burst
            bug.lastBurst = time;
            bug.burstDir  = this.randomUnitVector();
            bug.direction = { ...bug.burstDir };
          }
          // 800–1300ms: stopped
          break;
        }

        case 'memleak': {
          this.moveBugLinear(bug, MEMLEAK_SPEED, dt);
          const growFrac  = Math.min(age / 5000, 1);
          bug.growScale   = 1 + growFrac;
          bug.container.setScale(bug.growScale);
          if (!bug.cracked) {
            const shifted = lerpColor(def.color, def.dotColor, growFrac * 0.6);
            drawChipBg(bug.bgGraphics, shifted, 0.85 + growFrac * 0.1);
          }
          break;
        }

        case 'heisen': {
          this.moveBugLinear(bug, HEISEN_SPEED, dt);
          // Reappear after invisibility window
          if (bug.invisible && time >= bug.invisibleUntil) {
            bug.invisible = false;
            bug.container.setAlpha(1);
          }
          // Check bullet proximity — go invisible if any bullet within 40px
          // Short 400ms dodge window so players can actually land hits
          if (!bug.invisible) {
            const heisR = bug.hitRadius + BULLET_RADIUS;
            for (const bullet of this.bullets) {
              const d = Math.hypot(bullet.x - bug.x, bullet.y - bug.y);
              if (d < 40 && d >= heisR) {
                bug.invisible      = true;
                bug.invisibleUntil = time + 400;
                bug.container.setAlpha(0.15);
                break;
              }
            }
          }
          break;
        }
      }

      bug.container.setPosition(bug.x, bug.y);
    }

    for (const bug of toRemove) {
      this.removeHuntBug(bug, false);
    }

    this.bugs = this.bugs.filter(b => b.alive);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (this.ended) return;

    if (this.startTime === 0) {
      this.startTime    = time;
      this.lastAmmoRegen = time;
      this.lastSpawn    = time;
      // Spawn initial 3 bugs immediately
      this.spawnHuntBug('syntax', time);
      this.spawnHuntBug('logic',  time);
      this.spawnHuntBug('syntax', time);
    }

    // FPS telemetry
    const fps = delta > 0 ? 1000 / delta : 60;
    this.frameCount++;
    this.fpsSum += fps;
    if (fps < this.fpsMin) this.fpsMin = fps;
    if (fps > this.fpsMax) this.fpsMax = fps;

    const elapsed   = time - this.startTime;
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

    // Periodic bug spawning — every 3s if fewer than 6 alive
    const aliveBugs = this.bugs.filter(b => b.alive).length;
    if (aliveBugs < MAX_ALIVE_BUGS && time - this.lastSpawn >= BUG_SPAWN_INTERVAL) {
      this.spawnHuntBug(pickBugType(), time);
      this.lastSpawn = time;
    }

    // ── Movement & Aiming ──
    const dt = delta / 1000;
    const keys = this.keysDown;

    // Movement input
    let mx = 0;
    let my = 0;
    if (keys.has('a') || keys.has('arrowleft'))  mx -= 1;
    if (keys.has('d') || keys.has('arrowright')) mx += 1;
    if (keys.has('w') || keys.has('arrowup'))    my -= 1;
    if (keys.has('s') || keys.has('arrowdown'))  my += 1;

    // If moving, update facing and apply velocity
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      this.facingX = mx / len;
      this.facingY = my / len;
      this.walking = true;

      let newX = this.playerX + this.facingX * PLAYER_SPEED * dt;
      let newY = this.playerY + this.facingY * PLAYER_SPEED * dt;

      // Arena edge collision
      newX = Phaser.Math.Clamp(newX, this.arenaX + PLAYER_HW, this.arenaX + this.arenaW - PLAYER_HW);
      newY = Phaser.Math.Clamp(newY, this.arenaY + PLAYER_HH, this.arenaY + this.arenaH - PLAYER_HH);

      // Code block collision
      for (const block of this.codeBlocks) {
        if (this.circleOverlapsRect(newX, newY, Math.max(PLAYER_HW, PLAYER_HH), block)) {
          // Slide along axes if possible
          if (!this.circleOverlapsRect(newX, this.playerY, Math.max(PLAYER_HW, PLAYER_HH), block)) {
            newY = this.playerY;
          } else if (!this.circleOverlapsRect(this.playerX, newY, Math.max(PLAYER_HW, PLAYER_HH), block)) {
            newX = this.playerX;
          } else {
            newX = this.playerX;
            newY = this.playerY;
          }
          break;
        }
      }

      this.playerX = newX;
      this.playerY = newY;
    } else {
      this.walking = false;
    }

    this.aimAngle = Math.atan2(this.facingY, this.facingX);

    // Fire on space
    if (keys.has(' ')) {
      this.fireBullet();
      keys.delete(' '); // consume so it fires once per press
    }

    this.updateBullets(dt);
    this.updateBugs(time, dt);

    // ── Redraw dynamic objects ────────────────────────────────────────────────
    this.redrawPlayer();
    this.redrawCrosshair();
  }

    // ── Hit detection ─────────────────────────────────────────────────────────

  private checkBulletHitBug(bullet: Bullet, deltaSec: number): boolean {
    for (const bug of this.bugs) {
      if (!bug.alive) continue;
      if (bug.type === 'heisen' && bug.invisible) continue;

      const halfW = (bug.type === 'memleak' ? HIT_HALF_W[bug.type] * bug.growScale : HIT_HALF_W[bug.type]) + BULLET_RADIUS;
      const halfH = (bug.type === 'memleak' ? HIT_HALF_H * bug.growScale : HIT_HALF_H) + BULLET_RADIUS;
      const inBox = (px: number, py: number) =>
        Math.abs(px - bug.x) < halfW && Math.abs(py - bug.y) < halfH;

      if (inBox(bullet.x, bullet.y)) {
        this.logShotHit(bullet, bug);
        this.hitBug(bug);
        return true;
      }

      const travel = BULLET_SPEED * deltaSec;
      // steps based on smallest hit dimension to avoid tunneling
      const minHalf = Math.min(halfW, halfH);
      const steps = Math.max(2, Math.ceil(travel / (minHalf * 0.5)));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const sx = bullet.x - bullet.dx * travel * t;
        const sy = bullet.y - bullet.dy * travel * t;
        if (inBox(sx, sy)) {
          this.logShotHit(bullet, bug);
          this.hitBug(bug);
          return true;
        }
      }
    }
    return false;
  }

  private hitBug(bug: HuntBug): void {
    this.shotsHit++;
    AudioManager.getInstance().playSFX('key-correct');

    if (bug.type === 'memleak' && !bug.cracked) {
      bug.cracked = true;
      // Flicker the chip background to signal damage
      this.tweens.add({
        targets: bug.bgGraphics,
        alpha: { from: 0.5, to: 1.0 },
        duration: 80,
        yoyo: true,
        repeat: 6,
      });
      return;
    }

    this.killBug(bug);
  }

  private killBug(bug: HuntBug): void {
    bug.alive = false;
    const bl = this.bugLogs.get(bug);
    if (bl) bl.death = 'shot';
    if (bug.despawnFlashTimer) {
      bug.despawnFlashTimer.destroy();
      bug.despawnFlashTimer = null;
    }

    // Combo tracking
    const now = this.time.now;
    if (now - this.lastCatchTime < 2000) {
      this.comboCount++;
    } else {
      if (this.comboCount >= 2) {
        this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
      }
      this.comboCount = 1;
    }
    this.lastCatchTime = now;
    if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

    const comboMultiplier = 1 + (this.comboCount - 1) * TUNING.BUG_HUNT.COMBO_STEP;

    // Camera shake (stronger for heisen + white flash)
    if (bug.type === 'heisen') {
      this.cameras.main.shake(120, 0.008);
      const whiteFlash = this.add.rectangle(
        this.arenaX, this.arenaY, this.arenaW, this.arenaH, 0xffffff, 0.3
      ).setOrigin(0).setDepth(25);
      this.tweens.add({
        targets: whiteFlash, alpha: 0, duration: 50,
        onComplete: () => whiteFlash.destroy(),
      });
    } else {
      const shakeIntensity = 0.004 * Math.min(2, 1 + this.comboCount * 0.1);
      this.cameras.main.shake(80, shakeIntensity);
    }

    // 6-particle color burst
    const pColor = BUG_DEFS[bug.type].color;
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(bug.x, bug.y, 4, pColor).setDepth(25);
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * speed,
        y: p.y + Math.sin(angle) * speed,
        alpha: 0, duration: 400,
        onComplete: () => p.destroy(),
      });
    }

    // Scoring
    const def = BUG_DEFS[bug.type];
    let reward: number;
    if (bug.type === 'memleak') {
      reward = Math.floor((10 + bug.growScale * 10) * comboMultiplier);
    } else {
      reward = Math.floor(def.reward * comboMultiplier);
    }

    this.totalEarned += reward;
    this.bugCount++;
    this.statsText.setText(this.statsStr());

    // Combo UI
    if (this.comboCount >= 2) {
      this.comboText.setText(`COMBO ×${this.comboCount}`).setAlpha(1);
      this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }

    // Floating reward text
    const rewardStr = this.comboCount >= 2 ? `+$${reward} ×${this.comboCount}` : `+$${reward}`;
    const txt = this.add.text(bug.x, bug.y - 10, rewardStr, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd700',
    }).setDepth(30);
    this.tweens.add({
      targets: txt, y: txt.y - 30, alpha: 0, duration: 600,
      ease: 'Quad.easeOut', onComplete: () => txt.destroy(),
    });

    // Bug death animation: scale 2x + spin + fade
    this.tweens.add({
      targets: bug.container,
      scaleX: 2, scaleY: 2, angle: 360, alpha: 0,
      duration: 250, ease: 'Quad.easeOut',
      onComplete: () => bug.container.destroy(),
    });
  }

  // ── End game ──────────────────────────────────────────────────────────────

  private endGame(): void {
    if (this.ended) return;
    this.ended = true;
    this.destroyAllBullets();
    this.destroyAllBugs();

    const state = getState();
    const returnScene = state.bugHuntReturnScene || 'Night';
    state.bugHuntReturnScene = 'Night';

    const earned1_5x = Math.floor(this.totalEarned * TUNING.BUG_HUNT.OLD_SCHOOL_MULTIPLIER);
    state.budget += earned1_5x;
    state.totalBugsSquashed += this.bugCount;
    if (returnScene === 'Night') {
      state.bountyPlayedTonight = true;
    }

    let bonusHp = false;
    if (this.bugCount >= 10) {
      state.hardwareHp = Math.min(100, state.hardwareHp + 5);
      bonusHp = true;
    }
    if (this.bugCount >= 15) {
      AudioManager.getInstance().playVoice('event-bug-bounty');
    }

    Telemetry.patchBugBounty(this.totalEarned, this.bugCount, 'oldschool', this.shotsFired, this.shotsHit);

    // Detailed bug hunt telemetry
    const state2 = getState();
    Telemetry.logBugHunt({
      day: state2.day,
      mode: 'oldschool',
      duration: GAME_DURATION,
      shots: this.shotLogs,
      bugs: [...this.bugLogs.values()],
      fps: {
        min: Math.round(this.fpsMin === Infinity ? 0 : this.fpsMin),
        max: Math.round(this.fpsMax),
        avg: this.frameCount > 0 ? Math.round(this.fpsSum / this.frameCount) : 0,
      },
      earnings: this.totalEarned,
      bugsKilled: this.bugCount,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      accuracy: this.shotsFired > 0 ? this.shotsHit / this.shotsFired : 0,
    });

    const accuracy = this.shotsFired > 0
      ? Math.round((this.shotsHit / this.shotsFired) * 100)
      : 0;

    // End overlay
    const overlayX = GAME_WIDTH / 2;
    const overlayY = GAME_HEIGHT / 2;

    type LineEntry = { text: string; color: string; size: string };
    const lines: LineEntry[] = [
      { text: TUNING.COPY.TIME_EXPIRED_TITLE, color: '#58a6ff', size: '26px' },
      { text: `Bugs squashed: ${this.bugCount}`, color: '#e6edf3', size: '16px' },
      { text: `Earned: $${this.totalEarned}`, color: '#e6edf3', size: '16px' },
      { text: `Old School Bonus: ×${TUNING.BUG_HUNT.OLD_SCHOOL_MULTIPLIER}`, color: '#ffd700', size: '16px' },
      { text: `Total: $${earned1_5x}`, color: '#3fb950', size: '18px' },
      { text: `Shots fired: ${this.shotsFired} | Accuracy: ${accuracy}%`, color: '#9da5b0', size: '14px' },
    ];
    if (this.escapedBugs > 0) {
      lines.push({ text: `Escaped: ${this.escapedBugs} (−$${this.escapedBugs * TUNING.BUG_BOUNTY.ESCAPED_PENALTY_USD})`, color: '#f85149', size: '14px' });
    }
    if (bonusHp) {
      lines.push({ text: '+5 HP hardware repair bonus', color: '#3fb950', size: '16px' });
    }
    if (this.maxCombo >= 2) {
      lines.push({ text: `Best combo: ×${this.maxCombo}`, color: '#3fb950', size: '16px' });
    }

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
    btn.on('pointerout',  () => btn.setColor('#58a6ff'));
    btn.on('pointerdown', () => this.scene.start(returnScene));
  }

  shutdown(): void {}
}
