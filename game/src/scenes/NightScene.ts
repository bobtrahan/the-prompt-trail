import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';

// ── Procedural thumbnail drawings ────────────────────────────

function drawBugBountyThumb(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, accent: number,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  c.add(scene.add.rectangle(0, 0, w, h, 0x0d1117).setOrigin(0));
  c.add(scene.add.rectangle(0, 0, w, h, 0x30363d).setOrigin(0).setStrokeStyle(1, 0x30363d));

  // Grid of code lines with "bugs"
  const lines = [
    { text: 'for (let i=0;', color: '#79c0ff' },
    { text: '  if (bug) 🪲', color: '#f85149' },
    { text: '  deploy();', color: '#e6edf3' },
    { text: '  // TODO: fix', color: '#484f58' },
    { text: '  catch 🪲 🪲', color: '#f85149' },
  ];
  lines.forEach((line, i) => {
    if (i * 14 + 8 > h - 8) return;
    c.add(scene.add.text(6, 6 + i * 14, line.text, {
      fontFamily: 'monospace', fontSize: '9px', color: line.color,
    }));
  });

  // Crosshair overlay
  const cx = w * 0.65;
  const cy = h * 0.5;
  const r = 12;
  c.add(scene.add.circle(cx, cy, r).setStrokeStyle(1, accent).setFillStyle(accent, 0.05));
  c.add(scene.add.rectangle(cx, cy, 1, r * 2 + 6, accent).setAlpha(0.6));
  c.add(scene.add.rectangle(cx, cy, r * 2 + 6, 1, accent).setAlpha(0.6));

  return c;
}

function drawTokenMarketThumb(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, accent: number,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  c.add(scene.add.rectangle(0, 0, w, h, 0x0d1117).setOrigin(0));
  c.add(scene.add.rectangle(0, 0, w, h, 0x30363d).setOrigin(0).setStrokeStyle(1, 0x30363d));

  // Shop shelf items
  const items = [
    { emoji: '🔧', label: 'GPU', price: '$200' },
    { emoji: '☕', label: 'Coffee', price: '$50' },
    { emoji: '🛡️', label: 'Backup', price: '$150' },
  ];
  items.forEach((item, i) => {
    const ix = 8 + i * Math.floor((w - 16) / 3);
    const iy = 8;
    // Item card
    c.add(scene.add.rectangle(ix, iy, Math.floor((w - 24) / 3), h - 16, 0x161b22)
      .setOrigin(0).setStrokeStyle(1, 0x30363d));
    c.add(scene.add.text(ix + Math.floor((w - 24) / 6), iy + 10, item.emoji, {
      fontSize: '18px',
    }).setOrigin(0.5));
    c.add(scene.add.text(ix + Math.floor((w - 24) / 6), iy + 34, item.label, {
      fontFamily: 'monospace', fontSize: '8px', color: '#e6edf3',
    }).setOrigin(0.5));
    c.add(scene.add.text(ix + Math.floor((w - 24) / 6), iy + 46, item.price, {
      fontFamily: 'monospace', fontSize: '8px', color: `#${accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));
  });

  return c;
}

// ── Scene ────────────────────────────────────────────────────

export class NightScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private led!: Phaser.GameObjects.Rectangle;
  private ledTween!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'Night' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);

    // Ambient elements (depth -5)
    this.add.rectangle(100, 200, 200, 140, theme.accent, 0.015).setDepth(-5);
    this.add.rectangle(980, 240, 180, 120, theme.accent, 0.01).setDepth(-5);

    this.led = this.add.rectangle(120, 500, 4, 4, 0x3fb950).setAlpha(0.6).setDepth(-5);
    this.ledTween = this.tweens.add({
      targets: this.led,
      alpha: 0.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, `System idle  ·  3 processes sleeping  ·  Hardware: ${state.hardwareHp}%`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#30363d',
    }).setOrigin(0.5).setDepth(-5);

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.taskbar = new Taskbar(this, theme.accent);

    // ── Main Night Window ──
    const winWidth = 600;
    const winHeight = 380;
    const nightWin = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: `Night ── Day ${state.day} Complete`,
      titleIcon: '🌙',
      accentColor: theme.accent,
    });

    nightWin.container.setAlpha(0);
    nightWin.container.y += 10;
    this.tweens.add({
      targets: nightWin.container,
      alpha: 1,
      y: nightWin.container.y - 10,
      duration: 400,
      delay: 300,
      ease: 'Power2.easeOut',
    });

    const { x: cx, y: cy } = nightWin.contentArea;
    const accentHex = `#${theme.accent.toString(16).padStart(6, '0')}`;

    // Flavor text
    nightWin.add(this.add.text(cx, cy + 8, 'The office is quiet. Your agents are sleeping.', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#e6edf3',
    }));
    nightWin.add(this.add.text(cx, cy + 30, '(Your hardware hums in the dark.)', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#9da5b0',
      fontStyle: 'italic',
    }));

    // ── Side-by-side cards ──
    const CARD_W = 250;
    const CARD_H = 200;
    const CARD_GAP = 20;
    const cardsStartX = cx + 15;
    const cardsY = cy + 60;
    const bountyAlreadyPlayed = state.bountyPlayedTonight;

    // Bug Bounty card
    this._buildCard(nightWin, {
      x: cardsStartX,
      y: cardsY,
      w: CARD_W,
      h: CARD_H,
      accent: theme.accent,
      accentHex,
      emoji: '🪲',
      title: 'Bug Bounty',
      subtitle: 'Hunt bugs, earn tokens',
      disabled: bountyAlreadyPlayed,
      disabledText: 'Already played tonight',
      drawThumb: (tx, ty, tw, th) => drawBugBountyThumb(this, tx, ty, tw, th, theme.accent),
      voiceId: 'night-bugbounty',
      onClick: () => {
        state.bugHuntReturnScene = 'Night';
        this.scene.start('BugBountySelect');
      },
    });

    // Token Market card
    this._buildCard(nightWin, {
      x: cardsStartX + CARD_W + CARD_GAP,
      y: cardsY,
      w: CARD_W,
      h: CARD_H,
      accent: theme.accent,
      accentHex,
      emoji: '🪙',
      title: 'Token Market',
      subtitle: 'Upgrade your setup',
      disabled: false,
      drawThumb: (tx, ty, tw, th) => drawTokenMarketThumb(this, tx, ty, tw, th, theme.accent),
      voiceId: 'night-tokenmarket',
      onClick: () => {
        this.scene.start('TokenMarket');
      },
    });

    // ── Sleep button ──
    const sleepBtn = this.add.text(
      cx + (CARD_W * 2 + CARD_GAP + 30) / 2,
      cardsY + CARD_H + 20,
      '[ Sleep → Morning Briefing ]',
      {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e6edf3',
        backgroundColor: '#238636',
        padding: { x: 16, y: 8 },
      },
    ).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    nightWin.add(sleepBtn);

    sleepBtn.on('pointerover', () => sleepBtn.setBackgroundColor('#2ea043'));
    sleepBtn.on('pointerout', () => sleepBtn.setBackgroundColor('#238636'));
    sleepBtn.on('pointerdown', () => this.advance());
  }

  private _buildCard(
    win: Window,
    opts: {
      x: number; y: number; w: number; h: number;
      accent: number; accentHex: string;
      emoji: string; title: string; subtitle: string;
      disabled: boolean; disabledText?: string;
      voiceId?: string;
      drawThumb: (x: number, y: number, w: number, h: number) => Phaser.GameObjects.Container;
      onClick: () => void;
    },
  ): void {
    const { x, y, w, h, accent, accentHex, emoji, title, subtitle, disabled } = opts;
    const THUMB_H = 80;

    // Card background
    const cardBg = this.add.rectangle(x, y, w, h, 0x161b22)
      .setOrigin(0)
      .setStrokeStyle(1, 0x30363d);
    win.add(cardBg);

    // Glow
    const glow = this.add.rectangle(x - 2, y - 2, w + 4, h + 4, accent)
      .setOrigin(0)
      .setAlpha(0);
    win.add(glow);
    // Re-add card on top of glow
    win.add(cardBg);

    // Thumbnail
    const thumb = opts.drawThumb(x + 1, y + 1, w - 2, THUMB_H);
    win.add(thumb);

    // Emoji + title
    win.add(this.add.text(x + 12, y + THUMB_H + 10, `${emoji}  ${title}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e6edf3',
      fontStyle: 'bold',
    }));

    // Subtitle
    win.add(this.add.text(x + 12, y + THUMB_H + 34, subtitle, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9da5b0',
    }));

    if (disabled) {
      // Dimmed overlay
      const dimmer = this.add.rectangle(x, y, w, h, 0x0d1117, 0.92).setOrigin(0);
      win.add(dimmer);
      if (opts.disabledText) {
        win.add(this.add.text(x + w / 2, y + h / 2, `🪲  ${opts.disabledText}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#6e7681',
        }).setOrigin(0.5));
      }
      return;
    }

    // Interactive hit zone
    const hitZone = this.add.rectangle(x, y, w, h, 0x000000, 0)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    win.add(hitZone);

    // CTA
    const cta = this.add.text(x + 12, y + h - 24, '[ Click to open ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#484f58',
    });
    win.add(cta);

    hitZone.on('pointerover', () => {
      cardBg.setStrokeStyle(2, accent);
      glow.setAlpha(0.08);
      cta.setColor(accentHex);
    });
    hitZone.on('pointerout', () => {
      cardBg.setStrokeStyle(1, 0x30363d);
      glow.setAlpha(0);
      cta.setColor('#484f58');
    });
    hitZone.on('pointerdown', () => opts.onClick());

    // Info button — plays narrator clip without navigating
    if (opts.voiceId) {
      const infoBtn = this.add.text(x + w - 24, y + 6, '?', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#0d1117',
        backgroundColor: '#9da5b0',
        padding: { x: 5, y: 1 },
      }).setInteractive({ useHandCursor: true }).setDepth(10);

      const voiceId = opts.voiceId;
      infoBtn.on('pointerover', () => infoBtn.setBackgroundColor(accentHex));
      infoBtn.on('pointerout', () => infoBtn.setBackgroundColor('#9da5b0'));
      infoBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        AudioManager.getInstance().playVoice(voiceId);
      });
      win.add(infoBtn);
    }
  }

  private advance(): void {
    const state = getState();
    state.bountyPlayedTonight = false;
    state.day++;

    state.hasBackupProtection = false;
    state.hasDuckProtection = false;
    state.modelCostDiscount = 0;
    state.consumablesUsedToday = [];

    if (this.ledTween) this.ledTween.stop();
    this.led.setAlpha(1);
    this.time.delayedCall(200, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Briefing');
    });
  }
}
