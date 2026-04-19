import * as Phaser from "phaser";

export type SteamDirection = "up" | "down" | "left" | "right";

export interface SteamPipeConfig {
  x: number;
  y: number;
  direction: SteamDirection;
  length?: number;
  width?: number;
  offMs?: number;
  warnMs?: number;
  activeMs?: number;
  phaseOffsetMs?: number;
}

type Phase = "off" | "warn" | "active";

export class SteamPipe extends Phaser.GameObjects.Container {
  private pipe: Phaser.GameObjects.Rectangle;
  private steam: Phaser.GameObjects.Rectangle;
  private phase: Phase = "off";
  private phaseTimer: number;
  private offMs: number;
  private warnMs: number;
  private activeMs: number;
  private steamLocal: { x: number; y: number; w: number; h: number };

  constructor(scene: Phaser.Scene, cfg: SteamPipeConfig) {
    super(scene, cfg.x, cfg.y);
    scene.add.existing(this);

    const length = cfg.length ?? 120;
    const width = cfg.width ?? 38;
    this.offMs = cfg.offMs ?? 2500;
    this.warnMs = cfg.warnMs ?? 600;
    this.activeMs = cfg.activeMs ?? 1800;

    const pipeSize = 28;
    const gap = pipeSize / 2 + 2;
    let sx = 0;
    let sy = 0;
    let sw = width;
    let sh = length;
    if (cfg.direction === "up") {
      sy = -gap - length / 2;
      sw = width;
      sh = length;
    } else if (cfg.direction === "down") {
      sy = gap + length / 2;
      sw = width;
      sh = length;
    } else if (cfg.direction === "left") {
      sx = -gap - length / 2;
      sw = length;
      sh = width;
    } else {
      sx = gap + length / 2;
      sw = length;
      sh = width;
    }
    this.steamLocal = { x: sx, y: sy, w: sw, h: sh };

    this.steam = scene.add
      .rectangle(sx, sy, sw, sh, 0xe8f0ff, 0)
      .setStrokeStyle(0, 0xffffff, 0);
    this.pipe = scene.add
      .rectangle(0, 0, pipeSize, pipeSize, 0x4a5568)
      .setStrokeStyle(2, 0x7a8698);

    this.add([this.steam, this.pipe]);

    const offset = Phaser.Math.Clamp(cfg.phaseOffsetMs ?? 0, 0, this.offMs);
    this.phaseTimer = this.offMs - offset;
    if (this.phaseTimer <= 0) this.phaseTimer = this.offMs;
  }

  update(delta: number) {
    this.phaseTimer -= delta;
    if (this.phaseTimer <= 0) this.advancePhase();
    this.render();
  }

  isDangerous(): boolean {
    return this.phase === "active";
  }

  overlapsBox(px: number, py: number, pw: number, ph: number): boolean {
    const left = this.x + this.steamLocal.x - this.steamLocal.w / 2;
    const right = this.x + this.steamLocal.x + this.steamLocal.w / 2;
    const top = this.y + this.steamLocal.y - this.steamLocal.h / 2;
    const bottom = this.y + this.steamLocal.y + this.steamLocal.h / 2;
    return (
      px + pw / 2 > left &&
      px - pw / 2 < right &&
      py + ph / 2 > top &&
      py - ph / 2 < bottom
    );
  }

  private advancePhase() {
    if (this.phase === "off") {
      this.phase = "warn";
      this.phaseTimer = this.warnMs;
    } else if (this.phase === "warn") {
      this.phase = "active";
      this.phaseTimer = this.activeMs;
    } else {
      this.phase = "off";
      this.phaseTimer = this.offMs;
    }
  }

  private render() {
    if (this.phase === "off") {
      this.steam.setFillStyle(0xe8f0ff, 0);
      this.steam.setStrokeStyle(0, 0xffffff, 0);
      this.pipe.setStrokeStyle(2, 0x7a8698);
      return;
    }
    if (this.phase === "warn") {
      const pulse = 0.15 + 0.2 * Math.sin(this.scene.time.now / 90);
      this.steam.setFillStyle(0xe8f0ff, pulse);
      this.steam.setStrokeStyle(1, 0xffcc22, 0.6);
      this.pipe.setStrokeStyle(2, 0xffcc22);
      return;
    }
    const jitter = 0.75 + 0.15 * Math.sin(this.scene.time.now / 40);
    this.steam.setFillStyle(0xe8f0ff, jitter);
    this.steam.setStrokeStyle(2, 0xffffff, 0.8);
    this.pipe.setStrokeStyle(2, 0xffffff);
  }
}
