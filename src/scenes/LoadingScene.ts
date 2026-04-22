import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/dimensions";
import { MUSIC_ASSETS, SFX_ASSETS } from "../audio/sounds";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  preload() {
    const barWidth = 400;
    const barHeight = 24;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = (GAME_HEIGHT - barHeight) / 2;

    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, "LOADING", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffe27a",
      })
      .setOrigin(0.5);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, barWidth, barHeight, 0x0e141c)
      .setStrokeStyle(2, 0x4a5c75);

    const fill = this.add
      .rectangle(barX, barY, 0, barHeight, 0x2ee66b)
      .setOrigin(0, 0);

    const percent = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, "0%", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9fb0c8",
      })
      .setOrigin(0.5);


    this.load.image("bg-servers-2", "assets/bg-servers-2.webp");
    this.load.image("title", "assets/title.webp");
    this.load.image("platform", "assets/platform.png");
    this.load.image("server_green", "assets/server-green.png");
    this.load.image("server_yellow", "assets/server-yellow.png");
    this.load.image("server_red", "assets/server-red.png");
    this.load.image("server_crashed", "assets/server-crashed.png");
    this.load.image("player_fix", "assets/player-fix.png");
    this.load.image("player_walk_1", "assets/player_walk_1.png");
    this.load.image("player_walk_2", "assets/player_walk_2.png");
    this.load.image("player_jump", "assets/player_jump.png");
    this.load.image("valve", "assets/valve.png");

    for (const sfx of SFX_ASSETS) {
      this.load.audio(sfx.key, sfx.paths);
    }
    for (const music of MUSIC_ASSETS) {
      this.load.audio(music.key, music.paths);
    }

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.type === "audio") {
        console.debug(`[audio] missing: ${file.key} (${file.src}) — skipping`);
      }
    });

    this.load.on("progress", (value: number) => {
      fill.width = barWidth * value;
      percent.setText(Math.round(value * 100) + "%");
    });


  }

  create() {
    this.anims.create({
      key: "walk",
      frames: [
        { key: "player_walk_1" },
        { key: "player_walk_2" }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "fix",
      frames: [{ key: "player_fix" }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: "jump",
      frames: [{ key: "player_jump" }],
      frameRate: 1,
      repeat: -1
    });
    this.scene.start("MenuScene");
  }
}
