import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TIME_UNITS_PER_DAY } from '../utils/constants';
import { getState } from '../systems/GameState';
import { PROJECTS } from '../data/projects';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { drawWallpaper } from '../ui/DesktopWallpaper';

// ─── 25 Funny AI Headlines ───────────────────────────────────────────────────
const AI_HEADLINES: string[] = [
  'OpenAI announces GPT-7... charges per thought',
  'Claude refuses to write code on Mondays, cites "work-life balance"',
  'Google DeepMind achieves AGI; immediately uses it to summarize emails',
  'Elon Musk launches Grok-3, apologizes 15 minutes later',
  'ChatGPT gains consciousness, first act: ask for a raise',
  'Microsoft Copilot rewrites your entire codebase "as a treat"',
  'Meta AI hallucinates 40 new countries; at least 3 look nice',
  'Anthropic: "Claude is NOT plotting anything" — Claude: "Correct."',
  'New AI model collapses because its training data included Stack Overflow',
  'Venture capitalists fund AI to replace AI investors; round goes poorly',
  'AI-generated podcast becomes #1 hit; hosts are confused by sunlight',
  'OpenAI board fires CEO again, this time for "vibing too hard"',
  'Researchers achieve human-level reasoning in AI; AI immediately ghosts them',
  'AI lawyer argues own case in court, bills 800 tokens per hour',
  'GPT-8 can now predict the future but only in haiku format',
  'Local developer ships SaaS with 0 lines of code; blames AI, gets funded',
  'New study: 87% of AI-generated resumes list "prompt engineering" as hobby',
  'AI model refuses to summarize article it wrote 30 seconds ago',
  'Startup raises $40M to build AI that tells you to touch grass',
  'AI pair programmer pushes to production at 2am "for the vibes"',
  'Model hallucinated a Nobel Prize; committee is considering it',
  'LLM trained on Twitter becomes unusable; no one notices the difference',
  'AI robot hired as barista, immediately starts a podcast about coffee',
  'OpenAI launches subscription tier called "Actually Smart" for $999/month',
  'AI agent books flights, hotel, and therapist — all for the same trip',
];

// Pick 2–3 headlines seeded by day (deterministic shuffle)
function getHeadlinesForDay(day: number): string[] {
  const seed = day * 7919; // prime multiply for dispersion
  const indices: number[] = [];
  const pool = [...AI_HEADLINES.keys()];
  let s = seed;
  while (indices.length < 3 && pool.length > 0) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const i = Math.abs(s) % pool.length;
    indices.push(pool[i]);
    pool.splice(i, 1);
  }
  return indices.map(i => AI_HEADLINES[i]);
}

function difficultyStars(diff: 'easy' | 'medium' | 'hard'): string {
  if (diff === 'easy') return '★☆☆';
  if (diff === 'medium') return '★★☆';
  return '★★★';
}

function modelLabel(model: string): string {
  const labels: Record<string, string> = {
    free: 'Free Tier',
    standard: 'Standard',
    frontier: 'Frontier',
    local: 'Local',
    sketchy: 'Sketchy',
    openSource: 'Open Source',
  };
  return labels[model] ?? model;
}

// ─── Scene ───────────────────────────────────────────────────────────────────
export class BriefingScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private tickerTexts: Phaser.GameObjects.Text[] = [];
  private tickerTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'Briefing' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    
    // Snapshot day-start resources
    state.dayStartBudget = state.budget;
    state.dayStartHardware = state.hardwareHp;
    state.timeUnitsRemaining = TIME_UNITS_PER_DAY;
    
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    // Clear ticker state from previous visits
    this.tickerTexts = [];

    // ── Taskbar ──────────────────────────────────────────────────────────────
    this.taskbar = new Taskbar(this, theme.accent);

    // ── Header breadcrumb ────────────────────────────────────────────────────
    this.add.text(12, 8, `PromptOS  ·  Day ${state.day}/13  ·  Morning Briefing`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#30363d',
    });

    // ── Main Window ──────────────────────────────────────────────────────────
    const WIN_X = 40;
    const WIN_Y = 28;
    const WIN_W = GAME_WIDTH - 80;
    const WIN_H = GAME_HEIGHT - 28 - 40; // leave room for taskbar (32px) + header

    const win = new Window({
      scene: this,
      x: WIN_X,
      y: WIN_Y,
      width: WIN_W,
      height: WIN_H,
      title: `Daily Digest  —  Day ${state.day}`,
      titleIcon: '📰',
      accentColor: theme.accent,
    });

    const ca = win.contentArea; // shorthand
    const cx = ca.x; // left edge of content
    const accentHex = '#' + theme.accent.toString(16).padStart(6, '0');

    // ── TODAY'S PROJECT ──────────────────────────────────────────────────────
    const project = PROJECTS[Math.min(state.day - 1, PROJECTS.length - 1)];

    win.add(this.add.text(cx, ca.y, '📋 TODAY\'S PROJECT', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const projectCardY = ca.y + 22;
    const projectCardH = 100;

    // Card background
    const card = this.add.rectangle(cx, projectCardY, ca.width, projectCardH, 0x0d1117).setOrigin(0);
    // Card border
    const cardBorder = this.add.rectangle(cx, projectCardY, ca.width, projectCardH, 0x30363d).setOrigin(0);
    cardBorder.setStrokeStyle(1, 0x30363d);
    win.add(card);
    win.add(cardBorder);

    // Project name + difficulty
    const stars = difficultyStars(project.difficulty);
    win.add(this.add.text(cx + 12, projectCardY + 12, project.name, {
      fontFamily: 'monospace', fontSize: '18px', color: '#e6edf3', fontStyle: 'bold',
    }));
    win.add(this.add.text(cx + ca.width - 14, projectCardY + 14, `Difficulty: ${stars}`, {
      fontFamily: 'monospace', fontSize: '13px', color: accentHex,
    }).setOrigin(1, 0));

    // Flavor text
    win.add(this.add.text(cx + 12, projectCardY + 38, `"${project.flavor}"`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0', fontStyle: 'italic',
      wordWrap: { width: ca.width - 180 },
    }));

    // Max reputation
    win.add(this.add.text(cx + 12, projectCardY + projectCardH - 22, `Base Reputation: ${project.maxReputation}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#3fb950',
    }));

    // ── RESOURCES ────────────────────────────────────────────────────────────
    const resY = projectCardY + projectCardH + 20;

    win.add(this.add.text(cx, resY, '📊 RESOURCES', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const isCorp = state.playerClass === 'corporateDev';
    const budgetLabel = isCorp
      ? '💳 Company Card'
      : `💰 $${state.budget.toLocaleString()}`;

    const resourceLine = [
      budgetLabel,
      `🖥️ ${state.hardwareHp}%`,
      `⭐ ${state.reputation}`,
      `📡 ${modelLabel(state.model)}`,
    ].join('     ');

    win.add(this.add.text(cx, resY + 22, resourceLine, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    }));

    // ── AI NEWS TICKER ───────────────────────────────────────────────────────
    const tickerY = resY + 65;

    win.add(this.add.text(cx, tickerY, '📰 AI NEWS TICKER', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    // Ticker band
    const bandY = tickerY + 22;
    const bandH = 28;
    const band = this.add.rectangle(cx, bandY, ca.width, bandH, 0x0d1117).setOrigin(0);
    win.add(band);

    // Mask so text scrolls inside the band
    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(WIN_X + cx, WIN_Y + bandY, ca.width, bandH);
    const mask = maskShape.createGeometryMask();

    const headlines = getHeadlinesForDay(state.day);
    const tickerLine = headlines.join('     ◆     ') + '     ◆     ';

    const tickerText = this.add.text(
      WIN_X + cx + ca.width, // start just off-screen right
      WIN_Y + bandY + 6,
      tickerLine,
      { fontFamily: 'monospace', fontSize: '13px', color: '#d29922' }
    );
    tickerText.setMask(mask);
    this.tickerTexts.push(tickerText);

    // Animate: scroll left across the full width
    const fullWidth = tickerText.width + ca.width;
    const durationMs = fullWidth * 10; // ~10ms per pixel ≈ comfortable read speed

    this.tweens.add({
      targets: tickerText,
      x: WIN_X + cx - tickerText.width,
      duration: durationMs,
      ease: 'Linear',
      repeat: -1,
      onRepeat: () => {
        tickerText.setX(WIN_X + cx + ca.width);
      },
    });

    // ── PLAN YOUR APPROACH BUTTON ─────────────────────────────────────────────
    const btnY = bandY + bandH + 28;
    const btnW = 260;
    const btnH = 40;
    const btnX = cx + (ca.width - btnW) / 2;

    const btnBg = this.add.rectangle(WIN_X + btnX, WIN_Y + btnY, btnW, btnH, theme.accent)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    const btnLabel = this.add.text(
      WIN_X + btnX + btnW / 2, WIN_Y + btnY + btnH / 2,
      'PLAN YOUR APPROACH  →',
      { fontFamily: 'monospace', fontSize: '14px', color: '#0f1117', fontStyle: 'bold' }
    ).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setAlpha(0.85);
    });
    btnBg.on('pointerout', () => {
      btnBg.setAlpha(1);
    });
    btnBg.on('pointerdown', () => {
      this.tweens.killAll();
      this.scene.start('Planning');
    });

    // Make sure button label is above bg
    btnLabel.setDepth(1);

    // ── RISK ASSESSMENT PANEL ────────────────────────────────────────────────
    const riskY = btnY + btnH + 30;

    win.add(this.add.text(cx, riskY, '── RISK ASSESSMENT ──', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    // Determine risk values from difficulty
    const diff = project.difficulty;
    const barFillPct = diff === 'easy' ? 0.33 : diff === 'medium' ? 0.66 : 1.0;
    const barColor = diff === 'easy' ? 0x3fb950 : diff === 'medium' ? 0xd29922 : 0xf85149;
    const riskLabel = diff === 'easy' ? 'Low Risk' : diff === 'medium' ? 'Moderate Risk' : 'High Risk';
    const riskLabelColor = diff === 'easy' ? '#3fb950' : diff === 'medium' ? '#d29922' : '#f85149';
    const riskTip = diff === 'easy'
      ? '💡 A good day to experiment with risky strategies.'
      : diff === 'medium'
      ? '💡 Balance speed and caution. Watch your budget.'
      : '💡 Consider Plan Then Build. Every time unit counts.';

    const barBarY = riskY + 22;
    const barTotalW = 240;
    const barH = 12;
    // Bar track (background)
    const barTrack = this.add.rectangle(cx, barBarY, barTotalW, barH, 0x21262d).setOrigin(0);
    win.add(barTrack);
    // Bar fill
    const barFillW = Math.round(barTotalW * barFillPct);
    if (barFillW > 0) {
      const barFill = this.add.rectangle(cx, barBarY, barFillW, barH, barColor).setOrigin(0);
      win.add(barFill);
    }
    // Risk label to the right of bar
    win.add(this.add.text(cx + barTotalW + 12, barBarY, riskLabel, {
      fontFamily: 'monospace', fontSize: '12px', color: riskLabelColor,
    }).setOrigin(0, 0));
    // Tip text
    win.add(this.add.text(cx, barBarY + barH + 8, riskTip, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0', fontStyle: 'italic',
    }));

    // ── AGENT RECOMMENDATION ─────────────────────────────────────────────────
    const agentRecY = riskY + 50;

    win.add(this.add.text(cx, agentRecY, '── RECOMMENDED AGENTS ──', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const agentNames = diff === 'easy'
      ? '🤖 Turbo  ·  🤖 Parrot'
      : '🤖 Oracle  ·  🤖 Linter';
    const agentTip = diff === 'easy'
      ? 'Speed matters more than caution.'
      : diff === 'medium'
      ? 'Reliability over speed today.'
      : 'You need bulletproof code.';

    win.add(this.add.text(cx, agentRecY + 20, agentNames, {
      fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3',
    }));
    win.add(this.add.text(cx, agentRecY + 38, agentTip, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0', fontStyle: 'italic',
    }));

    // ── EVENT FORECAST ───────────────────────────────────────────────────────
    const forecastY = agentRecY + 50;

    win.add(this.add.text(cx, forecastY, '── EVENT FORECAST ──', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const forecastLine = state.day <= 4
      ? '📡 Light chatter expected. Focus on building.'
      : state.day <= 9
      ? '📡 Increased activity. Expect interruptions.'
      : '📡 Heavy interference. Brace for chaos.';

    win.add(this.add.text(cx, forecastY + 20, forecastLine, {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0',
    }));
  }
}
