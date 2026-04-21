import * as Phaser from "phaser";

export type QuipEvent =
  | "onVent"
  | "onServerFail"
  | "onOverpressure"
  | "onOverclockHigh"
  | "onDrain"
  | "onZapped"
  | "onLevelStart"
  | "onLevelClear"
  | "onLowStamina"
  | "onIdle";

const QUIPS: Record<QuipEvent, string[]> = {
  onVent: [
    "Cool down, you overheated things.",
    "There. Breathe a little.",
    "That should buy me a minute.",
    "Venting heat. Classic fix.",
  ],
  onServerFail: [
    "Rack down. One less problem.",
    "That one gave up on life.",
    "Rest in peace, little server.",
    "Well, that's a ticket for tomorrow.",
  ],
  onOverpressure: [
    "The pipes can't take this!",
    "Too much pressure! Drain, drain, drain!",
    "Everything is about to burst!",
  ],
  onOverclockHigh: [
    "The AI is pushing way too hard.",
    "This model wants to melt the racks.",
    "Whoever trained this thing owes me overtime.",
  ],
  onDrain: [
    "Pressure gone. Safe for now.",
    "Relief. Finally.",
    "Drained. Back to normal chaos.",
  ],
  onZapped: [
    "Ouch! Who left that live?!",
    "Zapped. Great. Love this job.",
    "I'm getting hazard pay for this, right?",
  ],
  onLevelStart: [
    "New floor, same nonsense.",
    "More servers, more problems.",
    "Let's see what this one wants.",
  ],
  onLevelClear: [
    "Floor stable. On to the next.",
    "One down. Don't celebrate yet.",
    "The AI can wait. I need coffee.",
  ],
  onLowStamina: [
    "I... need... a break.",
    "My legs are giving up on me.",
    "Should've stretched this morning.",
  ],
  onIdle: [
    "These machines never rest.",
    "Quiet. I don't trust it.",
    "Why did I take this job?",
    "The AI is watching. I can feel it.",
  ],
};

export class QuipSystem {
  private bubble: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private tail: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private cooldownMs = 0;
  private hideTimer = Infinity;
  private idleTimer = 0;
  private lastByEvent = new Map<QuipEvent, string>();
  private readonly idleThresholdMs = 15000;
  private readonly globalCooldownMs = 2500;
  private readonly bubbleVisibleMs = 2800;

  constructor(
    private scene: Phaser.Scene,
    private target: { x: number; y: number }
  ) {
    this.bg = scene.add.graphics();
    this.tail = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#0b1118",
        align: "center",
        wordWrap: { width: 220 },
      })
      .setOrigin(0.5);
    this.bubble = scene.add.container(0, 0, [this.bg, this.tail, this.text]);
    this.bubble.setDepth(25).setVisible(false);
  }

  trigger(event: QuipEvent) {
    if (this.cooldownMs > 0) return;
    const bank = QUIPS[event];
    if (!bank || bank.length === 0) return;
    const last = this.lastByEvent.get(event);
    let line = Phaser.Utils.Array.GetRandom(bank) as string;
    if (bank.length > 1) {
      let guard = 4;
      while (line === last && guard-- > 0) {
        line = Phaser.Utils.Array.GetRandom(bank) as string;
      }
    }
    this.lastByEvent.set(event, line);
    this.show(line);
    this.cooldownMs = this.globalCooldownMs;
    this.idleTimer = 0;
  }

  private show(line: string) {
    this.text.setText(line);
    const pad = 8;
    const w = this.text.width + pad * 2;
    const h = this.text.height + pad * 2;

    this.bg.clear();
    this.bg.fillStyle(0xffffff, 0.95);
    this.bg.lineStyle(1.5, 0x0b1118, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    this.tail.clear();
    this.tail.fillStyle(0xffffff, 1);
    this.tail.beginPath();
    this.tail.moveTo(-6, h / 2 - 1);
    this.tail.lineTo(6, h / 2 - 1);
    this.tail.lineTo(0, h / 2 + 8);
    this.tail.closePath();
    this.tail.fillPath();
    this.tail.lineStyle(1.5, 0x0b1118, 1);
    this.tail.beginPath();
    this.tail.moveTo(-6, h / 2);
    this.tail.lineTo(0, h / 2 + 8);
    this.tail.lineTo(6, h / 2);
    this.tail.strokePath();

    this.scene.tweens.killTweensOf(this.bubble);
    this.bubble.setVisible(true).setAlpha(0).setScale(0.85);
    this.scene.tweens.add({
      targets: this.bubble,
      alpha: 1,
      scale: 1,
      duration: 150,
      ease: "Back.Out",
    });
    this.hideTimer = this.bubbleVisibleMs;
  }

  update(delta: number) {
    this.cooldownMs = Math.max(0, this.cooldownMs - delta);

    if (this.bubble.visible) {
      const h = this.text.height + 16;
      this.bubble.setPosition(this.target.x, this.target.y - 60 - h / 2);
      this.hideTimer -= delta;
      if (this.hideTimer <= 0) {
        this.hideTimer = Infinity;
        this.scene.tweens.add({
          targets: this.bubble,
          alpha: 0,
          duration: 220,
          onComplete: () => this.bubble.setVisible(false),
        });
      }
    }

    this.idleTimer += delta;
    if (this.idleTimer >= this.idleThresholdMs && this.cooldownMs <= 0) {
      this.trigger("onIdle");
    }
  }
}
