import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { drawWallpaper } from '../ui/DesktopWallpaper';
import { addButtonFx } from '../ui/ButtonFx';
import AudioManager from '../systems/AudioManager';

interface ModeOption {
  key: 'ai' | 'oldschool';
  title: string;
  icon: string;
  subtitle: string;
  difficulty: string;
  note?: string;
  targetScene: string;
}

const WIN_W = 980;
const WIN_H = 470;
const CARD_W = 350;
const CARD_H = 250;
const CARD_GAP = 36;

const MODE_OPTIONS: ModeOption[] = [
  {
    key: 'ai',
    title: 'Use AI',
    icon: '🤖',
    subtitle: 'Let the machines handle it. Click to squash.',
    difficulty: '★☆☆',
    targetScene: 'BugBounty',
  },
  {
    key: 'oldschool',
    title: 'Old School',
    icon: '🏹',
    subtitle: 'Hunt bugs the way God intended. Turn + Enter to walk, Space to fire.',
    difficulty: '★★★',
    note: '1.5× earnings',
    targetScene: 'BugHunt',
  },
];

export class BugBountySelectScene extends Phaser.Scene {
  private taskbar!: Taskbar;

  constructor() {
    super({ key: 'BugBountySelect' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    const returnScene = state.bugHuntReturnScene || 'Night';

    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    this.taskbar = new Taskbar(this, theme.accent);

    const winX = (GAME_WIDTH - WIN_W) / 2;
    const winY = (GAME_HEIGHT - WIN_H) / 2 - 12;
    const win = new Window({
      scene: this,
      x: winX,
      y: winY,
      width: WIN_W,
      height: WIN_H,
      title: 'Bug Bounty ── Mode Select',
      titleIcon: '🐛',
      accentColor: theme.accent,
    });

    const { x: cx, y: cy, width: cw, height: ch } = win.contentArea;
    const cardTop = cy + Math.floor((ch - CARD_H) / 2) + 10;
    const groupWidth = CARD_W * 2 + CARD_GAP;
    const startX = cx + Math.floor((cw - groupWidth) / 2);

    const prompt = this.add.text(cx + cw / 2, cy + 18, 'Select your preferred bug-squashing workflow.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e6edf3',
    }).setOrigin(0.5, 0);
    win.add(prompt);

    const footer = this.add.text(cx + cw / 2, cy + ch - 18, `Return after round: ${returnScene}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9da5b0',
    }).setOrigin(0.5, 1);
    win.add(footer);

    MODE_OPTIONS.forEach((option, index) => {
      const cardX = startX + index * (CARD_W + CARD_GAP);
      this.buildModeCard(win, cardX, cardTop, option, theme.accent, returnScene);
    });
  }

  private buildModeCard(
    win: Window,
    x: number,
    y: number,
    option: ModeOption,
    accent: number,
    returnScene: string
  ): void {
    const glow = this.add.rectangle(x + CARD_W / 2, y + CARD_H / 2, CARD_W + 12, CARD_H + 12, accent, 0.08)
      .setAlpha(0);
    win.add(glow);

    const card = this.add.rectangle(x, y, CARD_W, CARD_H, 0x11161d)
      .setOrigin(0)
      .setStrokeStyle(1, COLORS.windowBorder)
      .setInteractive({ useHandCursor: true });
    win.add(card);
    addButtonFx(this, card);

    const topBand = this.add.rectangle(x, y, CARD_W, 58, accent, 0.08).setOrigin(0);
    win.add(topBand);

    const icon = this.add.text(x + 24, y + 20, option.icon, {
      fontSize: '28px',
    });
    win.add(icon);

    const title = this.add.text(x + 70, y + 18, option.title, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e6edf3',
      fontStyle: 'bold',
    });
    win.add(title);

    const subtitle = this.add.text(x + 24, y + 76, option.subtitle, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9da5b0',
      wordWrap: { width: CARD_W - 48 },
    });
    win.add(subtitle);

    const difficulty = this.add.text(x + 24, y + 152, `Difficulty: ${option.difficulty}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${accent.toString(16).padStart(6, '0')}`,
    });
    win.add(difficulty);

    if (option.note) {
      const note = this.add.text(x + 24, y + 182, option.note, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#3fb950',
      });
      win.add(note);
    }

    const cta = this.add.text(x + 24, y + CARD_H - 34, '[ Click to launch ]', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#9da5b0',
    });
    win.add(cta);

    card.on('pointerover', () => {
      card.setStrokeStyle(2, accent);
      glow.setAlpha(1);
      cta.setColor(`#${accent.toString(16).padStart(6, '0')}`);
    });

    card.on('pointerout', () => {
      card.setStrokeStyle(1, COLORS.windowBorder);
      glow.setAlpha(0);
      cta.setColor('#9da5b0');
    });

    card.on('pointerdown', () => {
      const state = getState();
      state.bugHuntMode = option.key;
      state.bugHuntReturnScene = returnScene;
      const voiceId = option.key === 'oldschool' ? 'mode-oldschool' : 'mode-useai';
      AudioManager.getInstance().playVoice(voiceId);
      this.scene.start(option.targetScene);
    });
  }
}
