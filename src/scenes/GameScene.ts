import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Server } from "../entities/Server";
import { DrainValve } from "../entities/DrainValve";
import { UIManager } from "../ui/UIManager";
import { EventManager } from "../events/EventManager";
import { GAME_HEIGHT, GAME_WIDTH } from "../main";

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
  private servers: Server[] = [];
  private drain!: DrainValve;
  private ui!: UIManager;
  private eventManager!: EventManager;

  private overclock = 0;
  private waterLevel = 0;
  private gameOver = false;

  private interactKey!: Phaser.Input.Keyboard.Key;
  private waterKey!: Phaser.Input.Keyboard.Key;
  private drainKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;

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

  create() {
    this.overclock = 0;
    this.waterLevel = 0;
    this.gameOver = false;
    this.servers = [];
    this.holdMs = 0;
    this.flushFired = false;
    this.ventGlobalCooldown = 0;
    this.burstTimer = 0;
    this.bursting = false;
    this.drainHoldMs = 0;

    this.drawBackdrop();

    this.platforms = this.physics.add.staticGroup();
    this.makePlatform(GAME_WIDTH / 2, GAME_HEIGHT - 16, GAME_WIDTH, 32, 0x2a3546);
    this.makePlatform(230, 410, 220, 18, 0x2a3546);
    this.makePlatform(GAME_WIDTH - 200, 410, 220, 18, 0x2a3546);
    this.makePlatform(GAME_WIDTH / 2, 290, 240, 18, 0x2a3546);

    const spots: { x: number; y: number }[] = [
      { x: 380, y: GAME_HEIGHT - 68 },
      { x: 580, y: GAME_HEIGHT - 68 },
      { x: 840, y: GAME_HEIGHT - 68 },
      { x: 230, y: 410 - 45 },
      { x: GAME_WIDTH - 200, y: 410 - 45 },
      { x: GAME_WIDTH / 2, y: 290 - 45 },
    ];
    spots.forEach((s, i) => this.servers.push(new Server(this, s.x, s.y, i + 1)));

    this.drain = new DrainValve(this, 90, GAME_HEIGHT - 44);

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

    this.eventManager = new EventManager(this, {
      onBanner: (m, c) => this.ui.showBanner(m, c),
      onLog: (m, c) => this.ui.setEventLog(m, c),
      onOverclockBonus: (amt) => {
        this.overclock = Phaser.Math.Clamp(this.overclock + amt, 0, 100);
      },
    });

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.waterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.drainKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.ui.showBanner("OVERCLOCKED", "#ff9a4a");
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
  }

  private inBuffBand() {
    return this.waterLevel >= BUFF_LOW && this.waterLevel <= BUFF_HIGH;
  }

  update(_time: number, delta: number) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) this.scene.restart();
      return;
    }

    const dt = delta / 1000;

    this.overclock = Phaser.Math.Clamp(this.overclock + dt * 1.2, 0, 100);
    if (this.overclock >= 100) {
      this.gameOver = true;
      this.ui.showWin();
      return;
    }
    const overclockFactor = 1 + this.overclock / 50;

    this.player.speedMultiplier = this.waterLevel > BUFF_HIGH ? 0.75 : 1;
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
      s.addHeat(dt * (2 + overclockFactor * 1.25) * s.heatMultiplier);
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
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.ventGlobalCooldown <= 0) {
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
    if (qDown && nearest && !this.bursting) {
      this.holdMs += delta;
      if (!this.flushFired && this.holdMs >= WATER_HOLD_MS) {
        if (this.waterLevel >= WATER_COST && nearest.canVent()) {
          nearest.cool(WATER_COOL_AMOUNT);
          nearest.applyVentVisual();
          nearest.applyVentCooldown(SERVER_VENT_COOLDOWN_MS);
          this.waterLevel = Phaser.Math.Clamp(this.waterLevel - WATER_COST, 0, 100);
          this.flashBurst(nearest.x, nearest.y, 0x4ab0ff);
          this.flushFired = true;
        } else {
          this.ui.setHint("Not enough water - vent servers to earn more!");
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
    const holdingDrain = nearDrain && this.drainKey.isDown && this.bursting;
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
      this.inBuffBand()
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
