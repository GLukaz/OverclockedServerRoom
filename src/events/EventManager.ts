import * as Phaser from "phaser";
import { Server } from "../entities/Server";

type Phase = "idle" | "telegraph" | "active";

const TELEGRAPH_MS = 4000;
const SURGE_DURATION_MS = 20000;
const SURGE_HEAT_MULT = 2.5;
const SURGE_REWARD_OVERCLOCK = 15;
const FIRST_EVENT_DELAY_MS = 20000;
const GAP_EARLY_MS = 45000;
const GAP_LATE_MS = 18000;

export interface EventManagerCallbacks {
  onBanner(msg: string, color: string): void;
  onLog(msg: string, color: string): void;
  onOverclockBonus(amount: number): void;
}

export class EventManager {
  private phase: Phase = "idle";
  private phaseTimer = 0;
  private nextEventIn = FIRST_EVENT_DELAY_MS;
  private target: Server | null = null;
  private lastOverclock = 0;

  constructor(private scene: Phaser.Scene, private cb: EventManagerCallbacks) {}

  update(delta: number, servers: Server[], overclock: number) {
    this.lastOverclock = overclock;

    if (this.phase === "idle") {
      this.nextEventIn -= delta;
      if (this.nextEventIn <= 0) {
        const viable = servers.filter((s) => !s.failed);
        if (viable.length === 0) {
          this.nextEventIn = 5000;
          return;
        }
        this.startTelegraph(Phaser.Utils.Array.GetRandom(viable));
      }
      return;
    }

    this.phaseTimer -= delta;

    if (this.phase === "telegraph") {
      if (this.target && this.target.failed) {
        this.endEvent(false);
        return;
      }
      if (this.phaseTimer <= 0) this.startActive();
      return;
    }

    if (this.phase === "active") {
      if (this.target && this.target.failed) {
        this.endEvent(false);
        return;
      }
      if (this.phaseTimer <= 0) this.endEvent(true);
    }
  }

  private startTelegraph(target: Server) {
    this.phase = "telegraph";
    this.phaseTimer = TELEGRAPH_MS;
    this.target = target;
    target.setSurgeState("telegraph");
    this.cb.onBanner(`AI DEMAND SURGE → S${target.id}`, "#ffcc22");
    this.cb.onLog(`Surge incoming on S${target.id}...`, "#ffcc22");
  }

  private startActive() {
    if (!this.target) {
      this.phase = "idle";
      this.nextEventIn = this.computeGap();
      return;
    }
    this.phase = "active";
    this.phaseTimer = SURGE_DURATION_MS;
    this.target.setSurgeState("active", SURGE_HEAT_MULT);
    this.cb.onBanner("SURGE LIVE!", "#ffaa22");
  }

  private endEvent(success: boolean) {
    if (this.target) {
      this.target.setSurgeState("off");
      if (success) {
        this.cb.onLog(
          `S${this.target.id} held the surge  +${SURGE_REWARD_OVERCLOCK}% overclock`,
          "#2ee66b"
        );
        this.cb.onBanner(`SURGE HANDLED +${SURGE_REWARD_OVERCLOCK}%`, "#2ee66b");
        this.cb.onOverclockBonus(SURGE_REWARD_OVERCLOCK);
      } else {
        this.cb.onLog(`S${this.target.id} lost to surge  no bonus`, "#ff4a4a");
      }
    }
    this.target = null;
    this.phase = "idle";
    this.nextEventIn = this.computeGap();
  }

  private computeGap() {
    const t = Phaser.Math.Clamp(this.lastOverclock / 100, 0, 1);
    return Phaser.Math.Linear(GAP_EARLY_MS, GAP_LATE_MS, t);
  }
}
