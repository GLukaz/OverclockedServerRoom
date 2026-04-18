import * as Phaser from "phaser";

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

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const tex = Player.ensureTexture(scene);
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(28, 44);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  private static ensureTexture(scene: Phaser.Scene): string {
    const key = "player-rect";
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
    const left = this.cursors.left?.isDown || this.keyA.isDown;
    const right = this.cursors.right?.isDown || this.keyD.isDown;
    const up = !!(this.cursors.up?.isDown || this.keyW.isDown || this.cursors.space?.isDown);

    const speed = this.moveSpeed * this.speedMultiplier;
    if (left) body.setVelocityX(-speed);
    else if (right) body.setVelocityX(speed);
    else body.setVelocityX(0);

    const onGround = body.blocked.down || body.touching.down;
    this.coyoteTimer = onGround ? this.coyoteMs : Math.max(0, this.coyoteTimer - delta);

    const justPressedUp = up && !this.wasUp;
    if (justPressedUp) this.jumpBufferTimer = this.jumpBufferMs;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-this.jumpSpeed);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    if (!up && body.velocity.y < -180) {
      body.setVelocityY(body.velocity.y * 0.5);
    }

    this.wasUp = up;
  }
}
