import * as Phaser from "phaser";
import { AudioManager } from "../audio/AudioManager";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private moveSpeed = 240;
  private jumpSpeed = 560;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;
  public speedMultiplier = 1;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private readonly coyoteMs = 110;
  private readonly jumpBufferMs = 120;
  private wasUp = false;
  private paralyzedMs = 0;

  private stamina = 100;
  private readonly maxStamina = 100;
  private readonly staminaDrainPerSec = 11;
  private readonly staminaRegenPerSec = 48;
  private readonly tiredThreshold = 35;
  private readonly minStaminaSpeed = 0.8;

  get staminaPct(): number {
    return this.stamina / this.maxStamina;
  }
  get isTired(): boolean {
    return this.stamina < this.tiredThreshold;
  }

  isParalyzed(): boolean {
    return this.paralyzedMs > 0;
  }

  paralyze(ms: number) {
    this.paralyzedMs = Math.max(this.paralyzedMs, ms);
    this.setTint(0xffe27a);
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const tex = Player.ensureTexture(scene);
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.65);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(56,88); // 56*0.66=36.96, 88*0.66=58.08 → same collision as before

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }


  private static ensureTexture(scene: Phaser.Scene): string {
    const key = "player_walk_1";
    if (scene.textures.exists(key)) return key;
    const g = scene.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x66e0ff, 1);
    g.fillRect(0, 0, 28, 44);
    g.fillStyle(0xffffff, 1);
    g.fillRect(6, 8, 6, 6);
    g.fillRect(16, 8, 6, 6);
    g.generateTexture(key, 28, 44);
    g.destroy();
    return key;
  }

  update(delta = 16) {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.paralyzedMs > 0) {
      this.paralyzedMs -= delta;
      body.setVelocityX(0);
      this.setAlpha(0.4 + 0.4 * Math.sin(this.scene.time.now / 60));
      this.wasUp = true;
      this.jumpBufferTimer = 0;
      if (this.paralyzedMs <= 0) {
        this.paralyzedMs = 0;
        this.setAlpha(1);
        this.clearTint();
      }
      return;
    }

    const left = this.cursors.left?.isDown || this.keyA.isDown;
    const right = this.cursors.right?.isDown || this.keyD.isDown;
    const up = !!(this.cursors.up?.isDown || this.keyW.isDown || this.cursors.space?.isDown);

    const dt = delta / 1000;
    const onGround = body.blocked.down || body.touching.down;
    const moving = left || right;
    const restingOnGround = onGround && Math.abs(body.velocity.y) < 1;

    if (moving && onGround) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrainPerSec * dt);
    } else if (!moving && restingOnGround) {
      if (onGround)
        this.anims.play("fix", true);
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenPerSec * dt);
    }

    let stamFactor = 1;
    if (this.stamina < this.tiredThreshold) {
      const t = this.stamina / this.tiredThreshold;
      stamFactor = this.minStaminaSpeed + (1 - this.minStaminaSpeed) * t;
    }

    const speed = this.moveSpeed * this.speedMultiplier * stamFactor;
    if (left) {
      this.flipX = true;
      body.setVelocityX(-speed);
      if (onGround)
        this.anims.play("walk", true);
    }
    else if (right) {
      this.flipX = false;
      body.setVelocityX(speed);
      if (onGround)
        this.anims.play("walk", true);
    }
    else {
      body.setVelocityX(0);
    }
    this.coyoteTimer = onGround ? this.coyoteMs : Math.max(0, this.coyoteTimer - delta);

    const justPressedUp = up && !this.wasUp;
    if (justPressedUp) this.jumpBufferTimer = this.jumpBufferMs;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-this.jumpSpeed);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      AudioManager.instance.playSfx("sfx_jump", 0.6);
    }

    if (!up && body.velocity.y < -180) {
      body.setVelocityY(body.velocity.y * 0.5);
      this.anims.play("jump", true);
    }

    if (up && !onGround) {
      this.anims.play("jump", true);
    }

    this.wasUp = up;
  }
}
