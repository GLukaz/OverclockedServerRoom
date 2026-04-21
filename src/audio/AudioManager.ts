import * as Phaser from "phaser";
import { MusicKey, SfxKey } from "./sounds";

const STORAGE_KEY = "osr.audio.v1";

interface Settings {
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: Settings = {
  muted: false,
  musicVolume: 0.2,
  sfxVolume: 0.7,
};

const SFX_COOLDOWN_MS: Partial<Record<SfxKey, number>> = {
  sfx_zap: 150,
  sfx_jump: 80,
  sfx_vent: 60,
};

export class AudioManager {
  private static _instance: AudioManager | null = null;
  static get instance(): AudioManager {
    if (!AudioManager._instance) AudioManager._instance = new AudioManager();
    return AudioManager._instance;
  }

  private settings: Settings = { ...DEFAULT_SETTINGS };
  private scene: Phaser.Scene | null = null;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: MusicKey | null = null;
  private lastPlayed: Record<string, number> = {};

  private constructor() {
    this.loadSettings();
  }

  attach(scene: Phaser.Scene) {
    this.scene = scene;
    scene.sound.mute = this.settings.muted;
  }

  playSfx(key: SfxKey, volumeScale = 1) {
    if (!this.scene) return;
    if (!this.scene.cache.audio.exists(key)) return;

    const cooldown = SFX_COOLDOWN_MS[key];
    if (cooldown) {
      const now = this.scene.time.now;
      const last = this.lastPlayed[key] ?? -Infinity;
      if (now - last < cooldown) return;
      this.lastPlayed[key] = now;
    }

    this.scene.sound.play(key, {
      volume: this.settings.sfxVolume * volumeScale,
    });
  }

  playMusic(key: MusicKey, fadeMs = 500, loop = true) {
    if (!this.scene) return;
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return;
    if (!this.scene.cache.audio.exists(key)) return;

    const scene = this.scene;
    const old = this.currentMusic;
    this.currentMusic = null;
    this.currentMusicKey = null;

    if (old) this.fadeOutAndDestroy(scene, old, fadeMs);

    const music = scene.sound.add(key, { loop, volume: 0 });
    music.play();

    scene.tweens.add({
      targets: music,
      volume: this.settings.musicVolume,
      duration: fadeMs,
    });

    this.currentMusic = music;
    this.currentMusicKey = key;
  }

  stopMusic(fadeMs = 400) {
    const music = this.currentMusic;
    if (!music) return;
    const scene = this.scene;
    this.currentMusic = null;
    this.currentMusicKey = null;
    if (!scene) {
      music.stop();
      music.destroy();
      return;
    }
    this.fadeOutAndDestroy(scene, music, fadeMs);
  }

  toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    if (this.scene) this.scene.sound.mute = this.settings.muted;
    this.saveSettings();
    return this.settings.muted;
  }

  isMuted() {
    return this.settings.muted;
  }

  setMusicVolume(v: number) {
    this.settings.musicVolume = Phaser.Math.Clamp(v, 0, 1);
    const music = this.currentMusic as
      | (Phaser.Sound.BaseSound & { setVolume?: (v: number) => void; volume?: number })
      | null;
    if (music) {
      if (typeof music.setVolume === "function") music.setVolume(this.settings.musicVolume);
      else music.volume = this.settings.musicVolume;
    }
    this.saveSettings();
  }

  setSfxVolume(v: number) {
    this.settings.sfxVolume = Phaser.Math.Clamp(v, 0, 1);
    this.saveSettings();
  }

  getMusicVolume() {
    return this.settings.musicVolume;
  }
  getSfxVolume() {
    return this.settings.sfxVolume;
  }

  private fadeOutAndDestroy(
    scene: Phaser.Scene,
    music: Phaser.Sound.BaseSound,
    fadeMs: number,
  ) {
    if (fadeMs <= 0) {
      music.stop();
      music.destroy();
      return;
    }
    scene.tweens.add({
      targets: music,
      volume: 0,
      duration: fadeMs,
      onComplete: () => {
        music.stop();
        music.destroy();
      },
    });
  }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      this.settings = { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      /* ignore */
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignore */
    }
  }
}
