import * as Phaser from "phaser";
import { Server } from "../entities/Server";
import { EventConfig } from "../config/levels";

type Phase = "idle" | "telegraph" | "active";

export interface EventManagerCallbacks {
  onBanner(msg: string, color: string): void;
  onLog(msg: string, color: string): void;
  onOverclockBonus(amount: number): void;
}

export class EventManager {
  private phase: Phase = "idle";
  private phaseTimer = 0;
  private nextEventIn: number;
  private target: Server | null = null;
  private lastOverclock = 0;

  constructor(
    _scene: Phaser.Scene,
    private cb: EventManagerCallbacks,
    private cfg: EventConfig
  ) {
    this.nextEventIn = cfg.firstEventDelayMs;
  }

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
    this.phaseTimer = this.cfg.telegraphMs;
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
    this.phaseTimer = this.cfg.surgeDurationMs;
    this.target.setSurgeState("active", this.cfg.surgeHeatMult);
    this.cb.onBanner("SURGE LIVE!", "#ffaa22");
  }

  private endEvent(success: boolean) {
    if (this.target) {
      this.target.setSurgeState("off");
      if (success) {
        this.cb.onLog(
          `S${this.target.id} held the surge  +${this.cfg.surgeRewardOverclock}% overclock`,
          "#2ee66b"
        );
        this.cb.onBanner(`SURGE HANDLED +${this.cfg.surgeRewardOverclock}%`, "#2ee66b");
        this.cb.onOverclockBonus(this.cfg.surgeRewardOverclock);
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
    return Phaser.Math.Linear(this.cfg.gapEarlyMs, this.cfg.gapLateMs, t);
  }
}
