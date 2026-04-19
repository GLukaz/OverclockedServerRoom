import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Server } from "../entities/Server";
import { DrainValve } from "../entities/DrainValve";
import { ElectricHazard } from "../entities/ElectricHazard";
import { SteamPipe } from "../entities/SteamPipe";
import { UIManager } from "../ui/UIManager";
import { EventManager } from "../events/EventManager";
import { LevelEditor } from "../editor/LevelEditor";
import { GAME_HEIGHT, GAME_WIDTH } from "../main";
import {
  DEBUG,
  DEFAULT_DRAIN,
  LEVELS,
  LevelConfig,
  getFurthestLevelIndex,
  markLevelReached,
  resetFurthestLevelIndex,
} from "../config/levels";

const PARALYZE_MS = 1200;

const WATER_HOLD_MS = 400;
const VENT_COOLDOWN_MS = 700;
const VENT_BASE = 18;
const VENT_BUFF_MULT = 1.2;
const VENT_AOE_RADIUS = 160;
const VENT_AOE_MULT = 0.4;
const VENT_WATER_GAIN = 6;
const WATER_COOL_AMOUNT = 50;
const WATER_COST = 20;
const DRAIN_HOLD_MS = 2000;
const BUFF_LOW = 30;
const BUFF_HIGH = 70;
const SERVER_VENT_COOLDOWN_MS = 4000;
const PRESSURE_BURST = 100;
const BURST_TIMEOUT_MS = 8000;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private platformVisuals: Phaser.GameObjects.Rectangle[] = [];
  private servers: Server[] = [];
  private hazards: (ElectricHazard | SteamPipe)[] = [];
  private drain!: DrainValve;
  private drainSpec!: { x: number; y: number };
  private ui!: UIManager;
  private eventManager!: EventManager;
  private editor!: LevelEditor;

  private levelIndex = 0;
  private level!: LevelConfig;
  private overclock = 0;
  private waterLevel = 0;
  private gameOver = false;
  private transitioning = false;

  private interactKey!: Phaser.Input.Keyboard.Key;
  private waterKey!: Phaser.Input.Keyboard.Key;
  private drainKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private editorKey!: Phaser.Input.Keyboard.Key;

  private holdMs = 0;
  private flushFired = false;
  private ventGlobalCooldown = 0;
  private ventLabel!: Phaser.GameObjects.Text;
  private burstTimer = 0;
  private bursting = false;
  private burstLabel!: Phaser.GameObjects.Text;
  private drainHoldMs = 0;

  constructor() {
    super("GameScene");
  }

  init(data: { levelIndex?: number }) {
    let idx: number;
    if (data?.levelIndex !== undefined) {
      idx = data.levelIndex;
    } else if (DEBUG.startLevel !== null) {
      idx = DEBUG.startLevel;
    } else {
      idx = 0;
    }
    this.levelIndex = Phaser.Math.Clamp(idx, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    markLevelReached(this.levelIndex);
  }

  create() {
    this.overclock = 0;
    this.waterLevel = 0;
    this.gameOver = false;
    this.transitioning = false;
    this.servers = [];
    this.hazards = [];
    this.platformVisuals = [];
    this.holdMs = 0;
    this.flushFired = false;
    this.ventGlobalCooldown = 0;
    this.burstTimer = 0;
    this.bursting = false;
    this.drainHoldMs = 0;

    this.drawBackdrop();

    this.platforms = this.physics.add.staticGroup();
    for (const p of this.level.platforms) {
      this.platformVisuals.push(this.makePlatform(p.x, p.y, p.w, p.h, 0x2a3546));
    }

    this.level.servers.forEach((s, i) =>
      this.servers.push(new Server(this, s.x, s.y, i + 1))
    );

    if (this.level.hazards) {
      for (const h of this.level.hazards) {
        if (h.type === "electric") {
          this.hazards.push(
            new ElectricHazard(this, {
              x: h.x,
              y: h.y,
              w: h.w,
              h: h.h,
              offMs: h.offMs,
              warnMs: h.warnMs,
              activeMs: h.activeMs,
              phaseOffsetMs: h.phaseOffsetMs,
            })
          );
        } else {
          this.hazards.push(
            new SteamPipe(this, {
              x: h.x,
              y: h.y,
              direction: h.direction,
              length: h.length,
              width: h.width,
              offMs: h.offMs,
              warnMs: h.warnMs,
              activeMs: h.activeMs,
              phaseOffsetMs: h.phaseOffsetMs,
            })
          );
        }
      }
    }

    this.drainSpec = this.level.drain
      ? { x: this.level.drain.x, y: this.level.drain.y }
      : { ...DEFAULT_DRAIN };
    this.drain = new DrainValve(this, this.drainSpec.x, this.drainSpec.y);

    this.player = new Player(this, 140, GAME_HEIGHT - 120);
    this.physics.add.collider(this.player, this.platforms);

    this.ventLabel = this.add
      .text(0, 0, "", { fontFamily: "monospace", fontSize: "12px", color: "#ffe27a" })
      .setOrigin(0.5)
      .setDepth(10);

    this.burstLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ff4a4a",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.ui = new UIManager(this);

    this.eventManager = new EventManager(
      this,
      {
        onBanner: (m, c) => this.ui.showBanner(m, c),
        onLog: (m, c) => this.ui.setEventLog(m, c),
        onOverclockBonus: (amt) => {
          this.overclock = Phaser.Math.Clamp(this.overclock + amt, 0, 100);
        },
      },
      this.level.events
    );

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.waterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.drainKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.editorKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    this.editor = new LevelEditor(this, {
      level: this.level,
      levelIndex: this.levelIndex,
      platformVisuals: this.platformVisuals,
      servers: this.servers,
      hazards: this.hazards,
      drainSpec: this.drainSpec,
      drainVisual: this.drain,
    });

    this.ui.setLevel(this.levelIndex + 1, LEVELS.length, this.level.name);
    this.ui.showBanner(`LEVEL ${this.levelIndex + 1} — ${this.level.name}`, "#ff9a4a");
  }

  private drawBackdrop() {
    const g = this.add.graphics();
    g.fillStyle(0x0e141c, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x1a2636, 1);
    for (let x = 0; x < GAME_WIDTH; x += 32) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 32) g.lineBetween(0, y, GAME_WIDTH, y);
  }

  private makePlatform(x: number, y: number, w: number, h: number, color: number) {
    const rect = this.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0x4a5c75);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
    return rect;
  }

  private inBuffBand() {
    return this.waterLevel >= BUFF_LOW && this.waterLevel <= BUFF_HIGH;
  }

  update(_time: number, delta: number) {
    if (Phaser.Input.Keyboard.JustDown(this.editorKey)) {
      this.editor.toggle();
      if (this.editor.isActive()) this.physics.pause();
      else this.physics.resume();
    }
    if (this.editor.isActive()) {
      this.editor.update(delta);
      return;
    }

    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        const target = DEBUG.restartFromLastLevel
          ? getFurthestLevelIndex()
          : DEBUG.startLevel ?? 0;
        if (!DEBUG.restartFromLastLevel) resetFurthestLevelIndex();
        this.scene.restart({ levelIndex: target });
      }
      return;
    }
    if (this.transitioning) return;

    const dt = delta / 1000;

    this.overclock = Phaser.Math.Clamp(
      this.overclock + dt * this.level.overclockPerSecond,
      0,
      100
    );
    if (this.overclock >= 100) {
      if (this.levelIndex + 1 < LEVELS.length) {
        this.transitioning = true;
        this.ui.showBanner(`LEVEL ${this.levelIndex + 1} CLEARED`, "#2ee66b");
        this.time.delayedCall(1400, () => {
          this.scene.restart({ levelIndex: this.levelIndex + 1 });
        });
      } else {
        this.gameOver = true;
        this.ui.showWin();
      }
      return;
    }
    const overclockFactor = 1 + this.overclock / 50;

    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    for (const hz of this.hazards) {
      hz.update(delta);
      if (hz.isDangerous() && !this.player.isParalyzed()) {
        if (hz.overlapsBox(this.player.x, this.player.y, pBody.width, pBody.height)) {
          this.player.paralyze(PARALYZE_MS);
          this.flashBurst(this.player.x, this.player.y, 0xffe27a);
          this.ui.setHint("ZAPPED! cool down...");
          pBody.setVelocityY(-260);
        }
      }
    }

    this.player.update(delta);

    let aliveCount = 0;
    let nearest: Server | null = null;
    let nearestDist = Infinity;

    this.ventGlobalCooldown = Math.max(0, this.ventGlobalCooldown - delta);

    this.eventManager.update(delta, this.servers, this.overclock);

    for (const s of this.servers) {
      s.showFlushPrompt(false);
      s.tickVentCooldown(delta);
      if (s.failed) continue;
      aliveCount++;
      s.addHeat(
        dt *
          (this.level.serverHeatBase + overclockFactor * this.level.serverHeatFactor) *
          s.heatMultiplier
      );
      if (s.heat >= 100) {
        s.fail();
        continue;
      }
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
      if (d < 70 && d < nearestDist) {
        nearestDist = d;
        nearest = s;
      }
    }

    if (nearest && nearest.canVent()) nearest.showFlushPrompt(true);

    // Vent: tap E — AoE cool servers + earn water per server vented
    if (
      Phaser.Input.Keyboard.JustDown(this.interactKey) &&
      this.ventGlobalCooldown <= 0 &&
      !this.player.isParalyzed()
    ) {
      this.showAoeRadius(this.player.x, this.player.y);
      this.ventGlobalCooldown = VENT_COOLDOWN_MS;
      const buffed = this.inBuffBand();
      const amt = VENT_BASE * (buffed ? VENT_BUFF_MULT : 1);
      const color = buffed ? 0x9fd0ff : 0x2ee66b;
      let ventedCount = 0;
      for (const s of this.servers) {
        if (s.failed) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
        if (d <= VENT_AOE_RADIUS) {
          if (s.canVent()) {
            s.cool(s === nearest ? amt : amt * VENT_AOE_MULT);
            s.applyVentCooldown(SERVER_VENT_COOLDOWN_MS);
            s.applyVentVisual();
            this.flashBurst(s.x, s.y, color);
            ventedCount++;
          } else {
            this.flashBurst(s.x, s.y, 0x555555);
          }
        }
      }
      if (ventedCount > 0) {
        this.waterLevel = Phaser.Math.Clamp(this.waterLevel + VENT_WATER_GAIN * ventedCount, 0, 100);
      }
    }

    // Water: hold Q near a server — spend water to cool it (blocked during overpressure)
    const qDown = this.waterKey.isDown;
    const qJustDown = Phaser.Input.Keyboard.JustDown(this.waterKey);
    if (qJustDown && nearest) {
      if (this.bursting) {
        this.ui.flashHint("TOO MUCH PRESSURE! Drain the valve (F) first", "#ff4a4a");
        this.flashBurst(nearest.x, nearest.y, 0xff4a4a);
      } else if (this.waterLevel < WATER_COST) {
        this.ui.flashHint("NOT ENOUGH PRESSURE! Vent servers (E) to build it up", "#ff884a");
        this.flashBurst(nearest.x, nearest.y, 0xff884a);
      }
    }
    if (qDown && nearest && !this.bursting && !this.player.isParalyzed()) {
      this.holdMs += delta;
      if (!this.flushFired && this.holdMs >= WATER_HOLD_MS) {
        if (this.waterLevel >= WATER_COST && nearest.canVent()) {
          nearest.cool(WATER_COOL_AMOUNT);
          nearest.applyVentVisual();
          nearest.applyVentCooldown(SERVER_VENT_COOLDOWN_MS);
          this.waterLevel = Phaser.Math.Clamp(this.waterLevel - WATER_COST, 0, 100);
          this.flashBurst(nearest.x, nearest.y, 0x4ab0ff);
          this.flushFired = true;
        } else if (this.waterLevel < WATER_COST) {
          this.ui.flashHint("NOT ENOUGH PRESSURE! Vent servers (E) to build it up", "#ff884a");
        }
      }
    }
    if (!qDown) {
      this.holdMs = 0;
      this.flushFired = false;
    }

    const nearDrain =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.drain.x, this.drain.y) < 90;
    this.drain.showPrompt(nearDrain && this.bursting);
    this.drain.showWarning(this.bursting);
    const holdingDrain =
      nearDrain && this.drainKey.isDown && this.bursting && !this.player.isParalyzed();
    this.drain.setSpinning(holdingDrain, dt);
    if (holdingDrain) {
      this.drainHoldMs += delta;
      if (this.drainHoldMs >= DRAIN_HOLD_MS) {
        this.waterLevel = 0;
        this.drainHoldMs = 0;
        this.flashBurst(this.drain.x, this.drain.y, 0x4ab0ff);
      }
    } else if (this.drainHoldMs > 0) {
      this.drainHoldMs = Math.max(0, this.drainHoldMs - delta * 1.5);
    }
    this.drain.setProgress(this.drainHoldMs / DRAIN_HOLD_MS);
    if (!holdingDrain && this.drainKey.isDown) {
      if (!this.bursting) this.ui.setHint("Valve locked - only opens during overpressure!");
      else if (!nearDrain) this.ui.setHint("Walk to the drain valve (bottom-left) and hold F");
    }

    // Vent cooldown label above player
    this.ventLabel.setPosition(this.player.x, this.player.y - 34);
    if (this.ventGlobalCooldown <= 0) {
      this.ventLabel.setText("[E]");
      this.ventLabel.setColor("#ffe27a");
    } else {
      this.ventLabel.setText((this.ventGlobalCooldown / 1000).toFixed(1) + "s");
      this.ventLabel.setColor("#6f85a3");
    }

    this.ui.update(
      this.overclock,
      this.waterLevel,
      aliveCount,
      this.servers.length,
      this.inBuffBand(),
      this.player.staminaPct,
      this.player.isTired
    );

    if (aliveCount === 0) {
      this.gameOver = true;
      this.ui.showGameOver("ALL SERVERS FAILED", "#ff4a4a");
      return;
    }
    // Burst timer: pressure maxed — drain or die
    if (!this.bursting && this.waterLevel >= PRESSURE_BURST) {
      this.bursting = true;
      this.burstTimer = BURST_TIMEOUT_MS;
      this.burstLabel.setVisible(true);
      this.ui.showBanner("OVERPRESSURE! DRAIN NOW!", "#ff4a4a");
    }
    if (this.bursting) {
      this.burstTimer -= delta;
      const secs = Math.max(0, this.burstTimer / 1000);
      this.burstLabel.setText(`PIPES BURSTING  ${secs.toFixed(1)}s`);
      this.burstLabel.setAlpha(0.6 + 0.4 * Math.sin(_time / 80));

      if (this.waterLevel < PRESSURE_BURST) {
        this.bursting = false;
        this.burstLabel.setVisible(false);
      } else if (this.burstTimer <= 0) {
        this.gameOver = true;
        this.burstLabel.setVisible(false);
        this.ui.showGameOver("PIPES BURST", "#4ab0ff");
        return;
      }
    }
  }

  private showAoeRadius(x: number, y: number) {
    const g = this.add.graphics();
    g.lineStyle(1.5, 0xffffff, 0.35);
    const segments = 32;
    const gap = 0.4;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1 - gap) / segments) * Math.PI * 2;
      g.beginPath();
      g.arc(x, y, VENT_AOE_RADIUS, a0, a1, false);
      g.strokePath();
    }
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 500,
      delay: 200,
      onComplete: () => g.destroy(),
    });
  }

  private flashBurst(x: number, y: number, color: number) {
    const c = this.add.circle(x, y, 8, color, 0.7);
    this.tweens.add({
      targets: c,
      radius: 40,
      alpha: 0,
      duration: 260,
      onComplete: () => c.destroy(),
    });
  }
}
