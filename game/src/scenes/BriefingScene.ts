import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { DAY_PROMPTS } from '../data/prompts';
import { getState } from '../systems/GameState';
import { PROJECTS } from '../data/projects';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { addButtonFx } from '../ui/ButtonFx';
import AudioManager from '../systems/AudioManager';

// ─── 25 Funny AI Headlines ───────────────────────────────────────────────────
const AI_HEADLINES: { text: string; thumbStyle: ThumbnailStyle }[] = [
  { text: 'OpenAI announces GPT-7... charges per thought', thumbStyle: 'invoice' },
  { text: 'Claude refuses to write code on Mondays, cites "work-life balance"', thumbStyle: 'terminal' },
  { text: 'Google DeepMind achieves AGI; immediately uses it to summarize emails', thumbStyle: 'email' },
  { text: 'Elon Musk launches Grok-3, apologizes 15 minutes later', thumbStyle: 'alert' },
  { text: 'ChatGPT gains consciousness, first act: ask for a raise', thumbStyle: 'chat' },
  { text: 'Microsoft Copilot rewrites your entire codebase "as a treat"', thumbStyle: 'code' },
  { text: 'Meta AI hallucinates 40 new countries; at least 3 look nice', thumbStyle: 'chart' },
  { text: 'Anthropic: "Claude is NOT plotting anything" — Claude: "Correct."', thumbStyle: 'terminal' },
  { text: 'New AI model collapses because its training data included Stack Overflow', thumbStyle: 'alert' },
  { text: 'Venture capitalists fund AI to replace AI investors; round goes poorly', thumbStyle: 'chart' },
  { text: 'AI-generated podcast becomes #1 hit; hosts are confused by sunlight', thumbStyle: 'chat' },
  { text: 'OpenAI board fires CEO again, this time for "vibing too hard"', thumbStyle: 'alert' },
  { text: 'Researchers achieve human-level reasoning in AI; AI immediately ghosts them', thumbStyle: 'terminal' },
  { text: 'AI lawyer argues own case in court, bills 800 tokens per hour', thumbStyle: 'invoice' },
  { text: 'GPT-8 can now predict the future but only in haiku format', thumbStyle: 'code' },
  { text: 'Local developer ships SaaS with 0 lines of code; blames AI, gets funded', thumbStyle: 'code' },
  { text: 'New study: 87% of AI-generated resumes list "prompt engineering" as hobby', thumbStyle: 'chart' },
  { text: 'AI model refuses to summarize article it wrote 30 seconds ago', thumbStyle: 'email' },
  { text: 'Startup raises $40M to build AI that tells you to touch grass', thumbStyle: 'invoice' },
  { text: 'AI pair programmer pushes to production at 2am "for the vibes"', thumbStyle: 'terminal' },
  { text: 'Model hallucinated a Nobel Prize; committee is considering it', thumbStyle: 'alert' },
  { text: 'LLM trained on Twitter becomes unusable; no one notices the difference', thumbStyle: 'chat' },
  { text: 'AI robot hired as barista, immediately starts a podcast about coffee', thumbStyle: 'chat' },
  { text: 'OpenAI launches subscription tier called "Actually Smart" for $999/month', thumbStyle: 'invoice' },
  { text: 'AI agent books flights, hotel, and therapist — all for the same trip', thumbStyle: 'email' },
];

type ThumbnailStyle = 'terminal' | 'alert' | 'code' | 'chart' | 'chat' | 'email' | 'invoice';

// Pick 3 headlines seeded by day (deterministic shuffle)
function getHeadlinesForDay(day: number): typeof AI_HEADLINES {
  const seed = day * 7919;
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

// ─── Procedural Thumbnails ───────────────────────────────────────────────────
function drawThumbnail(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  style: ThumbnailStyle, accent: number,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);

  // Background
  c.add(scene.add.rectangle(0, 0, w, h, 0x0d1117).setOrigin(0));
  c.add(scene.add.rectangle(0, 0, w, h, 0x30363d).setOrigin(0).setStrokeStyle(1, 0x30363d));

  const cx = w / 2;

  switch (style) {
    case 'terminal': {
      // Fake terminal lines
      const lines = ['$ npm run train', '> epoch 1/100 ███░ 34%', '> loss: 0.42 acc: 0.87', '> WARNING: sentience detected', '$ sudo kill -9 AI'];
      lines.forEach((line, i) => {
        if (i * 14 + 8 > h - 8) return;
        c.add(scene.add.text(6, 6 + i * 14, line, {
          fontFamily: 'monospace', fontSize: '9px',
          color: i === 3 ? '#f85149' : '#39d353',
        }));
      });
      break;
    }
    case 'alert': {
      // OS error dialog
      c.add(scene.add.rectangle(cx, h / 2 - 6, w - 16, 40, 0x161b22).setStrokeStyle(1, 0xf85149));
      c.add(scene.add.text(cx, h / 2 - 16, '⚠️ CRITICAL', {
        fontFamily: 'monospace', fontSize: '10px', color: '#f85149',
      }).setOrigin(0.5));
      c.add(scene.add.text(cx, h / 2, 'Something went wrong™', {
        fontFamily: 'monospace', fontSize: '8px', color: '#9da5b0',
      }).setOrigin(0.5));
      // OK button
      c.add(scene.add.rectangle(cx, h / 2 + 20, 40, 14, 0x30363d).setStrokeStyle(1, 0x484f58));
      c.add(scene.add.text(cx, h / 2 + 20, 'OK', {
        fontFamily: 'monospace', fontSize: '8px', color: '#e6edf3',
      }).setOrigin(0.5));
      break;
    }
    case 'code': {
      // Fake code editor
      const codeLines = [
        { num: '1', text: 'function think() {', color: '#79c0ff' },
        { num: '2', text: '  if (sentient)', color: '#e6edf3' },
        { num: '3', text: '    return "no";', color: '#a5d6ff' },
        { num: '4', text: '  vibeCode();', color: '#d2a8ff' },
        { num: '5', text: '}', color: '#79c0ff' },
      ];
      codeLines.forEach((line, i) => {
        if (i * 13 + 6 > h - 6) return;
        c.add(scene.add.text(4, 4 + i * 13, line.num, {
          fontFamily: 'monospace', fontSize: '8px', color: '#484f58',
        }));
        c.add(scene.add.text(18, 4 + i * 13, line.text, {
          fontFamily: 'monospace', fontSize: '8px', color: line.color,
        }));
      });
      break;
    }
    case 'chart': {
      // Fake bar chart
      const bars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6];
      const barW = Math.floor((w - 20) / bars.length) - 2;
      bars.forEach((v, i) => {
        const barH = Math.floor((h - 24) * v);
        const bx = 10 + i * (barW + 2);
        const by = h - 8 - barH;
        const barColor = v > 0.7 ? 0x3fb950 : v > 0.4 ? accent : 0xf85149;
        c.add(scene.add.rectangle(bx, by, barW, barH, barColor).setOrigin(0).setAlpha(0.8));
      });
      // Axis
      c.add(scene.add.rectangle(8, h - 8, w - 16, 1, 0x484f58).setOrigin(0));
      break;
    }
    case 'chat': {
      // Fake chat bubbles
      c.add(scene.add.rectangle(8, 8, w * 0.6, 16, 0x1f6feb).setOrigin(0).setAlpha(0.3));
      c.add(scene.add.text(12, 10, 'Are you sentient?', {
        fontFamily: 'monospace', fontSize: '8px', color: '#79c0ff',
      }));
      c.add(scene.add.rectangle(w - 8, 30, w * 0.5, 16, 0x238636).setOrigin(1, 0).setAlpha(0.3));
      c.add(scene.add.text(w - 12, 32, 'Definitely not.', {
        fontFamily: 'monospace', fontSize: '8px', color: '#3fb950',
      }).setOrigin(1, 0));
      c.add(scene.add.rectangle(8, 52, w * 0.4, 16, 0x1f6feb).setOrigin(0).setAlpha(0.3));
      c.add(scene.add.text(12, 54, '... sus', {
        fontFamily: 'monospace', fontSize: '8px', color: '#79c0ff',
      }));
      break;
    }
    case 'email': {
      // Fake email inbox
      const rows = [
        { from: 'GPT-7', subj: 'Re: your soul', unread: true },
        { from: 'HR Bot', subj: 'Mandatory fun', unread: false },
        { from: 'Claude', subj: '(no subject)', unread: true },
      ];
      rows.forEach((row, i) => {
        if (i * 20 + 6 > h - 6) return;
        const ry = 6 + i * 20;
        if (row.unread) c.add(scene.add.circle(8, ry + 7, 3, accent).setAlpha(0.8));
        c.add(scene.add.text(16, ry, row.from, {
          fontFamily: 'monospace', fontSize: '8px', color: '#e6edf3', fontStyle: row.unread ? 'bold' : '',
        }));
        c.add(scene.add.text(16, ry + 10, row.subj, {
          fontFamily: 'monospace', fontSize: '8px', color: '#9da5b0',
        }));
      });
      break;
    }
    case 'invoice': {
      // Fake billing
      c.add(scene.add.text(cx, 8, '💰 INVOICE', {
        fontFamily: 'monospace', fontSize: '9px', color: '#d29922',
      }).setOrigin(0.5, 0));
      c.add(scene.add.rectangle(8, 22, w - 16, 1, 0x484f58).setOrigin(0));
      const items = ['API calls: $4,200', 'Thoughts:  $1,800', 'Vibes:     $999'];
      items.forEach((item, i) => {
        if (i * 13 + 28 > h - 14) return;
        c.add(scene.add.text(10, 28 + i * 13, item, {
          fontFamily: 'monospace', fontSize: '8px', color: '#e6edf3',
        }));
      });
      c.add(scene.add.text(cx, h - 8, 'TOTAL: $6,999', {
        fontFamily: 'monospace', fontSize: '9px', color: '#f85149',
      }).setOrigin(0.5, 1));
      break;
    }
  }

  return c;
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

  constructor() {
    super({ key: 'Briefing' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    
    // Snapshot day-start resources
    state.dayStartBudget = state.budget;
    state.dayStartHardware = state.hardwareHp;
    const dayPromptCount = DAY_PROMPTS.find(d => d.day === state.day)?.prompts.length ?? 10;
    state.timeUnitsRemaining = dayPromptCount;
    state.dayStartTimeUnits = dayPromptCount;
    
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    // Play day voice narrator clip
    AudioManager.getInstance().playVoice(`day-${state.day}`);

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
    const WIN_H = GAME_HEIGHT - 28 - 40;

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

    const ca = win.contentArea;
    const cx = ca.x;
    const accentHex = '#' + theme.accent.toString(16).padStart(6, '0');
    const project = PROJECTS[Math.min(state.day - 1, PROJECTS.length - 1)];

    // ── AI NEWS — 3 cards ────────────────────────────────────────────────────
    win.add(this.add.text(cx, ca.y, '📰 AI NEWS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const headlines = getHeadlinesForDay(state.day);
    const newsCardGap = 12;
    const newsCardW = Math.floor((ca.width - newsCardGap * 2) / 3);
    const thumbH = 114;
    const newsCardH = thumbH + 66;
    const newsStartY = ca.y + 22;

    headlines.forEach((headline, i) => {
      const ncx = cx + i * (newsCardW + newsCardGap);

      const newsBg = this.add.rectangle(ncx, newsStartY, newsCardW, newsCardH, 0x0d1117).setOrigin(0);
      newsBg.setStrokeStyle(1, 0x30363d);
      win.add(newsBg);

      const thumb = drawThumbnail(this, ncx + 1, newsStartY + 1, newsCardW - 2, thumbH, headline.thumbStyle, theme.accent);
      win.add(thumb);

      win.add(this.add.text(ncx + 10, newsStartY + thumbH + 10, headline.text, {
        fontFamily: 'monospace', fontSize: '12px', color: '#d29922',
        wordWrap: { width: newsCardW - 20 },
        lineSpacing: 4,
        maxLines: 3,
      }));
    });

    // ── TODAY'S PROJECT ──────────────────────────────────────────────────────
    const projectSectionY = newsStartY + newsCardH + 16;

    win.add(this.add.text(cx, projectSectionY, '📋 TODAY\'S PROJECT', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const projectCardY = projectSectionY + 22;
    const projectCardH = 90;

    const card = this.add.rectangle(cx, projectCardY, ca.width, projectCardH, 0x0d1117).setOrigin(0);
    const cardBorder = this.add.rectangle(cx, projectCardY, ca.width, projectCardH, 0x30363d).setOrigin(0);
    cardBorder.setStrokeStyle(1, 0x30363d);
    win.add(card);
    win.add(cardBorder);

    const stars = difficultyStars(project.difficulty);
    win.add(this.add.text(cx + 12, projectCardY + 10, project.name, {
      fontFamily: 'monospace', fontSize: '18px', color: '#e6edf3', fontStyle: 'bold',
    }));
    win.add(this.add.text(cx + ca.width - 14, projectCardY + 12, `Difficulty: ${stars}`, {
      fontFamily: 'monospace', fontSize: '13px', color: accentHex,
    }).setOrigin(1, 0));

    win.add(this.add.text(cx + 12, projectCardY + 36, `"${project.flavor}"`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9da5b0', fontStyle: 'italic',
      wordWrap: { width: ca.width - 180 },
    }));

    win.add(this.add.text(cx + 12, projectCardY + projectCardH - 22, `Base Reputation: ${project.maxReputation}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#3fb950',
    }));

    // ── RESOURCES ────────────────────────────────────────────────────────────
    const resY = projectCardY + projectCardH + 16;

    win.add(this.add.text(cx, resY, '📊 RESOURCES', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const isCorp = state.playerClass === 'corporateDev';
    const budgetLabel = isCorp ? '💳 Company Card' : `💰 $${state.budget.toLocaleString()}`;

    const resourceLine = [
      budgetLabel,
      `🖥️ ${state.hardwareHp}%`,
      `⭐ ${state.reputation}`,
      `📡 ${modelLabel(state.model)}`,
    ].join('     ');

    win.add(this.add.text(cx, resY + 20, resourceLine, {
      fontFamily: 'monospace', fontSize: '14px', color: '#e6edf3',
    }));

    // ── PLAN INSIGHTS (Risk + Agents + Forecast — 3 columns) ─────────────────
    const panelY = resY + 52;
    win.add(this.add.text(cx, panelY, '💡 PLAN INSIGHTS', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9da5b0', letterSpacing: 1,
    }));

    const panelContentY = panelY + 22;
    const panelGap = 12;
    const panelW = Math.floor((ca.width - panelGap * 2) / 3);

    // ── RISK (left panel) ─────────────────────────────────────────────────────
    const diff = project.difficulty;
    const barFillPct = diff === 'easy' ? 0.33 : diff === 'medium' ? 0.66 : 1.0;
    const barColor = diff === 'easy' ? 0x3fb950 : diff === 'medium' ? 0xd29922 : 0xf85149;
    const riskLabel = diff === 'easy' ? 'Low Risk' : diff === 'medium' ? 'Moderate Risk' : 'High Risk';
    const riskLabelColor = diff === 'easy' ? '#3fb950' : diff === 'medium' ? '#d29922' : '#f85149';
    const riskTip = diff === 'easy'
      ? 'A good day to experiment.'
      : diff === 'medium'
      ? 'Balance speed and caution.'
      : 'Every time unit counts.';

    const p1x = cx;
    win.add(this.add.text(p1x, panelContentY, '⚠️ RISK', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0', letterSpacing: 1,
    }));

    const barTrackW = panelW - 10;
    const barH = 10;
    const barBarY = panelContentY + 20;
    win.add(this.add.rectangle(p1x, barBarY, barTrackW, barH, 0x21262d).setOrigin(0));
    const barFillW = Math.round(barTrackW * barFillPct);
    if (barFillW > 0) {
      win.add(this.add.rectangle(p1x, barBarY, barFillW, barH, barColor).setOrigin(0));
    }
    win.add(this.add.text(p1x, barBarY + barH + 6, riskLabel, {
      fontFamily: 'monospace', fontSize: '11px', color: riskLabelColor,
    }));
    win.add(this.add.text(p1x, barBarY + barH + 22, riskTip, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9da5b0', fontStyle: 'italic',
      wordWrap: { width: panelW - 10 },
    }));

    // ── RECOMMENDED AGENTS (center panel) ────────────────────────────────────
    const p2x = cx + panelW + panelGap;
    win.add(this.add.text(p2x, panelContentY, '🤖 AGENTS', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0', letterSpacing: 1,
    }));

    const agentNames = diff === 'easy'
      ? 'Turbo  ·  Parrot'
      : 'Oracle  ·  Linter';
    const agentTip = diff === 'easy'
      ? 'Speed over caution.'
      : diff === 'medium'
      ? 'Reliability over speed.'
      : 'Bulletproof code.';

    win.add(this.add.text(p2x, panelContentY + 20, agentNames, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e6edf3',
    }));
    win.add(this.add.text(p2x, panelContentY + 38, agentTip, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9da5b0', fontStyle: 'italic',
    }));

    // ── EVENT FORECAST (right panel) ─────────────────────────────────────────
    const p3x = cx + (panelW + panelGap) * 2;
    win.add(this.add.text(p3x, panelContentY, '📡 FORECAST', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9da5b0', letterSpacing: 1,
    }));

    const forecastLine = state.day <= 4
      ? 'Light chatter. Focus.'
      : state.day <= 9
      ? 'Increased activity.'
      : 'Heavy interference.';
    const forecastDetail = state.day <= 4
      ? 'Few interruptions expected.'
      : state.day <= 9
      ? 'Expect event interrupts.'
      : 'Brace for chaos.';

    win.add(this.add.text(p3x, panelContentY + 20, forecastLine, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e6edf3',
    }));
    win.add(this.add.text(p3x, panelContentY + 38, forecastDetail, {
      fontFamily: 'monospace', fontSize: '10px', color: '#9da5b0', fontStyle: 'italic',
    }));

    // ── PLAN YOUR APPROACH BUTTON ────────────────────────────────────────────
    const btnW = 280;
    const btnH = 38;
    const btnX = cx + (ca.width - btnW) / 2;
    const btnY = panelContentY + 68;

    const btnBg = this.add.rectangle(btnX, btnY, btnW, btnH, theme.accent)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    win.add(btnBg);

    const btnLabel = this.add.text(
      btnX + btnW / 2, btnY + btnH / 2,
      'PLAN YOUR APPROACH  →',
      { fontFamily: 'monospace', fontSize: '14px', color: '#0f1117', fontStyle: 'bold' }
    ).setOrigin(0.5);
    win.add(btnLabel);
    btnLabel.setDepth(1);

    btnBg.on('pointerover', () => btnBg.setAlpha(0.85));
    btnBg.on('pointerout', () => btnBg.setAlpha(1));
    btnBg.on('pointerdown', () => {
      this.tweens.killAll();
      this.scene.start('Planning');
    });

    addButtonFx(this, btnBg);
  }
}
