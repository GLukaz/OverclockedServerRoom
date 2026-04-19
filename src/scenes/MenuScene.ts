import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/dimensions";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#010101");

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg-servers-2");
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.45,
    );

    const title = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 3, "title");
    title.setScale(0.5);

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 200, 56, 0x2ee66b)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "PLAY", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#0b0f14",
      })
      .setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(0x4ad98a));
    btn.on("pointerout", () => btn.setFillStyle(0x2ee66b));
    btn.on("pointerdown", () => this.scene.start("GameScene"));

    this.input.keyboard?.once("keydown-ENTER", () =>
      this.scene.start("GameScene"),
    );
    this.input.keyboard?.once("keydown-SPACE", () =>
      this.scene.start("GameScene"),
    );
  }
}
