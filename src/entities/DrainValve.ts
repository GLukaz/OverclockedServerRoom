import * as Phaser from "phaser";

export class DrainValve extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Image;
  private prompt: Phaser.GameObjects.Text;
  private warning: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;
  private progress: Phaser.GameObjects.Rectangle;
  private progressBg: Phaser.GameObjects.Rectangle;
  public spinning = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.base = scene.add.image(0,-5, "valve").setScale(0.5);
    this.progressBg = scene.add.rectangle(0, -26, 50, 5, 0x0a0f15).setStrokeStyle(1, 0x3a4a60);
    this.progress = scene.add.rectangle(-25, -126, 0, 3, 0x4ab0ff).setOrigin(0, 0.5);
    this.prompt = scene.add
      .text(0, -182, "[F] drain", { fontFamily: "monospace", fontSize: "12px", color: "#9fd0ff" })
      .setOrigin(0.5)
      .setVisible(false);

    this.warning = scene.add
      .text(0, -158, "! DRAIN !", { fontFamily: "monospace", fontSize: "13px", color: "#ff6a4a" })
      .setOrigin(0.5)
      .setVisible(false);

    this.arrow = scene.add
      .text(0, -78, "▼", { fontFamily: "monospace", fontSize: "88px", color: "#ff6a4a" })
      .setOrigin(0.5)
      .setVisible(false);

    this.add([this.base, this.progressBg, this.progress, this.prompt, this.warning, this.arrow]);
  }

  showWarning(show: boolean) {
    this.warning.setVisible(show);
    this.arrow.setVisible(show);
    if (show) {
      const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now / 120);
      this.warning.setAlpha(pulse);
      this.arrow.setAlpha(pulse);
      this.arrow.y = -78 + Math.sin(this.scene.time.now / 180) * 4;
    }
  }

  showPrompt(show: boolean) {
    this.prompt.setVisible(show);
    this.progressBg.setVisible(show);
  }

  setSpinning(on: boolean, dt: number) {
    this.spinning = on;
  }

  setProgress(t: number) {
    this.progress.width = 50 * Phaser.Math.Clamp(t, 0, 1);
  }
}
