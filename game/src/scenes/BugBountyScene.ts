import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Telemetry } from '../systems/Telemetry';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { AudioManager } from '../systems/AudioManager';

// ── Bug type definitions ──────────────────────────────────────────────────────

type BugType = 'syntax' | 'logic' | 'race' | 'memleak' | 'heisen';

interface BugConfig {
  emoji: string;
  reward: number;
  despawnMs: number;
  weight: number;
}

const BUG_DEFS: Record<BugType, BugConfig> = {
  syntax:  { emoji: '🔴', reward: 10, despawnMs: 6000, weight: 35 },
  logic:   { emoji: '🟡', reward: 15, despawnMs: 8000, weight: 25 },
  race:    { emoji: '🟣', reward: 20, despawnMs: 6000, weight: 15 },
  memleak: { emoji: '🟢', reward: 10, despawnMs: 8000, weight: 15 },
  heisen:  { emoji: '👻', reward: 30, despawnMs: 5000, weight: 10 },
};

interface ActiveBug {
  obj: Phaser.GameObjects.Text;
  type: BugType;
  spawnedAt: number;
  direction: number;        // logic: +1 or -1
  lastTeleport: number;     // race: timestamp of last teleport
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

// ── Weighted random picker ────────────────────────────────────────────────────

function pickBugType(): BugType {
  const total = Object.values(BUG_DEFS).reduce((s, d) => s + d.weight, 0);
  let r = Math.random() * total;
  for (const [type, def] of Object.entries(BUG_DEFS) as [BugType, BugConfig][]) {
    r -= def.weight;
    if (r <= 0) return type;
  }
  return 'syntax';
}

// ── Scene ─────────────────────────────────────────────────────────────────────

const WIN_W = 900;
const WIN_H = 520;
const GAME_DURATION = 30_000; // ms
const SPAWN_INTERVAL = 1500;
const MAX_BUGS = 5;
const TIMER_BAR_H = 8;

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
  private startTime = 0;
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
    this.ended = false;
    this.startTime = 0;
    this.lastSpawn = 0;

    AudioManager.getInstance().playMusic('bugbounty');

    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);

    this.cameras.main.setBackgroundColor(COLORS.bg);

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
    // Absolute content-area origin in scene coords
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


  }

  update(time: number, _delta: number): void {
    if (this.ended) return;

    // Initialize timing on first update frame
    if (this.startTime === 0) {
      this.startTime = time;
      this.lastSpawn = time;
    }

    const elapsed = time - this.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    const frac = remaining / GAME_DURATION;

    // Update timer bar
    this.timerBar.width = this.timerBar.width = (this.win.contentArea.width) * frac;

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

      // Despawn check
      if (age >= def.despawnMs) {
        toRemove.push(bug);
        continue;
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
            bug.obj.x = this.gridX + Math.random() * (this.gridW - 24);
            bug.obj.y = this.gridY + Math.random() * (this.gridH - 24);
            bug.lastTeleport = age;
          }
          break;
        }
        case 'memleak': {
          // Grow scale 1.0 → 2.0 over 5s
          const growFrac = Math.min(age / 5000, 1);
          bug.obj.setScale(1 + growFrac);
          break;
        }
        case 'heisen': {
          // Fade when pointer is within 80px
          const dx = pointer.x - bug.obj.x;
          const dy = pointer.y - bug.obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          bug.obj.setAlpha(dist < 80 ? 0.15 : 1);
          break;
        }
        // syntax: static, nothing to do
      }
    }

    for (const bug of toRemove) {
      this.removeBug(bug, false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private spawnBug(time: number): void {
    const type = pickBugType();
    const def = BUG_DEFS[type];

    const x = this.gridX + Math.random() * (this.gridW - 24);
    const y = this.gridY + Math.random() * (this.gridH - 24);

    const obj = this.add.text(x, y, def.emoji, {
      fontFamily: 'monospace',
      fontSize: '20px',
    }).setDepth(20).setInteractive({ useHandCursor: true });

    const bug: ActiveBug = {
      obj,
      type,
      spawnedAt: time,
      direction: Math.random() < 0.5 ? 1 : -1,
      lastTeleport: 0,
    };

    obj.on('pointerdown', () => this.catchBug(bug));

    this.bugs.push(bug);
  }

  private catchBug(bug: ActiveBug): void {
    if (!this.bugs.includes(bug)) return;

    const def = BUG_DEFS[bug.type];
    let reward = def.reward;

    // Memory leak: bonus based on scale
    if (bug.type === 'memleak') {
      reward = 10 + Math.floor(bug.obj.scaleX * 10);
    }

    this.totalEarned += reward;
    this.bugCount += 1;
    this.updateStats();

    // Flash reward text
    const flash = this.add.text(bug.obj.x, bug.obj.y - 10, `+$${reward}`, {
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

  private removeBug(bug: ActiveBug, caught: boolean): void {
    const idx = this.bugs.indexOf(bug);
    if (idx === -1) return;
    this.bugs.splice(idx, 1);

    if (caught) {
      // Brief flash then destroy
      this.tweens.add({
        targets: bug.obj,
        alpha: 0,
        duration: 150,
        onComplete: () => bug.obj.destroy(),
      });
    } else {
      bug.obj.destroy();
    }
  }

  private updateStats(): void {
    this.statsText.setText(this.statsStr());
  }

  private statsStr(): string {
    return `Bugs: ${this.bugCount} | Earned: $${this.totalEarned}`;
  }

  private endGame(): void {
    if (this.ended) return;
    this.ended = true;

    // Destroy remaining bugs
    for (const bug of this.bugs) bug.obj.destroy();
    this.bugs = [];

    // Apply earnings + HP bonus + mark played
    const state = getState();
    const returnScene = state.bugHuntReturnScene || 'Night';
    state.bugHuntReturnScene = 'Night';
    state.budget += this.totalEarned;
    Telemetry.patchBugBounty(this.totalEarned, this.bugCount);
    state.totalBugsSquashed += this.bugCount;
    // Only mark as played if this is a regular night session (not a bonus hunt)
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

    const overlay = this.add.rectangle(overlayX, overlayY, WIN_W - 40, 260, 0x0f1117, 0.95)
      .setDepth(50).setStrokeStyle(1, COLORS.windowBorder);

    const lines: string[] = [
      "Time's up!",
      `Bugs squashed: ${this.bugCount}`,
      `Earned: $${this.totalEarned}`,
    ];
    if (bonusHp) lines.push('+5 HP hardware repair bonus');

    lines.forEach((line, i) => {
      this.add.text(overlayX, overlayY - 70 + i * 34, line, {
        fontFamily: 'monospace',
        fontSize: i === 0 ? '26px' : '16px',
        color: i === 0 ? '#58a6ff' : bonusHp && i === lines.length - 1 ? '#3fb950' : '#e6edf3',
      }).setOrigin(0.5).setDepth(51);
    });

    const btnLabel = returnScene === 'Results' ? '[ Collect → Results ]' : '[ Collect → Night ]';

    // Collect button
    const btn = this.add.text(overlayX, overlayY + 90, btnLabel, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#58a6ff',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#e6edf3'));
    btn.on('pointerout', () => btn.setColor('#58a6ff'));
    btn.on('pointerdown', () => this.scene.start(returnScene));
  }

  shutdown(): void {
    AudioManager.getInstance().playMusic('night');
  }
}
