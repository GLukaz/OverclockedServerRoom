import * as Phaser from "phaser";

export interface ElectricHazardConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  offMs?: number;
  warnMs?: number;
  activeMs?: number;
  phaseOffsetMs?: number;
}

type Phase = "off" | "warn" | "active";

export class ElectricHazard extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Rectangle;
  private arcs: Phaser.GameObjects.Graphics;
  private phase: Phase = "off";
  private phaseTimer: number;
  private offMs: number;
  private warnMs: number;
  private activeMs: number;
  public readonly hazardW: number;
  public readonly hazardH: number;

  constructor(scene: Phaser.Scene, cfg: ElectricHazardConfig) {
    super(scene, cfg.x, cfg.y);
    scene.add.existing(this);
    this.hazardW = cfg.w;
    this.hazardH = cfg.h;
    this.offMs = cfg.offMs ?? 2500;
    this.warnMs = cfg.warnMs ?? 600;
    this.activeMs = cfg.activeMs ?? 1400;

    this.base = scene.add
      .rectangle(0, 0, cfg.w, cfg.h, 0x1a2430)
      .setStrokeStyle(2, 0x3a4a60);
    this.arcs = scene.add.graphics();
    this.add([this.base, this.arcs]);

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
    const left = this.x - this.hazardW / 2;
    const right = this.x + this.hazardW / 2;
    const top = this.y - this.hazardH / 2;
    const bottom = this.y + this.hazardH / 2;
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
    this.arcs.clear();
    if (this.phase === "off") {
      this.base.setStrokeStyle(2, 0x3a4a60);
      this.base.setFillStyle(0x1a2430);
      return;
    }
    const warn = this.phase === "warn";
    const color = warn ? 0xffcc22 : 0xfff066;
    this.base.setStrokeStyle(warn ? 2 : 3, color);
    this.base.setFillStyle(warn ? 0x2a2a1a : 0x3a3210);

    const n = warn ? 2 : 5;
    const alpha = warn ? 0.4 + 0.4 * Math.sin(this.scene.time.now / 70) : 0.95;
    this.arcs.lineStyle(warn ? 1.5 : 2.5, color, alpha);
    const halfW = this.hazardW / 2 - 2;
    const halfH = this.hazardH / 2 - 2;
    for (let i = 0; i < n; i++) {
      const x1 = Phaser.Math.Between(-halfW, halfW);
      const x2 = Phaser.Math.Between(-halfW, halfW);
      this.arcs.beginPath();
      this.arcs.moveTo(x1, -halfH);
      this.arcs.lineTo(x2, halfH);
      this.arcs.strokePath();
    }
  }
}
