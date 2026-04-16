import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { DEV_CONFIG } from '../utils/devConfig';
import { Telemetry } from '../systems/Telemetry';
import { getState, resetState } from '../systems/GameState';
import { SHOP_ITEMS } from '../data/items';
import AudioManager from '../systems/AudioManager';
import { AudioSettingsPanel } from './AudioSettingsPanel';

const TASKBAR_HEIGHT = 32;
const PANEL_W = 260;
const BTN_H = 28;
const PAD = 10;

/** A single clickable row button inside the DebugMenu. */
function makeButton(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  label: string,
  x: number,
  y: number,
  color: string,
  onClick: (textObj: Phaser.GameObjects.Text) => void,
): Phaser.GameObjects.Text {
  const bg = scene.add
    .rectangle(x, y, PANEL_W - PAD * 2, BTN_H, 0x21262d)
    .setOrigin(0)
    .setInteractive({ useHandCursor: true });

  const txt = scene.add.text(x + 8, y + 7, label, {
    fontFamily: 'monospace',
    fontSize: '12px',
    color,
  });

  bg.on('pointerover', () => bg.setFillStyle(0x30363d));
  bg.on('pointerout', () => bg.setFillStyle(0x21262d));
  bg.on('pointerdown', () => onClick(txt));

  container.add([bg, txt]);
  return txt;
}

/**
 * DebugMenu — PromptOS system/debug panel.
 *
 * Depth 999. Anchored above the taskbar (bottom-left).
 * Click outside → dismiss.
 */
export class DebugMenu extends Phaser.GameObjects.Container {
  private skipDay: number;
  private skipPending: boolean;
  private taskbarRef: { refresh: () => void } | null;

  constructor(
    scene: Phaser.Scene,
    taskbarRef?: { refresh: () => void } | null,
  ) {
    super(scene, 0, 0);
    this.skipDay = getState().day;
    this.skipPending = false;
    this.taskbarRef = taskbarRef ?? null;

    this.setDepth(999);
    scene.add.existing(this);

    this._build();
  }

  private _build(): void {
    const scene = this.scene;
    const hasDebug = DEV_CONFIG.debugMenu === true;

    // Row count: 1 sound + 1 reboot + (hasDebug ? separator + 8 debug buttons : 0)
    const debugRows = hasDebug ? 11 : 0; // separator counts as a row // separator counts as a row
    const rows = 3 + debugRows; // sound + audio settings + reboot + debug rows
    const panelH = PAD + rows * (BTN_H + 4) + PAD;

    const panelX = 8;
    const panelY = GAME_HEIGHT - TASKBAR_HEIGHT - panelH - 4;

    // ── Dismiss overlay (full-screen transparent, behind panel) ──
    const overlay = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setOrigin(0)
      .setInteractive();
    overlay.on('pointerdown', () => this.dismiss());
    this.add(overlay);

    // ── Panel background ──
    const panel = scene.add
      .rectangle(panelX, panelY, PANEL_W, panelH, 0x0d1117)
      .setOrigin(0)
      .setStrokeStyle(1, 0x30363d);
    // Stop clicks on panel from bubbling to overlay
    panel.setInteractive();
    panel.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
    });
    this.add(panel);

    const innerX = panelX + PAD;
    let curY = panelY + PAD;

    // ── Sound toggle ──
    const muteLabel = () => AudioManager.getInstance().isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    const muteColor = () => AudioManager.getInstance().isMuted ? '#f85149' : '#e6edf3';
    makeButton(scene, this, muteLabel(), innerX, curY, muteColor(), (txt) => {
      AudioManager.getInstance().toggleMute();
      txt.setText(muteLabel());
      txt.setColor(muteColor());
    });
    curY += BTN_H + 4;

    // ── Audio Settings ──
    makeButton(scene, this, '🎛 Audio Settings', innerX, curY, '#e6edf3', () => {
      this.dismiss();
      new AudioSettingsPanel(scene);
    });
    curY += BTN_H + 4;

    // ── Reboot button ──
    makeButton(scene, this, '🔄 Reboot', innerX, curY, '#e6edf3', () => {
      resetState();
      scene.scene.start('Title');
    });
    curY += BTN_H + 4;

    if (!hasDebug) return;

    // ── Separator ──
    const sep = scene.add.text(innerX + 8, curY + 8, '── debug ──', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#484f58',
    });
    this.add(sep);
    curY += BTN_H + 4;

    // ── Skip to Day ──
    const skipLabel = () => `[ Skip to Day ${this.skipDay}${this.skipPending ? ' ✓' : ''} ]`;
    makeButton(scene, this, skipLabel(), innerX, curY, '#9da5b0', (txt) => {
      if (!this.skipPending) {
        // First click: increment day
        this.skipDay = this.skipDay >= 14 ? 1 : this.skipDay + 1;
        txt.setText(skipLabel());
        this.skipPending = true;
      } else {
        // Second click: confirm
        const s = getState();
        s.day = this.skipDay;
        scene.scene.start('Briefing');
      }
    });
    curY += BTN_H + 4;

    // ── +$500 ──
    makeButton(scene, this, '[ +$500 ]', innerX, curY, '#9da5b0', () => {
      getState().budget += 500;
      this.taskbarRef?.refresh();
    });
    curY += BTN_H + 4;

    // ── +50 Rep ──
    makeButton(scene, this, '[ +50 Rep ]', innerX, curY, '#9da5b0', () => {
      getState().reputation += 50;
      this.taskbarRef?.refresh();
    });
    curY += BTN_H + 4;

    // ── Unlock All Models ──
    makeButton(scene, this, '[ Unlock All Models ]', innerX, curY, '#9da5b0', () => {
      const s = getState();
      s.unlockedModels = ['free', 'standard', 'frontier', 'local', 'sketchy', 'openSource'];
    });
    curY += BTN_H + 4;

    // ── Unlock All Items ──
    makeButton(scene, this, '[ Unlock All Items ]', innerX, curY, '#9da5b0', () => {
      const s = getState();
      const hwIds = SHOP_ITEMS
        .filter(i => i.category === 'hardware')
        .map(i => i.id);
      hwIds.forEach(id => {
        if (!s.ownedUpgrades.includes(id)) s.ownedUpgrades.push(id);
      });
      s.agentSlots = 3;
    });
    curY += BTN_H + 4;

    // ── Bug Bounty ──
    makeButton(scene, this, '[ → Bug Bounty ]', innerX, curY, '#9da5b0', () => {
      scene.scene.start('BugBountySelect');
    });
    curY += BTN_H + 4;

    // ── Token Market ──
    makeButton(scene, this, '[ → Token Market ]', innerX, curY, '#9da5b0', () => {
      scene.scene.start('Night');
    });
    curY += BTN_H + 4;

    // ── Final Scene ──
    makeButton(scene, this, '[ → Final Scene ]', innerX, curY, '#9da5b0', () => {
      scene.scene.start('Final');
    });
    curY += BTN_H + 4;

    // ── God Mode toggle ──
    const godLabel = () =>
      window.__GOD_MODE ? '[ God Mode: ON ]' : '[ God Mode: OFF ]';
    const godColor = () =>
      window.__GOD_MODE ? '#3fb950' : '#9da5b0';

    makeButton(scene, this, godLabel(), innerX, curY, godColor(), (txt) => {
      window.__GOD_MODE = !window.__GOD_MODE;
      txt.setText(godLabel());
      txt.setColor(godColor());
    });
    curY += BTN_H + 4;

    // ── Export Telemetry ──
    makeButton(scene, this, '[ 📊 Export Telemetry ]', innerX, curY, '#9da5b0', (txt) => {
      const result = Telemetry.downloadJson();
      if (result === null) {
        const orig = txt.text;
        txt.setText('No data').setColor('#f85149');
        scene.time.delayedCall(1500, () => {
          txt.setText(orig).setColor('#9da5b0');
        });
      }
    });
  }

  dismiss(): void {
    this.destroy();
  }
}
