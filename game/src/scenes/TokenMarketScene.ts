import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { SHOP_ITEMS } from '../data/items';
import type { ItemDef } from '../data/items';
import { ShopSystem } from '../systems/ShopSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { getState } from '../systems/GameState';

type TabCategory = 'model' | 'hardware' | 'agentSlot' | 'consumable' | 'joke';

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

  constructor() {
    super({ key: 'TokenMarket' });
  }

  create(): void {
    const state = getState();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.taskbar = new Taskbar(this);

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

    // Initial item list
    this.renderItems();
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
        color: isActive ? '#e6edf3' : '#8b949e',
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
        if (category !== this.activeTab) text.setColor('#8b949e');
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
    this.tabObjects.forEach(({ category: cat, text, underline }) => {
      const active = cat === category;
      text.setColor(active ? '#e6edf3' : '#8b949e');
      underline.setVisible(active);
    });
    this.renderItems();
  }

  private renderItems(): void {
    // Destroy previous list
    this.itemListObjects.forEach(o => (o as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy());
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
    const listStartY = cy + 48; // below tabs
    const rowHeight = 54;
    const colNameX = cx;
    const colPriceX = cx + 360;
    const colDescX = cx;
    const colBtnX = cx + 760;

    filtered.forEach((item, i) => {
      const ry = listStartY + i * rowHeight;
      const price = prices.get(item.id) ?? item.baseCost;
      const isDeal = item.id === dealId;
      const canBuyResult = ShopSystem.canBuy(state, item, isDeal ? Math.round(price / 2) : price);
      const isOwned = !canBuyResult.ok && canBuyResult.reason !== 'Insufficient funds';

      // Row separator
      const sep = this.add.rectangle(cx, ry - 4, 860, 1, 0x21262d).setOrigin(0, 0);
      this.marketWin.add(sep);
      this.itemListObjects.push(sep);

      // Emoji + Name
      const emoji = categoryEmoji(item.category);
      const nameText = this.add.text(colNameX, ry + 4, `${emoji} ${item.name}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e6edf3',
      });
      this.marketWin.add(nameText);
      this.itemListObjects.push(nameText);

      // Description (dim, below name)
      const descText = this.add.text(colDescX, ry + 22, item.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8b949e',
      });
      this.marketWin.add(descText);
      this.itemListObjects.push(descText);

      // Price display
      if (isDeal) {
        // Strikethrough original price
        const origStr = `$${price}`;
        const strikeText = this.add.text(colPriceX, ry + 4, origStr, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#6e7681',
        });
        this.marketWin.add(strikeText);
        this.itemListObjects.push(strikeText);
        // Strikethrough line
        const strikeLine = this.add.rectangle(
          colPriceX, strikeText.y + strikeText.height / 2,
          strikeText.width, 1,
          0x6e7681
        ).setOrigin(0, 0.5);
        this.marketWin.add(strikeLine);
        this.itemListObjects.push(strikeLine);

        const halfPrice = Math.round(price / 2);
        const dealText = this.add.text(colPriceX + strikeText.width + 8, ry + 4, `$${halfPrice} 🏷️`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#d29922',
        });
        this.marketWin.add(dealText);
        this.itemListObjects.push(dealText);
      } else {
        const priceText = this.add.text(colPriceX, ry + 4, `$${price}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#c9d1d9',
        });
        this.marketWin.add(priceText);
        this.itemListObjects.push(priceText);
      }

      // BUY button or OWNED label
      if (isOwned) {
        const ownedLabel = this.add.text(colBtnX, ry + 10, '✓ OWNED', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#3fb950',
        }).setOrigin(0, 0.5);
        this.marketWin.add(ownedLabel);
        this.itemListObjects.push(ownedLabel);
      } else {
        const actualPrice = isDeal ? Math.round(price / 2) : price;
        const canAfford = state.budget >= actualPrice;
        const buyLabel = `[ BUY $${actualPrice} ]`;
        const buyBtn = this.add.text(colBtnX, ry + 10, buyLabel, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: canAfford ? '#e6edf3' : '#6e7681',
          backgroundColor: canAfford ? '#238636' : '#21262d',
          padding: { x: 8, y: 5 },
        }).setOrigin(0, 0.5);

        if (canAfford) {
          buyBtn.setInteractive({ useHandCursor: true });
          buyBtn.on('pointerover', () => buyBtn.setBackgroundColor('#2ea043'));
          buyBtn.on('pointerout', () => buyBtn.setBackgroundColor('#238636'));
          buyBtn.on('pointerdown', () => this.handleBuy(item, actualPrice));
        }
        this.marketWin.add(buyBtn);
        this.itemListObjects.push(buyBtn);
      }
    });

    if (filtered.length === 0) {
      const emptyText = this.add.text(cx, listStartY + 20, 'No items available yet.', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8b949e',
      });
      this.marketWin.add(emptyText);
      this.itemListObjects.push(emptyText);
    }
  }

  private handleBuy(item: ItemDef, price: number): void {
    const state = getState();
    const result = ShopSystem.buyItem(state, item, price);

    if (!result.success) return;

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
