import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import AudioManager from '../systems/AudioManager';

const PANEL_W = 280;
const PANEL_H = 260;
const SLIDER_W = 160;
const SLIDER_H = 8;
const HANDLE_R = 8;
const PAD = 16;
const ROW_H = 40;

interface SliderDef {
  label: string;
  get: () => number;
  set: (v: number) => void;
}

/**
 * PromptOS Audio Settings — modal panel with per-channel volume sliders + mute toggle.
 * Rendered as Phaser GameObjects, dismissed on click outside.
 */
export class AudioSettingsPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.setDepth(1000);
    scene.add.existing(this);
    this._build();
  }

  private _build(): void {
    const scene = this.scene;
    const audio = AudioManager.getInstance();

    // ── Dismiss overlay ──
    const overlay = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.3)
      .setOrigin(0)
      .setInteractive();
    overlay.on('pointerdown', () => this.dismiss());
    this.add(overlay);

    // ── Panel ──
    const px = (GAME_WIDTH - PANEL_W) / 2;
    const py = (GAME_HEIGHT - PANEL_H) / 2;

    const panel = scene.add
      .rectangle(px, py, PANEL_W, PANEL_H, 0x0d1117)
      .setOrigin(0)
      .setStrokeStyle(1, 0x30363d);
    panel.setInteractive();
    panel.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
    });
    this.add(panel);

    // ── Title ──
    const title = scene.add.text(px + PAD, py + 12, '🔊 Audio Settings', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
    });
    this.add(title);

    // ── Sliders ──
    const sliders: SliderDef[] = [
      { label: 'Master', get: () => audio.masterVolume, set: (v) => audio.setMasterVolume(v) },
      { label: 'Music',  get: () => audio.musicVolume,  set: (v) => audio.setMusicVolume(v) },
      { label: 'SFX',    get: () => audio.sfxVolume,    set: (v) => audio.setSFXVolume(v) },
      { label: 'Voice',  get: () => audio.voiceVolume,  set: (v) => audio.setVoiceVolume(v) },
    ];

    let curY = py + 40;
    for (const def of sliders) {
      this._makeSlider(scene, px + PAD, curY, def);
      curY += ROW_H;
    }

    // ── Mute toggle ──
    curY += 4;
    const muteLabel = () => audio.isMuted ? '🔇 Muted' : '🔊 Unmuted';
    const muteColor = () => audio.isMuted ? '#f85149' : '#3fb950';

    const muteBg = scene.add
      .rectangle(px + PAD, curY, PANEL_W - PAD * 2, 28, 0x21262d)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    const muteTxt = scene.add.text(px + PAD + 8, curY + 7, muteLabel(), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: muteColor(),
    });

    muteBg.on('pointerover', () => muteBg.setFillStyle(0x30363d));
    muteBg.on('pointerout', () => muteBg.setFillStyle(0x21262d));
    muteBg.on('pointerdown', () => {
      audio.toggleMute();
      muteTxt.setText(muteLabel());
      muteTxt.setColor(muteColor());
    });
    this.add([muteBg, muteTxt]);
  }

  private _makeSlider(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: SliderDef,
  ): void {
    const labelX = x;
    const sliderX = x + 80;
    const pctX = sliderX + SLIDER_W + 12;

    // Label
    const label = scene.add.text(labelX, y + 4, def.label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9da5b0',
    });

    // Track
    const trackBg = scene.add
      .rectangle(sliderX, y + ROW_H / 2, SLIDER_W, SLIDER_H, 0x21262d)
      .setOrigin(0, 0.5);

    const trackFill = scene.add
      .rectangle(sliderX, y + ROW_H / 2, SLIDER_W * def.get(), SLIDER_H, 0x58a6ff)
      .setOrigin(0, 0.5);

    // Handle
    const handleX = sliderX + SLIDER_W * def.get();
    const handle = scene.add
      .circle(handleX, y + ROW_H / 2, HANDLE_R, 0xe6edf3)
      .setInteractive({ useHandCursor: true, draggable: true });

    // Percentage text
    const pctText = scene.add.text(pctX, y + 4, `${Math.round(def.get() * 100)}%`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#9da5b0',
    });

    // Drag logic
    scene.input.setDraggable(handle);
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX, sliderX + SLIDER_W);
      const ratio = (clamped - sliderX) / SLIDER_W;
      handle.setX(clamped);
      trackFill.setDisplaySize(SLIDER_W * ratio, SLIDER_H);
      def.set(ratio);
      pctText.setText(`${Math.round(ratio * 100)}%`);
    });

    // Click track to jump
    const hitZone = scene.add
      .rectangle(sliderX, y, SLIDER_W, ROW_H, 0x000000, 0)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const ratio = Phaser.Math.Clamp((pointer.x - sliderX) / SLIDER_W, 0, 1);
      handle.setX(sliderX + SLIDER_W * ratio);
      trackFill.setDisplaySize(SLIDER_W * ratio, SLIDER_H);
      def.set(ratio);
      pctText.setText(`${Math.round(ratio * 100)}%`);
    });

    this.add([label, trackBg, trackFill, hitZone, handle, pctText]);
  }

  dismiss(): void {
    this.destroy();
  }
}
