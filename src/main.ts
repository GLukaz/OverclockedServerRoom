import * as Phaser from "phaser";
import { PreloadScene } from "./scenes/PreloadScene";
import { LoadingScene } from "./scenes/LoadingScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GAME_HEIGHT, GAME_WIDTH } from "./config/dimensions";

export { GAME_WIDTH, GAME_HEIGHT };

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0b0f14",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scene: [PreloadScene, LoadingScene, MenuScene, GameScene],
};

new Phaser.Game(config);
