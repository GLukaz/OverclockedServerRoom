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
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 480, y: 400, w: 200, h: 18 },
    ],
    servers: [
      { x: 715, y: 455 },
      { x: 485, y: 335 },
    ],
    drain: { x: 135, y: 495 },
    overclockPerSecond: 4.0,
    serverHeatBase: 0.7,
    serverHeatFactor: 0.5,
    events: {
      telegraphMs: 5000,
      surgeDurationMs: 10000,
      surgeHeatMult: 1.2,
      surgeRewardOverclock: 8,
      firstEventDelayMs: 15000,
      gapEarlyMs: 20000,
      gapLateMs: 12000,
    },
  },
  {
    id: 2,
    name: "CACHE LAYER",
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
    overclockPerSecond: 3.0,
    serverHeatBase: 1.0,
    serverHeatFactor: 0.8,
    events: {
      telegraphMs: 4500,
      surgeDurationMs: 14000,
      surgeHeatMult: 1.5,
      surgeRewardOverclock: 10,
      firstEventDelayMs: 13000,
      gapEarlyMs: 22000,
      gapLateMs: 12000,
    },
  },
  {
    id: 3,
    name: "HOT AISLE",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
    ],
    drain: { x: 135, y: 495 },
    overclockPerSecond: 2.5,
    serverHeatBase: 1.3,
    serverHeatFactor: 1.0,
    events: {
      telegraphMs: 4000,
      surgeDurationMs: 18000,
      surgeHeatMult: 1.8,
      surgeRewardOverclock: 11,
      firstEventDelayMs: 12000,
      gapEarlyMs: 26000,
      gapLateMs: 13000,
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
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 3500, warnMs: 900, activeMs: 900 },
    ],
    overclockPerSecond: 2.2,
    serverHeatBase: 1.5,
    serverHeatFactor: 1.1,
    events: {
      telegraphMs: 3800,
      surgeDurationMs: 19000,
      surgeHeatMult: 2.0,
      surgeRewardOverclock: 12,
      firstEventDelayMs: 13000,
      gapEarlyMs: 26000,
      gapLateMs: 13000,
    },
  },
  {
    id: 5,
    name: "MELTDOWN",
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
      { type: "electric", x: 415, y: 310, w: 150, h: 22, offMs: 3200, warnMs: 800, activeMs: 800 },
      { type: "steam", x: 760, y: 195, direction: "up", length: 150, width: 46, offMs: 3400, warnMs: 800, activeMs: 900, phaseOffsetMs: 2000 },
    ],
    overclockPerSecond: 2.0,
    serverHeatBase: 1.7,
    serverHeatFactor: 1.2,
    events: {
      telegraphMs: 3700,
      surgeDurationMs: 18000,
      surgeHeatMult: 2.0,
      surgeRewardOverclock: 13,
      firstEventDelayMs: 14000,
      gapEarlyMs: 26000,
      gapLateMs: 14000,
    },
  },
  {
    id: 6,
    name: "COOLING FAILURE",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 220, w: 200, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
      { x: 480, y: 180 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 3000, warnMs: 800, activeMs: 1200 },
      { type: "steam", x: 200, y: 420, direction: "up", length: 120, width: 40, offMs: 3200, warnMs: 700, activeMs: 1000 },
    ],
    overclockPerSecond: 1.8,
    serverHeatBase: 1.8,
    serverHeatFactor: 1.3,
    events: {
      telegraphMs: 3500,
      surgeDurationMs: 17000,
      surgeHeatMult: 2.2,
      surgeRewardOverclock: 14,
      firstEventDelayMs: 12000,
      gapEarlyMs: 25000,
      gapLateMs: 13000,
    },
  },
  {
    id: 7,
    name: "POWER SPIKE",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 220, w: 200, h: 18 },
      { x: 800, y: 150, w: 120, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
      { x: 480, y: 180 },
      { x: 800, y: 120 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 2800, warnMs: 700, activeMs: 1300 },
      { type: "steam", x: 200, y: 420, direction: "up", length: 120, width: 40, offMs: 3000, warnMs: 700, activeMs: 1100 },
      { type: "electric", x: 800, y: 140, w: 100, h: 18, offMs: 3500, warnMs: 900, activeMs: 900 },
    ],
    overclockPerSecond: 1.6,
    serverHeatBase: 2.0,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 3300,
      surgeDurationMs: 18000,
      surgeHeatMult: 2.4,
      surgeRewardOverclock: 15,
      firstEventDelayMs: 12000,
      gapEarlyMs: 25000,
      gapLateMs: 13000,
    },
  },
  {
    id: 8,
    name: "PIPE MAZE",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 220, w: 200, h: 18 },
      { x: 800, y: 150, w: 120, h: 18 },
      { x: 200, y: 150, w: 120, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
      { x: 480, y: 180 },
      { x: 800, y: 120 },
      { x: 200, y: 120 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 3200, warnMs: 900, activeMs: 900 },
      { type: "steam", x: 200, y: 420, direction: "up", length: 120, width: 40, offMs: 3400, warnMs: 900, activeMs: 900 },
      { type: "electric", x: 800, y: 140, w: 100, h: 18, offMs: 3500, warnMs: 1100, activeMs: 900 },
      { type: "steam", x: 600, y: 320, direction: "left", length: 100, width: 30, offMs: 3500, warnMs: 1000, activeMs: 900 },
    ],
    overclockPerSecond: 1.6,
    serverHeatBase: 1.7,
    serverHeatFactor: 1.2,
    events: {
      telegraphMs: 4000,
      surgeDurationMs: 21000,
      surgeHeatMult: 2.0,
      surgeRewardOverclock: 16,
      firstEventDelayMs: 13000,
      gapEarlyMs: 28000,
      gapLateMs: 16000,
    },
  },
  {
    id: 9,
    name: "HAZARD ZONE",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 220, w: 200, h: 18 },
      { x: 800, y: 150, w: 120, h: 18 },
      { x: 200, y: 150, w: 120, h: 18 },
      { x: 480, y: 80, w: 200, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
      { x: 480, y: 180 },
      { x: 800, y: 120 },
      { x: 200, y: 120 },
      { x: 480, y: 60 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 3400, warnMs: 900, activeMs: 900 },
      { type: "steam", x: 200, y: 420, direction: "up", length: 120, width: 40, offMs: 3500, warnMs: 900, activeMs: 900 },
      { type: "electric", x: 800, y: 140, w: 100, h: 18, offMs: 3700, warnMs: 1100, activeMs: 900 },
      { type: "steam", x: 600, y: 320, direction: "left", length: 100, width: 30, offMs: 3700, warnMs: 1000, activeMs: 900 },
      { type: "electric", x: 480, y: 80, w: 120, h: 18, offMs: 4000, warnMs: 1100, activeMs: 900 },
    ],
    overclockPerSecond: 1.4,
    serverHeatBase: 1.8,
    serverHeatFactor: 1.3,
    events: {
      telegraphMs: 4200,
      surgeDurationMs: 22000,
      surgeHeatMult: 2.2,
      surgeRewardOverclock: 17,
      firstEventDelayMs: 14000,
      gapEarlyMs: 30000,
      gapLateMs: 18000,
    },
  },
  {
    id: 10,
    name: "FINAL PROTOCOL",
    platforms: [
      { x: 480, y: 524, w: 960, h: 32 },
      { x: 180, y: 440, w: 160, h: 18 },
      { x: 780, y: 440, w: 160, h: 18 },
      { x: 350, y: 320, w: 160, h: 18 },
      { x: 610, y: 320, w: 160, h: 18 },
      { x: 480, y: 220, w: 200, h: 18 },
      { x: 800, y: 150, w: 120, h: 18 },
      { x: 200, y: 150, w: 120, h: 18 },
      { x: 480, y: 80, w: 200, h: 18 },
      { x: 900, y: 60, w: 100, h: 18 },
    ],
    servers: [
      { x: 350, y: 455 },
      { x: 625, y: 455 },
      { x: 350, y: 255 },
      { x: 610, y: 255 },
      { x: 480, y: 180 },
      { x: 800, y: 120 },
      { x: 200, y: 120 },
      { x: 480, y: 60 },
      { x: 900, y: 40 },
    ],
    drain: { x: 135, y: 495 },
    hazards: [
      { type: "electric", x: 480, y: 498, w: 130, h: 22, offMs: 4000, warnMs: 1100, activeMs: 900 },
      { type: "steam", x: 200, y: 420, direction: "up", length: 120, width: 40, offMs: 4000, warnMs: 1100, activeMs: 900 },
      { type: "electric", x: 800, y: 140, w: 100, h: 18, offMs: 4200, warnMs: 1200, activeMs: 900 },
      { type: "steam", x: 600, y: 320, direction: "left", length: 100, width: 30, offMs: 4200, warnMs: 1200, activeMs: 900 },
      { type: "electric", x: 480, y: 80, w: 120, h: 18, offMs: 4500, warnMs: 1200, activeMs: 900 },
      { type: "steam", x: 900, y: 60, direction: "down", length: 80, width: 30, offMs: 4500, warnMs: 1200, activeMs: 900 },
    ],
    overclockPerSecond: 1.2,
    serverHeatBase: 2.0,
    serverHeatFactor: 1.4,
    events: {
      telegraphMs: 4500,
      surgeDurationMs: 24000,
      surgeHeatMult: 2.4,
      surgeRewardOverclock: 18,
      firstEventDelayMs: 15000,
      gapEarlyMs: 32000,
      gapLateMs: 20000,
    },
  },
];

export function getLevel(index: number): LevelConfig {
  return LEVELS[Phaser.Math.Clamp(index, 0, LEVELS.length - 1)];
}
