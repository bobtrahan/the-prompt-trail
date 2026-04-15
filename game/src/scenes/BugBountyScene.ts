import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Telemetry } from '../systems/Telemetry';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';

// ── Bug type definitions ──────────────────────────────────────────────────────

type BugType = 'syntax' | 'logic' | 'race' | 'memleak' | 'heisen';

interface BugConfig {
  emoji: string;
  label: string;
  reward: number;
  despawnMs: number;
  weight: number;
  color: number;
  dotColor: number;
}

const BUG_DEFS: Record<BugType, BugConfig> = {
  syntax:  { emoji: '🔴', label: 'SyntaxError',    reward: 10, despawnMs: 6000, weight: 35, color: 0xda3633, dotColor: 0xff6b6b },
  logic:   { emoji: '🟡', label: 'LogicBug',       reward: 15, despawnMs: 8000, weight: 25, color: 0xd29922, dotColor: 0xffd166 },
  race:    { emoji: '🟣', label: 'RaceCondition',  reward: 20, despawnMs: 6000, weight: 15, color: 0x8957e5, dotColor: 0xb89af7 },
  memleak: { emoji: '🟢', label: 'MemoryLeak',     reward: 10, despawnMs: 8000, weight: 15, color: 0x238636, dotColor: 0x3fb950 },
  heisen:  { emoji: '👻', label: 'Heisenbug',      reward: 30, despawnMs: 5000, weight: 10, color: 0x6e7681, dotColor: 0x9aa6b2 },
};

// Chip dimensions (centered at container origin)
const CHIP_W = 120;
const CHIP_H = 28;
const CHIP_R = 6; // corner radius

interface ActiveBug {
  obj: Phaser.GameObjects.Container;
  type: BugType;
  spawnedAt: number;
  direction: number;      // logic: +1 / -1
  lastTeleport: number;   // race: age-ms of last teleport

  // chip child refs
  bgGraphics: Phaser.GameObjects.Graphics;
  glowRect: Phaser.GameObjects.Rectangle;
  borderRect: Phaser.GameObjects.Rectangle;
  labelText: Phaser.GameObjects.Text;

  // despawn / heisen state
  despawnWarned: boolean;
  bangText: Phaser.GameObjects.Text | null;
  despawnFlashTimer: Phaser.Time.TimerEvent | null;
  heisenScrambling: boolean;
  heisenTimer: Phaser.Time.TimerEvent | null;
}

// ── Fake code grid ────────────────────────────────────────────────────────────

const CODE_LINES = [
  'async function deployModel(cfg: Config): Promise<void> {',
  '  const res = await fetch(`/api/infer`, { method: "POST", body: cfg });',
  '  if (res.ok) { cache.set(cfg.id, await res.json()); }',
  '  for (let i = 0; i <= tokens.length; i++) process(tokens[i]);',
  '  setState(prev => ({ ...prev, running: !prev.running }));',
  '  const data = JSON.parse(fs.readFileSync("./config.json"));',
  '  await Promise.all(workers.map(w => w.run(task)));',
  '  if (flag = true) { launch(); }  // intentional',
  '  const leak = new Array(1e6).fill(globalRef);',
  '  setTimeout(() => resolve(), Math.random() * 100);',
  '  return Object.keys(obj).reduce((a, k) => a + obj[k], 0);',
  '}  // TODO: fix before prod',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickBugType(): BugType {
  const total = Object.values(BUG_DEFS).reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const [type, def] of Object.entries(BUG_DEFS) as [BugType, BugConfig][]) {
    r -= def.weight;
    if (r <= 0) return type;
  }
  return 'syntax';
}

/** Draw the chip background into a Graphics object (reusable for memleak color shifts) */
function drawChipBg(gfx: Phaser.GameObjects.Graphics, color: number, alpha = 0.85): void {
  gfx.clear();
  gfx.fillStyle(color, alpha);
  gfx.fillRoundedRect(-CHIP_W / 2, -CHIP_H / 2, CHIP_W, CHIP_H, CHIP_R);
}

/** Linearly interpolate between two packed RGB colors (no alpha) */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl2 = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl2;
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
function scramble(len: number): string {
  return Array.from({ length: len }, () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join('');
}

// ── Scene ─────────────────────────────────────────────────────────────────────

const WIN_W = 900;
const WIN_H = 520;
const GAME_DURATION = 30_000;
const SPAWN_INTERVAL = 1500;
const MAX_BUGS = 5;
const TIMER_BAR_H = 8;
const DESPAWN_WARN_MS = 1500;

export class BugBountyScene extends Phaser.Scene {
  // UI
  private win!: Window;
  private taskbar!: Taskbar;
  private statsText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerBarBg!: Phaser.GameObjects.Rectangle;

  // Grid bounds (absolute scene coords)
  private gridX = 0;
  private gridY = 0;
  private gridW = 0;
  private gridH = 0;

  // Game state
  private bugs: ActiveBug[] = [];
  private bugCount = 0;
  private totalEarned = 0;
  private lastMissClick = 0;
  private timePenalty = 0;
  private missClicks = 0;
  private escapedBugs = 0;
  private startTime = 0;
  private lastCatchTime = 0;
  private comboCount = 0;
  private maxCombo = 0;
  private comboText!: Phaser.GameObjects.Text;
  private lastSpawn = 0;
  private ended = false;

  constructor() {
    super({ key: 'BugBounty' });
  }

  create(): void {
    // Reset all game state first (critical for scene re-entry)
    this.bugs = [];
    this.bugCount = 0;
    this.totalEarned = 0;
    this.lastMissClick = 0;
    this.timePenalty = 0;
    this.missClicks = 0;
    this.escapedBugs = 0;
    this.lastSpawn = 0;
    this.lastCatchTime = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.ended = false;

    AudioManager.getInstance().playMusic('bugbounty');

    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    // Taskbar
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
      title: 'Bug Bounty ── Terminal',
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

    this.comboText = this.add.text(this.gridX, this.gridY - 4, '', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0, 1).setDepth(25).setAlpha(0);

    // ── Code lines ───────────────────────────────────────────────────────────
    const lineH = 28;
    const codeStartY = caAbsY + TIMER_BAR_H + 26;
    CODE_LINES.forEach((line, i) => {
      this.add.text(
        caAbsX + 8,
        codeStartY + i * lineH,
        line,
        { fontFamily: 'monospace', fontSize: '12px', color: '#3d444d' }
      ).setDepth(11);
    });

    // Grid bounds where bugs can spawn
    this.gridX = caAbsX + 8;
    this.gridY = codeStartY;
    this.gridW = ca.width - 16;
    this.gridH = CODE_LINES.length * lineH;

    const gridBg = this.add.rectangle(this.gridX, this.gridY, this.gridW, this.gridH, 0x000000, 0)
      .setOrigin(0).setDepth(15).setInteractive();
    gridBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleMissClick(pointer.x, pointer.y));
  }

  private handleMissClick(x: number, y: number): void {
    const now = this.time.now;
    if (now - this.lastMissClick < 200) return;
    this.lastMissClick = now;

    this.timePenalty += 1000;
    this.missClicks++;
    AudioManager.getInstance().playSFX('bug-miss');

    const flash = this.add.rectangle(this.gridX, this.gridY, this.gridW, this.gridH, 0xff0000, 0.15)
      .setOrigin(0).setDepth(25);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    const txt = this.add.text(x, y, '−1s', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ff0000',
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 400, onComplete: () => txt.destroy() });
  }

  update(time: number, _delta: number): void {
    if (this.ended) return;

    // Initialize timing on first update frame
    if (this.startTime === 0) {
      this.startTime = time;
      this.lastSpawn = time;
    }

    const elapsed = time - this.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed - this.timePenalty);
    const frac = remaining / GAME_DURATION;

    // Update timer bar
    this.timerBar.width = (this.win.contentArea.width) * frac;

    if (remaining <= 0) {
      this.endGame();
      return;
    }

    // Spawn bugs
    if (time - this.lastSpawn >= SPAWN_INTERVAL && this.bugs.length < MAX_BUGS) {
      this.spawnBug(time);
      this.lastSpawn = time;
    }

    // Update bugs
    const pointer = this.input.activePointer;
    const toRemove: ActiveBug[] = [];

    for (const bug of this.bugs) {
      const age = time - bug.spawnedAt;
      const def = BUG_DEFS[bug.type];
      const timeLeft = def.despawnMs - age;

      // Despawn check
      if (timeLeft <= 0) {
        toRemove.push(bug);
        continue;
      }

      // Despawn warning: <1500ms remaining
      if (!bug.despawnWarned && timeLeft <= DESPAWN_WARN_MS) {
        this.startDespawnWarning(bug, def);
      }

      switch (bug.type) {
        case 'logic': {
          // Move up/down 1px per frame, bounce at grid bounds
          bug.obj.y += bug.direction;
          if (bug.obj.y > this.gridY + this.gridH - 20) bug.direction = -1;
          if (bug.obj.y < this.gridY) bug.direction = 1;
          break;
        }
        case 'race': {
          // Teleport every 2s
          if (age - bug.lastTeleport >= 2000) {
            bug.obj.x = this.gridX + Math.random() * (this.gridW - CHIP_W) + CHIP_W / 2;
            bug.obj.y = this.gridY + Math.random() * (this.gridH - CHIP_H) + CHIP_H / 2;
            bug.lastTeleport = age;
            // Post-teleport: scale 0.5→1.0 + spin 180°
            bug.obj.setScale(0.5);
            bug.obj.angle = 0;
            this.tweens.add({
              targets: bug.obj,
              scaleX: 1,
              scaleY: 1,
              angle: 180,
              duration: 200,
              ease: 'Quad.easeOut',
              onComplete: () => { bug.obj.angle = 0; },
            });
          }
          break;
        }
        case 'memleak': {
          // Grow scale 1.0 → 2.0 over 5s
          const growFrac = Math.min(age / 5000, 1);
          bug.obj.setScale(1 + growFrac);
          // Chip bg gets brighter/more saturated as it grows
          const shiftedColor = lerpColor(def.color, def.dotColor, growFrac * 0.6);
          drawChipBg(bug.bgGraphics, shiftedColor, 0.85 + growFrac * 0.1);
          break;
        }
        case 'heisen': {
          const dx = pointer.x - bug.obj.x;
          const dy = pointer.y - bug.obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const near = dist < 80;
          bug.obj.setAlpha(near ? 0.15 : 1);

          // Start scramble timer when cursor enters
          if (near && !bug.heisenScrambling) {
            bug.heisenScrambling = true;
            const labelLen = def.label.length;
            bug.heisenTimer = this.time.addEvent({
              delay: 100,
              loop: true,
              callback: () => {
                if (!bug.heisenScrambling) return;
                bug.labelText.setText(scramble(labelLen));
              },
            });
          } else if (!near && bug.heisenScrambling) {
            bug.heisenScrambling = false;
            if (bug.heisenTimer) { bug.heisenTimer.destroy(); bug.heisenTimer = null; }
            bug.labelText.setText(def.label);
          }
          break;
        }
        // syntax: handled by tween, nothing to do here
      }
    }

    for (const bug of toRemove) {
      this.removeBug(bug, false);
    }
  }

  // ── Chip factory ─────────────────────────────────────────────────────────────

  private buildChip(type: BugType): {
    container: Phaser.GameObjects.Container;
    bgGraphics: Phaser.GameObjects.Graphics;
    glowRect: Phaser.GameObjects.Rectangle;
    borderRect: Phaser.GameObjects.Rectangle;
    labelText: Phaser.GameObjects.Text;
  } {
    const def = BUG_DEFS[type];
    const hw = CHIP_W / 2;
    const hh = CHIP_H / 2;

    // Glow rect (behind everything, slow pulse via tween after creation)
    const glowRect = this.add.rectangle(0, 0, CHIP_W + 8, CHIP_H + 8, def.color, 0.08).setOrigin(0.5);

    // Drop shadow (dark rect offset 2,2)
    const shadow = this.add.rectangle(2, 2, CHIP_W, CHIP_H, 0x000000, 0.3).setOrigin(0.5);

    // Background graphics (rounded rect)
    const bgGraphics = this.add.graphics();
    drawChipBg(bgGraphics, def.color, 0.85);

    // Border rectangle (for despawn warning flash, normally invisible)
    const borderRect = this.add.rectangle(0, 0, CHIP_W, CHIP_H, 0x000000, 0)
      .setStrokeStyle(2, 0xffffff, 0)
      .setOrigin(0.5);

    // Severity dot (circle via graphics)
    const dotGfx = this.add.graphics();
    dotGfx.fillStyle(def.dotColor, 1);
    dotGfx.fillCircle(-hw + 14, 0, 4);

    // Label text
    const labelText = this.add.text(-hw + 24, 0, def.label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const container = this.add.container(0, 0, [
      glowRect,
      shadow,
      bgGraphics,
      borderRect,
      dotGfx,
      labelText,
    ]);

    // Hit area matches chip bounds
    container.setInteractive(
      new Phaser.Geom.Rectangle(-hw, -hh, CHIP_W, CHIP_H),
      Phaser.Geom.Rectangle.Contains
    );
    container.input!.cursor = 'pointer';

    return { container, bgGraphics, glowRect, borderRect, labelText };
  }

  // ── Spawn ─────────────────────────────────────────────────────────────────────

  private spawnBug(time: number): void {
    const type = pickBugType();
    const def = BUG_DEFS[type];

    const x = this.gridX + CHIP_W / 2 + Math.random() * (this.gridW - CHIP_W);
    const y = this.gridY + CHIP_H / 2 + Math.random() * (this.gridH - CHIP_H);

    const { container, bgGraphics, glowRect, borderRect, labelText } = this.buildChip(type);
    container.setPosition(x, y).setDepth(20).setScale(0);

    const bug: ActiveBug = {
      obj: container,
      type,
      spawnedAt: time,
      direction: Math.random() < 0.5 ? 1 : -1,
      lastTeleport: 0,
      bgGraphics,
      glowRect,
      borderRect,
      labelText,
      despawnWarned: false,
      bangText: null,
      despawnFlashTimer: null,
      heisenScrambling: false,
      heisenTimer: null,
    };

    // Spawn animation: scale 0 → 1
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Glow pulse
    this.tweens.add({
      targets: glowRect,
      alpha: { from: 0.05, to: 0.12 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Type-specific idle animations
    switch (type) {
      case 'syntax':
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        break;

      case 'logic':
        // Rotation wobble ±3°
        this.tweens.add({
          targets: container,
          angle: { from: -3, to: 3 },
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        break;

      case 'heisen':
        // y-float ±4px (tween relative to spawn y)
        this.tweens.add({
          targets: container,
          y: { from: y - 4, to: y + 4 },
          duration: 1250,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        break;

      // race, memleak: handled in update loop
    }

    container.on('pointerdown', () => this.catchBug(bug));

    this.bugs.push(bug);
  }

  // ── Despawn warning ──────────────────────────────────────────────────────────

  private startDespawnWarning(bug: ActiveBug, def: BugConfig): void {
    bug.despawnWarned = true;

    // Make border visible and flash it
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

    // "!" badge next to label
    bug.bangText = this.add.text(CHIP_W / 2 + 4, 0, '!', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff6b6b',
    }).setOrigin(0, 0.5);
    bug.obj.add(bug.bangText);

    void def; // suppress unused warning
  }

  // ── Catch ─────────────────────────────────────────────────────────────────────

  private catchBug(bug: ActiveBug): void {
    if (!this.bugs.includes(bug)) return;

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

    const comboMultiplier = 1 + (this.comboCount - 1) * 0.25;

    if (bug.type === 'heisen') {
      this.cameras.main.shake(120, 0.008);
      const whiteFlash = this.add.rectangle(this.gridX, this.gridY, this.gridW, this.gridH, 0xffffff, 0.3)
        .setOrigin(0).setDepth(25);
      this.tweens.add({ targets: whiteFlash, alpha: 0, duration: 50, onComplete: () => whiteFlash.destroy() });
    } else {
      const shakeIntensity = 0.004 * Math.min(2, 1 + this.comboCount * 0.1);
      this.cameras.main.shake(80, shakeIntensity);
    }

    const bugX = bug.obj.x;
    const bugY = bug.obj.y;
    const pColor = BUG_DEFS[bug.type].color;
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(bugX, bugY, 4, pColor).setDepth(25);
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.tweens.add({
        targets: p, x: p.x + Math.cos(angle) * speed, y: p.y + Math.sin(angle) * speed,
        alpha: 0, duration: 400, onComplete: () => p.destroy()
      });
    }

    const def = BUG_DEFS[bug.type];
    let reward = Math.floor(def.reward * comboMultiplier);

    // Memory leak: bonus based on scale
    if (bug.type === 'memleak') {
      reward = Math.floor((10 + bug.obj.scaleX * 10) * comboMultiplier);
    }

    if (this.comboCount >= 2) {
      this.comboText.setText(`COMBO ×${this.comboCount}`).setAlpha(1);
      this.tweens.add({ targets: this.comboText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
    }

    this.totalEarned += reward;
    this.bugCount += 1;
    this.updateStats();

    // Flash reward text
    const rewardStr = this.comboCount >= 2 ? `+$${reward} ×${this.comboCount}` : `+$${reward}`;
    const flash = this.add.text(bug.obj.x, bug.obj.y - 10, rewardStr, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd700',
    }).setDepth(30);

    this.tweens.add({
      targets: flash,
      y: flash.y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Scale bounce on stats
    this.tweens.add({
      targets: this.statsText,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 100,
      yoyo: true,
    });

    this.removeBug(bug, true);
  }

  // ── Remove ────────────────────────────────────────────────────────────────────

  private removeBug(bug: ActiveBug, caught: boolean): void {
    const idx = this.bugs.indexOf(bug);
    if (idx === -1) return;
    this.bugs.splice(idx, 1);

    // Clean up timers
    if (bug.despawnFlashTimer) { bug.despawnFlashTimer.destroy(); bug.despawnFlashTimer = null; }
    if (bug.heisenTimer) { bug.heisenTimer.destroy(); bug.heisenTimer = null; }

    if (caught) {
      this.tweens.add({
        targets: bug.obj,
        scaleX: 2, scaleY: 2, angle: 360, alpha: 0,
        duration: 250, ease: 'Quad.easeOut',
        onComplete: () => bug.obj.destroy(),
      });
    } else {
      this.totalEarned = Math.max(0, this.totalEarned - 5);
      this.escapedBugs++;
      this.updateStats();
      AudioManager.getInstance().playSFX('bug-miss');

      const txt = this.add.text(bug.obj.x, bug.obj.y, '−$5 ESCAPED', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ff0000',
      }).setDepth(30);
      this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 600, onComplete: () => txt.destroy() });

      this.tweens.add({
        targets: bug.obj, y: bug.obj.y - 50, alpha: 0, duration: 500,
        onComplete: () => bug.obj.destroy()
      });
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  private updateStats(): void {
    this.statsText.setText(this.statsStr());
  }

  private statsStr(): string {
    return `Bugs: ${this.bugCount} | Earned: $${this.totalEarned}`;
  }

  // ── End game ──────────────────────────────────────────────────────────────────

  private endGame(): void {
    if (this.ended) return;
    this.ended = true;

    // Destroy remaining bugs
    for (const bug of this.bugs) {
      if (bug.despawnFlashTimer) bug.despawnFlashTimer.destroy();
      if (bug.heisenTimer) bug.heisenTimer.destroy();
      bug.obj.destroy();
    }
    this.bugs = [];

    // Apply earnings + HP bonus + mark played
    const state = getState();
    const returnScene = state.bugHuntReturnScene || 'Night';
    state.bugHuntReturnScene = 'Night';
    state.budget += this.totalEarned;
    Telemetry.patchBugBounty(this.totalEarned, this.bugCount);
    state.totalBugsSquashed += this.bugCount;
    if (returnScene === 'Night') {
      state.bountyPlayedTonight = true;
    }
    let bonusHp = false;
    if (this.bugCount >= 10) {
      state.hardwareHp = Math.min(100, state.hardwareHp + 5);
      bonusHp = true;
    }

    // Overlay
    const overlayX = GAME_WIDTH / 2;
    const overlayY = GAME_HEIGHT / 2;

    type LineEntry = { text: string; color: string; size: string };
    const lines: LineEntry[] = [
      { text: "Time's up!", color: '#58a6ff', size: '26px' },
      { text: `Bugs squashed: ${this.bugCount}`, color: '#e6edf3', size: '16px' },
      { text: `Earned: $${this.totalEarned}`, color: '#e6edf3', size: '16px' },
    ];
    if (this.missClicks > 0) lines.push({ text: `Misclicks: ${this.missClicks} (−${this.missClicks}s)`, color: '#f85149', size: '14px' });
    if (this.escapedBugs > 0) lines.push({ text: `Escaped: ${this.escapedBugs} (−$${this.escapedBugs * 5})`, color: '#f85149', size: '14px' });
    if (bonusHp) lines.push({ text: '+5 HP hardware repair bonus', color: '#3fb950', size: '16px' });
    if (this.maxCombo >= 2) lines.push({ text: `Best combo: ×${this.maxCombo}`, color: '#3fb950', size: '16px' });

    const overlayH = 120 + lines.length * 34;
    const overlay = this.add.rectangle(overlayX, overlayY, WIN_W - 40, overlayH, 0x0f1117, 0.95)
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

    void overlay;
  }

  shutdown(): void {
    AudioManager.getInstance().playMusic('night');
  }
}
