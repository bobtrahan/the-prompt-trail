import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/constants';
import { getState } from '../systems/GameState';
import { Window } from '../ui/Window';
import { Taskbar } from '../ui/Taskbar';
import { PROJECTS } from '../data/projects';

export class NightScene extends Phaser.Scene {
  private taskbar!: Taskbar;

  constructor() {
    super({ key: 'Night' });
  }

  create(): void {
    const state = getState();
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Fade in from results
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Setup Taskbar
    this.taskbar = new Taskbar(this);

    // Create Main Night Window
    const winWidth = 600;
    const winHeight = 400;
    const nightWin = new Window({
      scene: this,
      x: (GAME_WIDTH - winWidth) / 2,
      y: (GAME_HEIGHT - winHeight) / 2 - 20,
      width: winWidth,
      height: winHeight,
      title: `Night ── Day ${state.day} Complete`,
      titleIcon: '🌙',
    });

    const { x: cx, y: cy, width: cw } = nightWin.contentArea;

    // Body text
    this.add.text(cx, cy + 10, 'The office is quiet. Your agents are sleeping.', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e6edf3',
    });
    this.add.text(cx, cy + 35, '(Your hardware hums in the dark.)', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8b949e',
      fontStyle: 'italic',
    });

    // Tomorrow Preview Section
    this.add.text(cx, cy + 85, '── TOMORROW ──', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#58a6ff',
    });

    const nextProject = PROJECTS[state.day]; // state.day is 1-indexed, PROJECTS is 0-indexed. Day 1 complete -> PROJECTS[1] is Day 2.
    if (nextProject) {
      this.add.text(cx, cy + 110, `Day ${state.day + 1}: ${nextProject.name}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e6edf3',
      });

      const stars = this.getDifficultyStars(nextProject.difficulty);
      this.add.text(cx, cy + 135, `Difficulty: ${stars}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#8b949e',
      });
    } else {
      this.add.text(cx, cy + 110, `The Final Stretch...`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e6edf3',
      });
    }

    // Phase 3 Placeholders (Market / Bounty)
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e6edf3',
      backgroundColor: '#30363d',
      padding: { x: 12, y: 8 },
    };

    const marketBtn = this.add.text(cx, cy + 200, '[ Token Market ]', btnStyle)
      .setAlpha(0.4)
      .setInteractive({ useHandCursor: false });
    this.add.text(cx + 160, cy + 208, '(Coming Soon — Phase 3)', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8b949e',
    });

    const bountyBtn = this.add.text(cx, cy + 250, '[ Bug Bounty ]', btnStyle)
      .setAlpha(0.4)
      .setInteractive({ useHandCursor: false });
    this.add.text(cx + 160, cy + 258, '(Coming Soon — Phase 3)', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#8b949e',
    });

    // Advance Button
    const sleepBtn = this.add.text(cx, cy + 320, '[ Sleep → Morning Briefing ]', {
      ...btnStyle,
      backgroundColor: '#238636',
    }).setInteractive({ useHandCursor: true });

    sleepBtn.on('pointerover', () => sleepBtn.setBackgroundColor('#2ea043'));
    sleepBtn.on('pointerout', () => sleepBtn.setBackgroundColor('#238636'));
    sleepBtn.on('pointerdown', () => this.advance());

    // Add everything to container via Window.add (not strictly necessary but keeps it tidy)
    // Actually Window.ts doesn't have a generic add for everything, let's just use the scene.
    // The Window's container is already in the scene.
  }

  private getDifficultyStars(diff: string): string {
    switch (diff) {
      case 'easy': return '★☆☆';
      case 'medium': return '★★☆';
      case 'hard': return '★★★';
      default: return '☆☆☆';
    }
  }

  private advance(): void {
    const state = getState();
    state.day++;
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Briefing');
    });
  }
}
