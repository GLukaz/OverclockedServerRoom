import * as Phaser from "phaser";

export class UIManager {
  private overclockBar: Phaser.GameObjects.Rectangle;
  private waterBar: Phaser.GameObjects.Rectangle;
  private waterBarFrame: Phaser.GameObjects.Rectangle;
  private overclockLabel: Phaser.GameObjects.Text;
  private waterLabel: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private buffLabel!: Phaser.GameObjects.Text;
  private eventLog!: Phaser.GameObjects.Text;
  private levelLabel!: Phaser.GameObjects.Text;
  private staminaBar!: Phaser.GameObjects.Rectangle;
  private staminaLabel!: Phaser.GameObjects.Text;
  private readonly barWidth = 200;
  private readonly waterBlinkThreshold = 85;

  constructor(private scene: Phaser.Scene) {
    const pad = 12;

    scene.add.text(pad, pad, "OVERCLOCK", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ff9a4a",
    });
    scene.add
      .rectangle(pad, pad + 18, this.barWidth, 12, 0x000000)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4a60);
    this.overclockBar = scene.add
      .rectangle(pad, pad + 18, 0, 12, 0xff7a3a)
      .setOrigin(0, 0);
    this.overclockLabel = scene.add.text(pad + this.barWidth + 8, pad + 18, "0%", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ff9a4a",
    });

    scene.add.text(pad, pad + 40, "PRESSURE", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#4ab0ff",
    });
    this.waterBarFrame = scene.add
      .rectangle(pad, pad + 58, this.barWidth, 12, 0x000000)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4a60);
    scene.add
      .rectangle(pad + this.barWidth * 0.3, pad + 58, this.barWidth * 0.4, 12, 0x1a3a2a)
      .setOrigin(0, 0);
    this.waterBar = scene.add
      .rectangle(pad, pad + 58, 0, 12, 0x4ab0ff)
      .setOrigin(0, 0);
    this.buffLabel = scene.add
      .text(pad + this.barWidth / 2, pad + 76, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9fd0ff",
      })
      .setOrigin(0.5, 0);
    this.waterLabel = scene.add.text(pad + this.barWidth + 8, pad + 58, "0%", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#4ab0ff",
    });

    scene.add.text(pad, pad + 92, "STAMINA", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#b7e88f",
    });
    scene.add
      .rectangle(pad, pad + 110, this.barWidth, 10, 0x000000)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4a60);
    this.staminaBar = scene.add
      .rectangle(pad, pad + 110, this.barWidth, 10, 0x7ad46a)
      .setOrigin(0, 0);
    this.staminaLabel = scene.add.text(pad + this.barWidth + 8, pad + 108, "100%", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#b7e88f",
    });

    this.statusText = scene.add
      .text(scene.scale.width - pad, pad, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#cfe3ff",
        align: "right",
      })
      .setOrigin(1, 0);

    this.levelLabel = scene.add
      .text(scene.scale.width / 2, pad, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffe27a",
        align: "center",
      })
      .setOrigin(0.5, 0);

    this.eventLog = scene.add
      .text(scene.scale.width - pad, pad + 28, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9fb4d0",
        align: "right",
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    this.hint = scene.add
      .text(scene.scale.width / 2, scene.scale.height - 18, "A/D move  -  W jump  -  E vent (+water)  -  hold Q water (-water)  -  F drain", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6f85a3",
      })
      .setOrigin(0.5);
  }

  update(
    overclock: number,
    water: number,
    serversAlive: number,
    serversTotal: number,
    buffActive: boolean,
    staminaPct: number,
    tired: boolean
  ) {
    this.overclockBar.width = this.barWidth * (overclock / 100);
    this.waterBar.width = this.barWidth * (water / 100);
    this.overclockLabel.setText(`${Math.floor(overclock)}%`);
    this.waterLabel.setText(`${Math.floor(water)}%`);
    this.statusText.setText(`SERVERS ${serversAlive}/${serversTotal}`);

    if (water >= this.waterBlinkThreshold) {
      const t = this.scene.time.now;
      const blink = (Math.sin(t / 90) + 1) * 0.5;
      const alpha = 0.55 + 0.45 * blink;
      this.waterBar.setFillStyle(0xff3a3a);
      this.waterBar.setAlpha(alpha);
      this.waterBarFrame.setStrokeStyle(1, 0xff3a3a, alpha);
      this.waterLabel.setColor("#ff4a4a");
    } else {
      this.waterBar.setFillStyle(0x4ab0ff);
      this.waterBar.setAlpha(1);
      this.waterBarFrame.setStrokeStyle(1, 0x3a4a60);
      this.waterLabel.setColor("#4ab0ff");
    }

    this.staminaBar.width = this.barWidth * Phaser.Math.Clamp(staminaPct, 0, 1);
    this.staminaLabel.setText(`${Math.floor(staminaPct * 100)}%`);
    if (tired) {
      this.staminaBar.setFillStyle(0xff884a);
      this.staminaLabel.setColor("#ff884a");
    } else {
      this.staminaBar.setFillStyle(0x7ad46a);
      this.staminaLabel.setColor("#b7e88f");
    }

    if (buffActive) {
      this.buffLabel.setText("OPTIMAL PRESSURE +20%");
      this.buffLabel.setColor("#9fd0ff");
    } else if (water < 30 && water > 0) {
      this.buffLabel.setText("LOW PRESSURE");
      this.buffLabel.setColor("#6f85a3");
    } else {
      this.buffLabel.setText("");
    }
  }

  showBanner(msg: string, color: string) {
    const t = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height / 2, msg, {
        fontFamily: "monospace",
        fontSize: "36px",
        color,
      })
      .setOrigin(0.5);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 40,
      duration: 1800,
      onComplete: () => t.destroy(),
    });
  }

  showGameOver(reason: string, color: string) {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    const overlay = this.scene.add.rectangle(cx, cy, this.scene.scale.width, this.scene.scale.height, 0x000000, 0)
      .setDepth(30);
    this.scene.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 600 });

    const title = this.scene.add
      .text(cx, cy - 30, "GAME OVER", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: "#ff4a4a",
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    const sub = this.scene.add
      .text(cx, cy + 20, reason, {
        fontFamily: "monospace",
        fontSize: "18px",
        color,
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    const restart = this.scene.add
      .text(cx, cy + 60, "press R to restart", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#6f85a3",
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    this.scene.tweens.add({ targets: title, alpha: 1, y: cy - 35, duration: 500, delay: 200 });
    this.scene.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 500 });
    this.scene.tweens.add({ targets: restart, alpha: 1, duration: 400, delay: 700 });
  }

  showWin() {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    const overlay = this.scene.add.rectangle(cx, cy, this.scene.scale.width, this.scene.scale.height, 0x000000, 0)
      .setDepth(30);
    this.scene.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 600 });

    const title = this.scene.add
      .text(cx, cy - 30, "YOU WIN!", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: "#4aff6a",
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    const sub = this.scene.add
      .text(cx, cy + 30, "OVERCLOCK COMPLETE — SERVERS MAXED OUT", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffe27a",
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    const restart = this.scene.add
      .text(cx, cy + 70, "press R to restart", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#6f85a3",
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setAlpha(0);

    this.scene.tweens.add({ targets: title, alpha: 1, y: cy - 35, duration: 500, delay: 200 });
    this.scene.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 500 });
    this.scene.tweens.add({ targets: restart, alpha: 1, duration: 400, delay: 700 });
  }

  setHint(text: string) {
    this.hint.setText(text);
    this.hint.setColor("#6f85a3");
  }

  flashHint(text: string, color: string, durationMs = 1500) {
    this.hint.setText(text);
    this.hint.setColor(color);
    this.scene.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(1);
    this.scene.tweens.add({
      targets: this.hint,
      alpha: 0.4,
      duration: 180,
      yoyo: true,
      repeat: Math.floor(durationMs / 360),
      onComplete: () => {
        this.hint.setAlpha(1);
        this.hint.setText(this.defaultHint);
        this.hint.setColor("#6f85a3");
      },
    });
  }

  private readonly defaultHint =
    "A/D move  -  W jump  -  E vent (+water)  -  hold Q water (-water)  -  F drain";

  setLevel(current: number, total: number, name: string) {
    this.levelLabel.setText(`LEVEL ${current}/${total}  ${name}`);
  }

  setEventLog(msg: string, color: string) {
    this.eventLog.setText(`> ${msg}`);
    this.eventLog.setColor(color);
    this.scene.tweens.killTweensOf(this.eventLog);
    this.eventLog.setAlpha(1);
    this.scene.tweens.add({
      targets: this.eventLog,
      alpha: 0.35,
      duration: 600,
      delay: 4000,
    });
  }
}
