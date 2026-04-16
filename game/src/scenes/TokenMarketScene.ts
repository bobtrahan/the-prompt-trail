import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { SHOP_ITEMS } from '../data/items';
import type { ItemDef } from '../data/items';
import { ShopSystem } from '../systems/ShopSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { getState } from '../systems/GameState';
import { getTheme } from '../utils/themes';
import AudioManager from '../systems/AudioManager';
import { drawWallpaper } from '../ui/DesktopWallpaper';

type TabCategory = 'model' | 'hardware' | 'agentSlot' | 'consumable' | 'joke';

const ITEM_EFFECTS: Record<string, string> = {
  'model-standard': 'Base quality. No bonus or penalty to progress.',
  'model-frontier': '+15% progress quality. Premium daily cost.',
  'model-local': '+5% quality, no daily API cost. Requires hardware.',
  'model-open': '+8% quality, no daily cost. Community-maintained.',
  'model-sketchy': '-10% quality, dirt cheap. "It works on my machine."',
  'hw-monitor': '+5% typing speed. More screen real estate.',
  'hw-keyboard': 'Forgives 1 typo per prompt. Mechanical clicky.',
  'hw-ups': 'Immunity to power outage events.',
  'hw-cooling': 'Reduces hardware damage from overheating events.',
  'hw-ram': 'Reduces memory leak event frequency.',
  'agent-slot': 'Assign one more agent during Planning.',
  'con-coffee': '+5% speed for one day. Reliable and mild.',
  'con-energy': '+10% speed but 20% jitter chance. Risky.',
  'con-backup': 'Protects against data loss events for one day.',
  'con-api': 'Halves model daily cost for one day.',
  'con-duck': 'Auto-resolves one stuck/agent_stuck event.',
};

const TAB_DEFS: { label: string; category: TabCategory }[] = [
  { label: 'Models', category: 'model' },
  { label: 'Hardware', category: 'hardware' },
  { label: 'Agents', category: 'agentSlot' },
  { label: 'Consumables', category: 'consumable' },
  { label: 'Specials', category: 'joke' },
];

function categoryEmoji(category: ItemDef['category']): string {
  switch (category) {
    case 'model': return '🤖';
    case 'hardware': return '🔧';
    case 'agentSlot': return '🤝';
    case 'consumable': return '☕';
    case 'joke': return '❓';
    case 'repair': return '🛠️';
    default: return '•';
  }
}

export class TokenMarketScene extends Phaser.Scene {
  private taskbar!: Taskbar;
  private marketWin!: Window;
  private activeTab: TabCategory = 'model';
  private itemListObjects: Phaser.GameObjects.GameObject[] = [];
  private budgetLabel!: Phaser.GameObjects.Text;
  private tabObjects: { category: TabCategory; text: Phaser.GameObjects.Text; underline: Phaser.GameObjects.Rectangle }[] = [];
  private contentOrigin!: { x: number; y: number };
  private highlightRect!: Phaser.GameObjects.Rectangle;
  private detailBg!: Phaser.GameObjects.Rectangle;
  private detailBorderLine!: Phaser.GameObjects.Rectangle;
  private detailName!: Phaser.GameObjects.Text;
  private detailDesc!: Phaser.GameObjects.Text;
  private detailEffect!: Phaser.GameObjects.Text;
  private detailAfford!: Phaser.GameObjects.Text;
  private detailPaneY!: number;
  private scrollOffset = 0;
  private maxScroll = 0;
  private listMask!: Phaser.Display.Masks.GeometryMask;
  private listClipY = 0;
  private listClipH = 0;

  constructor() {
    super({ key: 'TokenMarket' });
  }

  create(): void {
    const state = getState();
    const theme = getTheme(state.playerClass ?? undefined);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    drawWallpaper(this, state.playerClass);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.taskbar = new Taskbar(this, theme.accent);

    const winW = 900;
    const winH = 520;
    const winX = (GAME_WIDTH - winW) / 2;
    const winY = (GAME_HEIGHT - winH) / 2;

    this.marketWin = new Window({
      scene: this,
      x: winX,
      y: winY,
      width: winW,
      height: winH,
      title: `Token Market \u2500\u2500 Day ${state.day}`,
      titleIcon: '🛒',
      accentColor: theme.accent,
    });

    const { x: cx, y: cy, width: cw, height: ch } = this.marketWin.contentArea;
    this.contentOrigin = { x: cx, y: cy };

    // Budget display — top right
    this.budgetLabel = this.add.text(cx + cw, cy + 2, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#3fb950',
    }).setOrigin(1, 0);
    this.marketWin.add(this.budgetLabel);
    this.refreshBudget();

    // Category tabs
    this.buildTabs(cx, cy, cw);

    // Back button
    const backBtn = this.add.text(cx, cy + ch - 4, '[ \u2190 Back ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
      backgroundColor: '#30363d',
      padding: { x: 10, y: 6 },
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#444c56'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#30363d'));
    backBtn.on('pointerdown', () => this.scene.start('Night'));
    this.marketWin.add(backBtn);

    // Detail pane (above back button)
    this.createDetailPane(cx, cy, cw, ch);

    // Initial item list
    this.renderItems();
  }

  private createDetailPane(cx: number, cy: number, cw: number, ch: number): void {
    const dpY = cy + ch - 136;
    const dpH = 100;
    this.detailPaneY = dpY;

    // Hover highlight (behind items, created first so it's below them)
    this.highlightRect = this.add.rectangle(cx - 4, 0, cw + 8, 50, 0x21262d)
      .setOrigin(0, 0).setAlpha(0);
    this.marketWin.add(this.highlightRect);

    // Top border line
    this.detailBorderLine = this.add.rectangle(cx - 4, dpY, cw + 8, 1, 0x30363d)
      .setOrigin(0, 0);
    this.marketWin.add(this.detailBorderLine);

    // Dark background
    this.detailBg = this.add.rectangle(cx - 4, dpY + 1, cw + 8, dpH - 1, 0x0d1117)
      .setOrigin(0, 0);
    this.marketWin.add(this.detailBg);

    // Default "hover" prompt
    this.detailName = this.add.text(cx + 4, dpY + 12, 'Hover over an item for details', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#9da5b0',
      fontStyle: 'bold',
    });
    this.marketWin.add(this.detailName);

    this.detailDesc = this.add.text(cx + 4, dpY + 38, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#9da5b0',
    });
    this.marketWin.add(this.detailDesc);

    this.detailEffect = this.add.text(cx + 4, dpY + 58, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#6e7681',
      fontStyle: 'italic',
    });
    this.marketWin.add(this.detailEffect);

    this.detailAfford = this.add.text(cx + cw - 4, dpY + 12, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f85149',
    }).setOrigin(1, 0);
    this.marketWin.add(this.detailAfford);
  }

  private updateDetailPane(item: ItemDef, canAfford: boolean, isOwned: boolean): void {
    this.detailName.setText(item.name).setColor('#e6edf3');
    this.detailDesc.setText(item.description);
    this.detailEffect.setText(ITEM_EFFECTS[item.id] ?? '');

    if (isOwned) {
      this.detailAfford.setText('✓ Already purchased').setColor('#3fb950');
    } else if (!canAfford) {
      this.detailAfford.setText('⚠️ Insufficient funds').setColor('#f85149');
    } else {
      this.detailAfford.setText('');
    }
  }

  private clearDetailPane(): void {
    this.detailName.setText('Hover over an item for details').setColor('#9da5b0');
    this.detailDesc.setText('');
    this.detailEffect.setText('');
    this.detailAfford.setText('');
    this.highlightRect.setAlpha(0);
  }

  private refreshBudget(): void {
    const state = getState();
    this.budgetLabel.setText(`Budget: $${state.budget.toLocaleString()}`);
  }

  private buildTabs(cx: number, cy: number, _cw: number): void {
    const tabY = cy + 22;
    let tabX = cx;
    this.tabObjects = [];

    TAB_DEFS.forEach(({ label, category }) => {
      const isActive = category === this.activeTab;
      const text = this.add.text(tabX, tabY, label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: isActive ? '#e6edf3' : '#9da5b0',
      }).setInteractive({ useHandCursor: true });

      const underline = this.add.rectangle(
        tabX, tabY + 18,
        text.width + 4, 2,
        COLORS.accent
      ).setOrigin(0, 0).setVisible(isActive);

      text.on('pointerover', () => {
        if (category !== this.activeTab) text.setColor('#c9d1d9');
      });
      text.on('pointerout', () => {
        if (category !== this.activeTab) text.setColor('#9da5b0');
      });
      text.on('pointerdown', () => this.selectTab(category));

      this.marketWin.add(text);
      this.marketWin.add(underline);
      this.tabObjects.push({ category, text, underline });
      tabX += text.width + 24;
    });
  }

  private selectTab(category: TabCategory): void {
    this.activeTab = category;
    this.scrollOffset = 0;
    this.tabObjects.forEach(({ category: cat, text, underline }) => {
      const active = cat === category;
      text.setColor(active ? '#e6edf3' : '#9da5b0');
      underline.setVisible(active);
    });
    this.renderItems();
  }

  private renderItems(): void {
    // Destroy previous list
    this.itemListObjects.forEach(o => o.destroy());
    this.itemListObjects = [];

    const state = getState();
    const prices = EconomySystem.getShopPrices(SHOP_ITEMS, state.day);
    const dealId = ShopSystem.getDealOfTheDay(SHOP_ITEMS, state.day);

    // Map joke category to 'joke' tab; repair items hide from all tabs (or show under specials)
    const categoryFilter: ItemDef['category'][] = this.activeTab === 'joke'
      ? ['joke', 'repair']
      : [this.activeTab];

    const filtered = SHOP_ITEMS.filter(item => {
      if (!categoryFilter.includes(item.category)) return false;
      if (item.availableAfterDay !== undefined && item.availableAfterDay > state.day) return false;
      return true;
    });

    const { x: cx, y: cy } = this.contentOrigin;
    const { width: cw } = this.marketWin.contentArea;
    const listStartY = cy + 48; // below tabs
    const rowHeight = 54;
    const listEndY = this.detailPaneY - 4;
    this.listClipY = listStartY;
    this.listClipH = listEndY - listStartY;

    // Calculate scroll bounds
    const totalListH = filtered.length * rowHeight;
    this.maxScroll = Math.max(0, totalListH - this.listClipH);
    this.scrollOffset = Math.min(this.scrollOffset, this.maxScroll);
    // Reset highlight when re-rendering
    if (this.highlightRect) this.highlightRect.setAlpha(0);
    const colNameX = cx;
    const colPriceX = cx + 360;
    const colDescX = cx;
    const colBtnX = cx + 760;

    // Geometry mask to clip items within list area
    const absListTop = this.marketWin.container.y + listStartY;
    const absListLeft = this.marketWin.container.x + cx - 8;
    const absListW = cw + 16;
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(absListLeft, absListTop, absListW, this.listClipH);
    this.listMask = maskGfx.createGeometryMask();

    // Helper to add item to list with mask
    const addListItem = (obj: Phaser.GameObjects.GameObject) => {
      this.marketWin.add(obj);
      this.itemListObjects.push(obj);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('setMask' in obj) (obj as any).setMask(this.listMask);
    };

    // Mouse wheel scrolling
    this.input.off('wheel');
    if (this.maxScroll > 0) {
      this.input.on('wheel', (_ptr: unknown, _gos: unknown, _dx: number, dy: number) => {
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy * 0.5, 0, this.maxScroll);
        this.renderItems();
      });
    }

    filtered.forEach((item, i) => {
      const ry = listStartY + i * rowHeight - this.scrollOffset;
      const price = prices.get(item.id) ?? item.baseCost;
      const isDeal = item.id === dealId;
      const canBuyResult = ShopSystem.canBuy(state, item, isDeal ? Math.round(price / 2) : price);
      const isOwned = !canBuyResult.ok && canBuyResult.reason !== 'Insufficient funds';

      // Row separator
      const sep = this.add.rectangle(cx, ry - 4, 860, 1, 0x21262d).setOrigin(0, 0);
      addListItem(sep);

      // Invisible hover hit area for the whole row
      const rowHit = this.add.rectangle(cx - 4, ry - 4, cw + 8, rowHeight, 0x000000, 0)
        .setOrigin(0, 0).setInteractive();
      rowHit.on('pointerover', () => {
        this.highlightRect.setY(ry - 4).setAlpha(0.5);
        this.updateDetailPane(item, canAfford, isOwned);
      });
      rowHit.on('pointerout', () => this.clearDetailPane());
      addListItem(rowHit);

      // Emoji + Name
      const emoji = categoryEmoji(item.category);
      const nameText = this.add.text(colNameX, ry + 4, `${emoji} ${item.name}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e6edf3',
      });
      addListItem(nameText);

      // Description (dim, below name)
      const descText = this.add.text(colDescX, ry + 22, item.description, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#9da5b0',
      });
      addListItem(descText);

      // Price display
      if (isDeal) {
        // Strikethrough original price
        const origStr = `$${price}`;
        const strikeText = this.add.text(colPriceX, ry + 4, origStr, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#6e7681',
        });
        addListItem(strikeText);
        // Strikethrough line
        const strikeLine = this.add.rectangle(
          colPriceX, strikeText.y + strikeText.height / 2,
          strikeText.width, 1,
          0x6e7681
        ).setOrigin(0, 0.5);
        addListItem(strikeLine);

        const halfPrice = Math.round(price / 2);
        const dealText = this.add.text(colPriceX + strikeText.width + 8, ry + 4, `$${halfPrice} 🏷️`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#d29922',
        });
        addListItem(dealText);
      } else {
        const canAffordPrice = state.budget >= price;
        const priceColor = canAffordPrice ? '#c9d1d9' : '#f85149';
        const priceText = this.add.text(colPriceX, ry + 4, `$${price}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: priceColor,
        });
        addListItem(priceText);
      }

      // BUY button or OWNED label
      const canAfford = !isOwned && state.budget >= (isDeal ? Math.round(price / 2) : price);
      if (isOwned) {
        const ownedLabel = this.add.text(colBtnX, ry + 10, '✓ OWNED', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#3fb950',
        }).setOrigin(0, 0.5);
        addListItem(ownedLabel);
      } else {
        const actualPrice = isDeal ? Math.round(price / 2) : price;
        const canAfford2 = state.budget >= actualPrice;
        const buyLabel = `[ BUY $${actualPrice} ]`;
        const buyBtn = this.add.text(colBtnX, ry + 10, buyLabel, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: canAfford2 ? '#e6edf3' : '#6e7681',
          backgroundColor: canAfford2 ? '#238636' : '#21262d',
          padding: { x: 8, y: 5 },
        }).setOrigin(0, 0.5);

        if (canAfford2) {
          buyBtn.setInteractive({ useHandCursor: true });
          buyBtn.on('pointerover', () => buyBtn.setBackgroundColor('#2ea043'));
          buyBtn.on('pointerout', () => buyBtn.setBackgroundColor('#238636'));
          buyBtn.on('pointerdown', () => this.handleBuy(item, actualPrice));
        }
        addListItem(buyBtn);
      }
    });

    if (filtered.length === 0) {
      const emptyText = this.add.text(cx, listStartY + 20, 'No items available yet.', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#9da5b0',
      });
      this.marketWin.add(emptyText);
      this.itemListObjects.push(emptyText);
    }
  }

  private handleBuy(item: ItemDef, price: number): void {
    const state = getState();
    const result = ShopSystem.buyItem(state, item, price);

    if (!result.success) return;

    AudioManager.getInstance().playSFX('purchase');

    this.refreshBudget();
    this.taskbar.refresh();

    if (item.category === 'joke') {
      this.showJokeModal(result.message);
    } else {
      this.showPurchasedFeedback();
      this.renderItems();
    }
  }

  private showPurchasedFeedback(): void {
    const { x: cx, y: cy, width: cw } = this.marketWin.contentArea;
    const flash = this.add.text(cx + cw / 2, cy + 10, 'Purchased!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#3fb950',
    }).setOrigin(0.5, 0).setDepth(200);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      y: flash.y - 20,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  private showJokeModal(message: string): void {
    const mw = 500;
    const mh = 160;
    const mx = (GAME_WIDTH - mw) / 2;
    const my = (GAME_HEIGHT - mh) / 2;

    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setOrigin(0).setDepth(300).setInteractive();
    const border = this.add.rectangle(mx - 1, my - 1, mw + 2, mh + 2, COLORS.windowBorder)
      .setOrigin(0).setDepth(300);
    const box = this.add.rectangle(mx, my, mw, mh, COLORS.windowBg)
      .setOrigin(0).setDepth(301);

    const msgText = this.add.text(mx + 16, my + 16, message, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#e6edf3',
      wordWrap: { width: mw - 32 },
    }).setDepth(302);

    const okBtn = this.add.text(mx + mw / 2, my + mh - 28, '[ OK ]', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#e6edf3',
      backgroundColor: '#30363d',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5, 0).setDepth(302).setInteractive({ useHandCursor: true });

    okBtn.on('pointerover', () => okBtn.setBackgroundColor('#444c56'));
    okBtn.on('pointerout', () => okBtn.setBackgroundColor('#30363d'));
    okBtn.on('pointerdown', () => {
      overlay.destroy(); box.destroy(); border.destroy();
      msgText.destroy(); okBtn.destroy();
      this.renderItems();
    });
  }
}
