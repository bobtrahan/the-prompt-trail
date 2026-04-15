import Phaser from 'phaser';

const STORAGE_KEY = 'prompttrail_audio';

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const MUSIC_KEYS = ['title', 'execution', 'execution-late', 'night', 'bugbounty'] as const;
const SFX_KEYS = [
  'key-correct', 'key-wrong', 'notification', 'error', 'critical',
  'choice-select', 'ui-click', 'bug-squash', 'bug-miss', 'purchase',
  'day-complete', 'rep-gain', 'rep-loss', 'hw-damage', 'boot', 'score-tick',
] as const;

class AudioManager {
  private static instance: AudioManager | null = null;

  private game: Phaser.Game | null = null;
  private currentMusicKey: string | null = null;
  // Stored as the concrete union so setVolume() is available without re-casting.
  // Phaser's sound.add() returns BaseSound, so we narrow at the assignment site.
  private currentMusic: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | null = null;

  private _masterVolume = 1;
  private _musicVolume = 0.7;
  private _sfxVolume = 0.8;
  isMuted = false;

  // Public getters for telemetry
  get musicVolume(): number {
    return this._musicVolume;
  }

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  get currentTrack(): string | null {
    return this.currentMusicKey;
  }

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /** Call once from BootScene create to bind the global game reference. */
  init(game: Phaser.Game): void {
    this.game = game;
  }

  static preload(scene: Phaser.Scene): void {
    for (const key of MUSIC_KEYS) {
      scene.load.audio(key, `assets/audio/music/${key}.mp3`);
    }
    for (const key of SFX_KEYS) {
      scene.load.audio(key, `assets/audio/sfx/${key}.mp3`);
    }
  }

  // ── Music ────────────────────────────────────────────────────

  playMusic(key: string, fadeMs = 500): void {
    if (!this.game) return;
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return;

    const sm = this.game.sound;
    // Phaser API limitation: sound.add() returns BaseSound, but the runtime instance
    // is always either WebAudioSound or HTML5AudioSound depending on the chosen
    // sound manager. We narrow once here so downstream code can call setVolume().
    const incoming = sm.add(key, {
      loop: true,
      volume: 0,
    }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

    incoming.play();

    const targetVol = this.isMuted ? 0 : this._masterVolume * this._musicVolume;

    // Fade in incoming over fadeMs
    const scene = this.game.scene.scenes.find(s => s.scene.isActive());
    if (scene) {
      scene.tweens.add({
        targets: incoming,
        volume: targetVol,
        duration: fadeMs,
        ease: 'Linear',
      });
    } else {
      incoming.setVolume(targetVol);
    }

    // Fade out + stop outgoing
    if (this.currentMusic) {
      const outgoing = this.currentMusic;
      if (scene) {
        scene.tweens.add({
          targets: outgoing,
          volume: 0,
          duration: fadeMs,
          ease: 'Linear',
          onComplete: () => {
            outgoing.stop();
            outgoing.destroy();
          },
        });
      } else {
        outgoing.stop();
        outgoing.destroy();
      }
    }

    this.currentMusic = incoming;
    this.currentMusicKey = key;
  }

  stopMusic(fadeMs = 500): void {
    if (!this.game || !this.currentMusic) return;
    const outgoing = this.currentMusic;
    const scene = this.game.scene.scenes.find(s => s.scene.isActive());
    if (scene) {
      scene.tweens.add({
        targets: outgoing,
        volume: 0,
        duration: fadeMs,
        ease: 'Linear',
        onComplete: () => {
          outgoing.stop();
          outgoing.destroy();
        },
      });
    } else {
      outgoing.stop();
      outgoing.destroy();
    }
    this.currentMusic = null;
    this.currentMusicKey = null;
  }

  // ── SFX ─────────────────────────────────────────────────────

  playSFX(key: string, rateVariation = 0.05): void {
    if (!this.game) return;
    if (this.isMuted) return;
    const rate = 1.0 + (Math.random() * 2 - 1) * rateVariation;
    const vol = this._masterVolume * this._sfxVolume;
    this.game.sound.play(key, { volume: vol, rate });
  }

  // ── Volume ───────────────────────────────────────────────────

  setMasterVolume(v: number): void {
    this._masterVolume = Math.max(0, Math.min(1, v));
    this.applyMusicVolume();
    this.saveSettings();
  }

  setMusicVolume(v: number): void {
    this._musicVolume = Math.max(0, Math.min(1, v));
    this.applyMusicVolume();
    this.saveSettings();
  }

  setSFXVolume(v: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    this.saveSettings();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.applyMusicVolume();
    this.saveSettings();
  }

  // ── Internals ────────────────────────────────────────────────

  private applyMusicVolume(): void {
    if (!this.currentMusic) return;
    const vol = this.isMuted ? 0 : this._masterVolume * this._musicVolume;
    this.currentMusic.setVolume(vol);
  }

  private saveSettings(): void {
    const settings: AudioSettings = {
      masterVolume: this._masterVolume,
      musicVolume: this._musicVolume,
      sfxVolume: this._sfxVolume,
      muted: this.isMuted,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage not available
    }
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const settings: AudioSettings = JSON.parse(raw);
      if (typeof settings.masterVolume === 'number') this._masterVolume = settings.masterVolume;
      if (typeof settings.musicVolume === 'number') this._musicVolume = settings.musicVolume;
      if (typeof settings.sfxVolume === 'number') this._sfxVolume = settings.sfxVolume;
      if (typeof settings.muted === 'boolean') this.isMuted = settings.muted;
    } catch {
      // ignore parse errors
    }
  }
}

export default AudioManager;
