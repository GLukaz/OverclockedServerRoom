import * as Phaser from "phaser";

export type ServerState = "safe" | "warning" | "critical" | "failed";

export class Server extends Phaser.GameObjects.Container {
  public heat = 0;
  public state: ServerState = "safe";
  private box: Phaser.GameObjects.Rectangle;
  private screen: Phaser.GameObjects.Rectangle;
  private heatBar: Phaser.GameObjects.Rectangle;
  private heatBarBg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private flushPrompt: Phaser.GameObjects.Text;
  public failed = false;
  public ventCooldown = 0;
  public heatMultiplier = 1;
  private surgeIcon?: Phaser.GameObjects.Text;
  private fireParticles: Phaser.GameObjects.Graphics[] = [];
  private fireTimer?: Phaser.Time.TimerEvent;


  constructor(scene: Phaser.Scene, x: number, y: number, public id: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.box = scene.add.rectangle(0, 0, 48, 72, 0x1f2a38).setStrokeStyle(2, 0x3a4a60);
    this.screen = scene.add.rectangle(0, -16, 36, 14, 0x2ee66b);
    this.heatBarBg = scene.add.rectangle(0, 22, 38, 6, 0x0a0f15).setStrokeStyle(1, 0x3a4a60);
    this.heatBar = scene.add.rectangle(-19, 22, 0, 4, 0x2ee66b).setOrigin(0, 0.5);
    this.label = scene.add
      .text(0, -46, `S${id}`, { fontFamily: "monospace", fontSize: "12px", color: "#9fb4d0" })
      .setOrigin(0.5);
    this.flushPrompt = scene.add
      .text(0, -84, "hold Q 💧", { fontFamily: "monospace", fontSize: "10px", color: "#4ab0ff" })
      .setOrigin(0.5)
      .setVisible(false);

    this.add([this.box, this.screen, this.heatBarBg, this.heatBar, this.label, this.flushPrompt]);
    this.setSize(48, 72);
  }

  addHeat(amount: number) {
    if (this.failed) return;
    this.heat = Phaser.Math.Clamp(this.heat + amount, 0, 100);
    this.refresh();
  }

  cool(amount: number) {
    if (this.failed) return;
    this.heat = Phaser.Math.Clamp(this.heat - amount, 0, 100);
    this.refresh();
    this.scene.tweens.add({
      targets: this.screen,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      duration: 100,
    });
  }

  canVent(): boolean {
    return !this.failed && this.ventCooldown <= 0;
  }

  applyVentCooldown(ms: number) {
    this.ventCooldown = ms;
  }

  tickVentCooldown(delta: number) {
    if (this.ventCooldown > 0) {
      this.ventCooldown = Math.max(0, this.ventCooldown - delta);
      if (this.ventCooldown <= 0) {
        this.setAlpha(1);
      }
    }
  }

  applyVentVisual() {
    if (this.failed) return;
    this.setAlpha(0.35);
  }

  setSurgeState(state: "off" | "telegraph" | "active", multiplier = 1) {
    this.heatMultiplier = multiplier;
    if (state === "off") {
      this.box.setStrokeStyle(2, 0x3a4a60);
      if (this.surgeIcon) {
        this.scene.tweens.killTweensOf(this.surgeIcon);
        this.surgeIcon.destroy();
        this.surgeIcon = undefined;
      }
      return;
    }
    if (!this.surgeIcon) {
      this.surgeIcon = this.scene.add
        .text(0, -62, "", { fontFamily: "monospace", fontSize: "11px", color: "#ffcc22" })
        .setOrigin(0.5);
      this.add(this.surgeIcon);
    }
    this.scene.tweens.killTweensOf(this.surgeIcon);
    if (state === "telegraph") {
      this.box.setStrokeStyle(3, 0xffcc22);
      this.surgeIcon.setText("AI INCOMING");
      this.surgeIcon.setColor("#ffcc22");
      this.scene.tweens.add({
        targets: this.surgeIcon,
        alpha: { from: 0.3, to: 1 },
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.box.setStrokeStyle(3, 0xffaa22);
      this.surgeIcon.setText("AI LIVE x2.5");
      this.surgeIcon.setColor("#ffaa22");
      this.surgeIcon.setAlpha(1);
    }
  }

  fail() {
    if (this.failed) return;
    this.failed = true;
    this.state = "failed";
    this.screen.setFillStyle(0x333333);
    this.box.setFillStyle(0x3a1010);
    const flash = this.scene.add.circle(this.x, this.y, 10, 0xff7a3a, 0.8);
    this.scene.tweens.add({
      targets: flash,
      radius: 80,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
    this.startFire();
  }

  private startFire() {
    const colors = [0xff4a1a, 0xff7a3a, 0xffaa22, 0xffcc44];
    const spawnFlame = () => {
      if (this.fireParticles.length > 12) {
        const old = this.fireParticles.shift();
        old?.destroy();
      }
      const ox = Phaser.Math.Between(-16, 16);
      const startY = Phaser.Math.Between(-10, 10);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const size = Phaser.Math.Between(3, 7);

      const g = this.scene.add.graphics().setDepth(5);
      g.fillStyle(color, 0.9);
      g.fillCircle(0, 0, size);
      g.setPosition(this.x + ox, this.y + startY);
      this.fireParticles.push(g);

      this.scene.tweens.add({
        targets: g,
        y: g.y - Phaser.Math.Between(20, 45),
        x: g.x + Phaser.Math.Between(-8, 8),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => {
          const idx = this.fireParticles.indexOf(g);
          if (idx !== -1) this.fireParticles.splice(idx, 1);
          g.destroy();
        },
      });
    };

    // Initial burst
    for (let i = 0; i < 6; i++) spawnFlame();

    this.fireTimer = this.scene.time.addEvent({
      delay: 80,
      loop: true,
      callback: spawnFlame,
    });
  }

  showFlushPrompt(show: boolean) {
    this.flushPrompt.setVisible(show && !this.failed);
  }

  private refresh() {
    const t = this.heat / 100;
    this.heatBar.width = 38 * t;

    let color = 0x2ee66b;
    let newState: ServerState = "safe";
    if (this.heat >= 80) {
      color = 0xff4a4a;
      newState = "critical";
    } else if (this.heat >= 50) {
      color = 0xffc44a;
      newState = "warning";
    }
    this.heatBar.setFillStyle(color);
    this.screen.setFillStyle(color);
    this.state = newState;
  }
}
