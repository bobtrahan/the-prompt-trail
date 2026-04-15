import Phaser from 'phaser';
import { COLORS } from '../utils/constants';

export interface WindowConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  titleIcon?: string;       // emoji or short text before title
  accentColor?: number;
  draggable?: boolean;
  closeable?: boolean;
  onClose?: () => void;
}

/**
 * PromptOS Window — a fake OS window frame.
 * Title bar + border + content area. Everything is rectangles.
 */
export class Window {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  contentArea: { x: number; y: number; width: number; height: number };

  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private titleBar: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private closeBtn?: Phaser.GameObjects.Text;

  readonly TITLE_BAR_HEIGHT = 28;
  readonly BORDER_WIDTH = 1;
  readonly PADDING = 8;

  constructor(config: WindowConfig) {
    this.scene = config.scene;
    const accent = config.accentColor ?? COLORS.accent;

    this.container = config.scene.add.container(config.x, config.y);

    // Border (slightly larger rect behind everything)
    this.border = config.scene.add.rectangle(0, 0, config.width, config.height, COLORS.windowBorder)
      .setOrigin(0);
    this.container.add(this.border);

    // Background
    this.bg = config.scene.add.rectangle(
      this.BORDER_WIDTH, this.BORDER_WIDTH,
      config.width - this.BORDER_WIDTH * 2, config.height - this.BORDER_WIDTH * 2,
      COLORS.windowBg
    ).setOrigin(0);
    this.container.add(this.bg);

    // Title bar
    this.titleBar = config.scene.add.rectangle(
      this.BORDER_WIDTH, this.BORDER_WIDTH,
      config.width - this.BORDER_WIDTH * 2, this.TITLE_BAR_HEIGHT,
      COLORS.titleBar
    ).setOrigin(0);
    this.container.add(this.titleBar);

    // Accent strip under title bar
    const strip = config.scene.add.rectangle(
      this.BORDER_WIDTH, this.BORDER_WIDTH + this.TITLE_BAR_HEIGHT,
      config.width - this.BORDER_WIDTH * 2, 2,
      accent
    ).setOrigin(0);
    this.container.add(strip);

    // Title text
    const icon = config.titleIcon ? config.titleIcon + ' ' : '';
    this.titleText = config.scene.add.text(
      this.BORDER_WIDTH + 10, this.BORDER_WIDTH + 6,
      icon + config.title,
      { fontFamily: 'monospace', fontSize: '13px', color: '#e6edf3' }
    );
    this.container.add(this.titleText);

    // Close button
    if (config.closeable) {
      this.closeBtn = config.scene.add.text(
        config.width - this.BORDER_WIDTH - 24, this.BORDER_WIDTH + 5,
        '✕',
        { fontFamily: 'monospace', fontSize: '14px', color: '#9da5b0' }
      ).setInteractive({ useHandCursor: true });
      this.closeBtn.on('pointerover', () => this.closeBtn?.setColor('#f85149'));
      this.closeBtn.on('pointerout', () => this.closeBtn?.setColor('#9da5b0'));
      this.closeBtn.on('pointerdown', () => config.onClose?.());
      this.container.add(this.closeBtn);
    }

    // Window dots (decorative, macOS-style upper-left)
    const dotY = this.BORDER_WIDTH + this.TITLE_BAR_HEIGHT / 2;
    const dotColors = [0xf85149, 0xd29922, 0x3fb950];
    if (!config.closeable) {
      dotColors.forEach((c, i) => {
        const dot = config.scene.add.circle(config.width - 44 + i * 14, dotY, 4, c);
        this.container.add(dot);
      });
    }

    // Content area bounds (for children to use)
    this.contentArea = {
      x: this.BORDER_WIDTH + this.PADDING,
      y: this.BORDER_WIDTH + this.TITLE_BAR_HEIGHT + 2 + this.PADDING,
      width: config.width - this.BORDER_WIDTH * 2 - this.PADDING * 2,
      height: config.height - this.BORDER_WIDTH * 2 - this.TITLE_BAR_HEIGHT - 2 - this.PADDING * 2,
    };
  }

  /** Add a Phaser game object into this window's container */
  add(obj: Phaser.GameObjects.GameObject): void {
    this.container.add(obj);
  }

  setDepth(d: number): void {
    this.container.setDepth(d);
  }

  destroy(): void {
    this.container.destroy();
  }
}
