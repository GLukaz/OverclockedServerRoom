import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./dimensions";

export interface PlatformSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ServerSpec {
  x: number;
  y: number;
}

export interface EventConfig {
  telegraphMs: number;
  surgeDurationMs: number;
  surgeHeatMult: number;
  surgeRewardOverclock: number;
  firstEventDelayMs: number;
  gapEarlyMs: number;
  gapLateMs: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformSpec[];
  servers: ServerSpec[];
  overclockPerSecond: number;
  serverHeatBase: number;
  serverHeatFactor: number;
  events: EventConfig;
}

export const DEBUG = {
  // 0-indexed level to start from. null = start at level 1.
  startLevel: null as number | null,
  // On death (R), restart at the highest level reached instead of level 1.
  restartFromLastLevel: true,
};

let furthestLevelIndex = 0;
export const markLevelReached = (i: number) => {
  if (i > furthestLevelIndex) furthestLevelIndex = i;
};
export const getFurthestLevelIndex = () => furthestLevelIndex;
export const resetFurthestLevelIndex = () => {
  furthestLevelIndex = 0;
};

const GROUND: PlatformSpec = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 16, w: GAME_WIDTH, h: 32 };

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "BOOT SECTOR",
    platforms: [
      GROUND,
      { x: 230, y: 410, w: 220, h: 18 },
      { x: GAME_WIDTH - 200, y: 410, w: 220, h: 18 },
      { x: GAME_WIDTH / 2, y: 290, w: 240, h: 18 },
    ],
    servers: [
      { x: 380, y: GAME_HEIGHT - 68 },
      { x: 580, y: GAME_HEIGHT - 68 },
      { x: 840, y: GAME_HEIGHT - 68 },
      { x: 230, y: 410 - 45 },
      { x: GAME_WIDTH - 200, y: 410 - 45 },
      { x: GAME_WIDTH / 2, y: 290 - 45 },
    ],
    overclockPerSecond: 1.2,
    serverHeatBase: 2,
    serverHeatFactor: 1.25,
    events: {
      telegraphMs: 4000,
      surgeDurationMs: 20000,
      surgeHeatMult: 2.5,
      surgeRewardOverclock: 15,
      firstEventDelayMs: 20000,
      gapEarlyMs: 45000,
      gapLateMs: 18000,
    },
  },
  {
    id: 2,
    name: "CACHE LAYER",
    platforms: [
      GROUND,
      { x: 180, y: 430, w: 180, h: 18 },
      { x: GAME_WIDTH - 180, y: 430, w: 180, h: 18 },
      { x: 330, y: 310, w: 180, h: 18 },
      { x: GAME_WIDTH - 330, y: 310, w: 180, h: 18 },
      { x: GAME_WIDTH / 2, y: 200, w: 160, h: 18 },
    ],
    servers: [
      { x: 300, y: GAME_HEIGHT - 68 },
      { x: 500, y: GAME_HEIGHT - 68 },
      { x: 700, y: GAME_HEIGHT - 68 },
      { x: 180, y: 430 - 45 },
      { x: GAME_WIDTH - 180, y: 430 - 45 },
      { x: 330, y: 310 - 45 },
      { x: GAME_WIDTH - 330, y: 310 - 45 },
      { x: GAME_WIDTH / 2, y: 200 - 45 },
    ],
    overclockPerSecond: 1.5,
    serverHeatBase: 2.3,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 3500,
      surgeDurationMs: 22000,
      surgeHeatMult: 2.7,
      surgeRewardOverclock: 12,
      firstEventDelayMs: 15000,
      gapEarlyMs: 34000,
      gapLateMs: 14000,
    },
  },
  {
    id: 3,
    name: "HOT AISLE",
    platforms: [
      GROUND,
      { x: 140, y: 440, w: 150, h: 18 },
      { x: 380, y: 400, w: 150, h: 18 },
      { x: GAME_WIDTH - 380, y: 400, w: 150, h: 18 },
      { x: GAME_WIDTH - 140, y: 440, w: 150, h: 18 },
      { x: 260, y: 280, w: 170, h: 18 },
      { x: GAME_WIDTH - 260, y: 280, w: 170, h: 18 },
      { x: GAME_WIDTH / 2, y: 170, w: 160, h: 18 },
    ],
    servers: [
      { x: 250, y: GAME_HEIGHT - 68 },
      { x: 430, y: GAME_HEIGHT - 68 },
      { x: GAME_WIDTH - 430, y: GAME_HEIGHT - 68 },
      { x: GAME_WIDTH - 250, y: GAME_HEIGHT - 68 },
      { x: 140, y: 440 - 45 },
      { x: GAME_WIDTH - 140, y: 440 - 45 },
      { x: 260, y: 280 - 45 },
      { x: GAME_WIDTH - 260, y: 280 - 45 },
      { x: GAME_WIDTH / 2, y: 170 - 45 },
    ],
    overclockPerSecond: 1.9,
    serverHeatBase: 2.6,
    serverHeatFactor: 1.55,
    events: {
      telegraphMs: 3000,
      surgeDurationMs: 22000,
      surgeHeatMult: 3.0,
      surgeRewardOverclock: 10,
      firstEventDelayMs: 11000,
      gapEarlyMs: 26000,
      gapLateMs: 10000,
    },
  },
  {
    id: 4,
    name: "THERMAL RUNAWAY",
    platforms: [
      GROUND,
      { x: 110, y: 450, w: 140, h: 18 },
      { x: 320, y: 420, w: 140, h: 18 },
      { x: GAME_WIDTH - 320, y: 420, w: 140, h: 18 },
      { x: GAME_WIDTH - 110, y: 450, w: 140, h: 18 },
      { x: 220, y: 310, w: 150, h: 18 },
      { x: GAME_WIDTH / 2, y: 340, w: 150, h: 18 },
      { x: GAME_WIDTH - 220, y: 310, w: 150, h: 18 },
      { x: 360, y: 200, w: 140, h: 18 },
      { x: GAME_WIDTH - 360, y: 200, w: 140, h: 18 },
    ],
    servers: [
      { x: 200, y: GAME_HEIGHT - 68 },
      { x: 380, y: GAME_HEIGHT - 68 },
      { x: 560, y: GAME_HEIGHT - 68 },
      { x: 760, y: GAME_HEIGHT - 68 },
      { x: 110, y: 450 - 45 },
      { x: GAME_WIDTH - 110, y: 450 - 45 },
      { x: 220, y: 310 - 45 },
      { x: GAME_WIDTH - 220, y: 310 - 45 },
      { x: GAME_WIDTH / 2, y: 340 - 45 },
      { x: 360, y: 200 - 45 },
      { x: GAME_WIDTH - 360, y: 200 - 45 },
    ],
    overclockPerSecond: 2.3,
    serverHeatBase: 2.9,
    serverHeatFactor: 1.7,
    events: {
      telegraphMs: 2500,
      surgeDurationMs: 24000,
      surgeHeatMult: 3.3,
      surgeRewardOverclock: 8,
      firstEventDelayMs: 9000,
      gapEarlyMs: 20000,
      gapLateMs: 8000,
    },
  },
  {
    id: 5,
    name: "MELTDOWN",
    platforms: [
      GROUND,
      { x: 90, y: 460, w: 120, h: 18 },
      { x: 260, y: 430, w: 120, h: 18 },
      { x: 430, y: 400, w: 120, h: 18 },
      { x: GAME_WIDTH - 430, y: 400, w: 120, h: 18 },
      { x: GAME_WIDTH - 260, y: 430, w: 120, h: 18 },
      { x: GAME_WIDTH - 90, y: 460, w: 120, h: 18 },
      { x: 180, y: 310, w: 140, h: 18 },
      { x: GAME_WIDTH / 2, y: 340, w: 140, h: 18 },
      { x: GAME_WIDTH - 180, y: 310, w: 140, h: 18 },
      { x: 340, y: 190, w: 130, h: 18 },
      { x: GAME_WIDTH - 340, y: 190, w: 130, h: 18 },
      { x: GAME_WIDTH / 2, y: 110, w: 150, h: 18 },
    ],
    servers: [
      { x: 170, y: GAME_HEIGHT - 68 },
      { x: 330, y: GAME_HEIGHT - 68 },
      { x: 490, y: GAME_HEIGHT - 68 },
      { x: GAME_WIDTH - 490, y: GAME_HEIGHT - 68 },
      { x: GAME_WIDTH - 330, y: GAME_HEIGHT - 68 },
      { x: GAME_WIDTH - 170, y: GAME_HEIGHT - 68 },
      { x: 260, y: 430 - 45 },
      { x: GAME_WIDTH - 260, y: 430 - 45 },
      { x: 180, y: 310 - 45 },
      { x: GAME_WIDTH - 180, y: 310 - 45 },
      { x: GAME_WIDTH / 2, y: 340 - 45 },
      { x: GAME_WIDTH / 2, y: 110 - 45 },
    ],
    overclockPerSecond: 2.8,
    serverHeatBase: 3.2,
    serverHeatFactor: 1.9,
    events: {
      telegraphMs: 2200,
      surgeDurationMs: 26000,
      surgeHeatMult: 3.6,
      surgeRewardOverclock: 7,
      firstEventDelayMs: 7000,
      gapEarlyMs: 16000,
      gapLateMs: 6000,
    },
  },
];

export function getLevel(index: number): LevelConfig {
  return LEVELS[Phaser.Math.Clamp(index, 0, LEVELS.length - 1)];
}
