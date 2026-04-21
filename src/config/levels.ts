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

export type HazardSpec =
  | {
    type: "electric";
    x: number;
    y: number;
    w: number;
    h: number;
    offMs?: number;
    warnMs?: number;
    activeMs?: number;
    phaseOffsetMs?: number;
  }
  | {
    type: "steam";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    length?: number;
    width?: number;
    offMs?: number;
    warnMs?: number;
    activeMs?: number;
    phaseOffsetMs?: number;
  };

export interface LevelConfig {
  id: number;
  name: string;
  platforms: PlatformSpec[];
  servers: ServerSpec[];
  overclockPerSecond: number;
  serverHeatBase: number;
  serverHeatFactor: number;
  events: EventConfig;
  hazards?: HazardSpec[];
  drain?: { x: number; y: number };
}

export const DEFAULT_DRAIN = { x: 90, y: GAME_HEIGHT - 44 };

export const DEBUG = {
  // 0-indexed level to start from. null = start at level 1.
  startLevel: 1 as number | null,
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
    // Level 1 - BOOT SECTOR
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 480, y: 400, w: 200, h: 18 },
    ],
    servers: [
      { x: 715, y: 455 },
      { x: 485, y: 335 },
    ],
    drain: { x: 135, y: 495 },
    overclockPerSecond: 3.0,
    serverHeatBase: 1.0,
    serverHeatFactor: 0.8,
    events: {
      telegraphMs: 3500,
      surgeDurationMs: 8000,
      surgeHeatMult: 1.6,
      surgeRewardOverclock: 6,
      firstEventDelayMs: 10000,
      gapEarlyMs: 15000,
      gapLateMs: 9000,
    },
  },
  {
    id: 2,
    name: "CACHE LAYER",
    // Level 2 - CACHE LAYER
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 200, y: 420, w: 180, h: 18 },
      { x: 760, y: 420, w: 180, h: 18 },
      { x: 480, y: 300, w: 180, h: 18 },
    ],
    servers: [
      { x: 400, y: 455 },
      { x: 760, y: 355 },
      { x: 480, y: 235 },
    ],
    drain: { x: 135, y: 495 },
    overclockPerSecond: 2.2,
    serverHeatBase: 1.5,
    serverHeatFactor: 1.2,
    events: {
      telegraphMs: 3200,
      surgeDurationMs: 12000,
      surgeHeatMult: 2.0,
      surgeRewardOverclock: 8,
      firstEventDelayMs: 9000,
      gapEarlyMs: 18000,
      gapLateMs: 9000,
    },
  },
  {
    id: 3,
    name: "HOT AISLE",
    // Level 3 - HOT AISLE
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 210, w: 160, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
    ],
    drain: { x: 135, y: 495 },
    overclockPerSecond: 1.6,
    serverHeatBase: 2.0,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 3000,
      surgeDurationMs: 16000,
      surgeHeatMult: 2.4,
      surgeRewardOverclock: 9,
      firstEventDelayMs: 9000,
      gapEarlyMs: 24000,
      gapLateMs: 10000,
    },
  },
  {
    id: 4,
    name: "THERMAL RUNAWAY",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 430, w: 170, h: 18 },
      { x: 780, y: 430, w: 170, h: 18 },
      { x: 380, y: 320, w: 150, h: 18 },
      { x: 580, y: 320, w: 150, h: 18 },
      { x: 770, y: 210, w: 160, h: 18 },
    ],
    servers: [
      { x: 355, y: 455 },
      { x: 775, y: 365 },
      { x: 380, y: 255 },
      { x: 580, y: 255 },
      { x: 755, y: 150 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 2600, warnMs: 700, activeMs: 1500 },
    ],
    overclockPerSecond: 2.0,
    serverHeatBase: 2.0,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 2900,
      surgeDurationMs: 17000,
      surgeHeatMult: 2.6,
      surgeRewardOverclock: 9,
      firstEventDelayMs: 10000,
      gapEarlyMs: 24000,
      gapLateMs: 10000,
    },
  },
  {
    id: 5,
    name: "MELTDOWN",
    // Level 5 - MELTDOWN
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 140, y: 440, w: 150, h: 18 },
      { x: 820, y: 440, w: 150, h: 18 },
      { x: 480, y: 330, w: 280, h: 18 },
      { x: 255, y: 220, w: 150, h: 18 },
      { x: 700, y: 220, w: 150, h: 18 },
      { x: 865, y: 130, w: 160, h: 18 },
    ],
    servers: [
      { x: 260, y: 155 },
      { x: 695, y: 155 },
      { x: 815, y: 375 },
      { x: 475, y: 455 },
      { x: 560, y: 265 },
      { x: 865, y: 65 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 415, y: 310, w: 150, h: 22, offMs: 2200, warnMs: 600, activeMs: 1600 },
      { type: "steam", x: 760, y: 195, direction: "up", length: 150, width: 46, offMs: 2400, warnMs: 600, activeMs: 1700, phaseOffsetMs: 1500 },
    ],
    overclockPerSecond: 1.3,
    serverHeatBase: 2.2,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 2800,
      surgeDurationMs: 16000,
      surgeHeatMult: 2.5,
      surgeRewardOverclock: 9,
      firstEventDelayMs: 11000,
      gapEarlyMs: 24000,
      gapLateMs: 11000,
    },
  },
];

export function getLevel(index: number): LevelConfig {
  return LEVELS[Phaser.Math.Clamp(index, 0, LEVELS.length - 1)];
}
