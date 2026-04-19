import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/dimensions";
import { HazardSpec, LevelConfig, PlatformSpec, ServerSpec } from "../config/levels";
import { DrainValve } from "../entities/DrainValve";
import { ElectricHazard } from "../entities/ElectricHazard";
import { Server } from "../entities/Server";
import { SteamPipe } from "../entities/SteamPipe";

const SNAP = 5;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const clampX = (v: number) => Phaser.Math.Clamp(v, 0, GAME_WIDTH);
const clampY = (v: number) => Phaser.Math.Clamp(v, 0, GAME_HEIGHT);

type Ref =
  | { kind: "platform"; spec: PlatformSpec; visual: Phaser.GameObjects.Rectangle }
  | { kind: "server"; spec: ServerSpec; visual: Server }
  | { kind: "hazard"; spec: HazardSpec; visual: ElectricHazard | SteamPipe }
  | { kind: "drain"; spec: { x: number; y: number }; visual: DrainValve };

interface Handle {
  ref: Ref;
  move: Phaser.GameObjects.Rectangle;
  resize?: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export interface EditorDeps {
  level: LevelConfig;
  levelIndex: number;
  platformVisuals: Phaser.GameObjects.Rectangle[];
  servers: Server[];
  hazards: (ElectricHazard | SteamPipe)[];
  drainSpec: { x: number; y: number };
  drainVisual: DrainValve;
}

export class LevelEditor {
  private active = false;
  private overlay: Phaser.GameObjects.Container;
  private handles: Handle[] = [];
  private selected: Handle | null = null;
  private title: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private info: Phaser.GameObjects.Text;
  private leftKey: Phaser.Input.Keyboard.Key;
  private rightKey: Phaser.Input.Keyboard.Key;
  private upKey: Phaser.Input.Keyboard.Key;
  private downKey: Phaser.Input.Keyboard.Key;
  private shiftKey: Phaser.Input.Keyboard.Key;
  private copyKey: Phaser.Input.Keyboard.Key;
  private tabKey: Phaser.Input.Keyboard.Key;
  private nudgeAccum = 0;

  constructor(private scene: Phaser.Scene, private deps: EditorDeps) {
    this.overlay = scene.add.container(0, 0).setDepth(100).setVisible(false);

    const bg = scene.add
      .rectangle(0, 0, GAME_WIDTH, 56, 0x000000, 0.78)
      .setOrigin(0, 0);
    const border = scene.add
      .rectangle(0, 56, GAME_WIDTH, 1, 0xffe27a, 0.6)
      .setOrigin(0, 0);

    this.title = scene.add.text(12, 6, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffe27a",
    });
    this.help = scene.add.text(
      12,
      26,
      "drag move  -  corner=resize platform  -  arrows nudge (shift x5)  -  TAB cycle steam dir  -  C copy TS  -  F2 exit",
      {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9fb4d0",
      }
    );
    this.info = scene.add
      .text(GAME_WIDTH - 12, 6, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9fd0ff",
        align: "right",
      })
      .setOrigin(1, 0);

    this.overlay.add([bg, border, this.title, this.help, this.info]);

    const kb = scene.input.keyboard!;
    this.leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.copyKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.tabKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  isActive() {
    return this.active;
  }

  toggle() {
    if (this.active) this.deactivate();
    else this.activate();
  }

  private activate() {
    this.active = true;
    this.overlay.setVisible(true);
    this.buildHandles();
    this.title.setText(
      `LEVEL EDITOR - lvl ${this.deps.levelIndex + 1}: ${this.deps.level.name}`
    );
    this.updateInfo();
  }

  private deactivate() {
    this.active = false;
    this.overlay.setVisible(false);
    this.selected = null;
    this.clearHandles();
  }

  private clearHandles() {
    for (const h of this.handles) {
      h.move.destroy();
      h.resize?.destroy();
      h.label.destroy();
    }
    this.handles = [];
  }

  private buildHandles() {
    const { level, platformVisuals, servers, hazards, drainSpec, drainVisual } = this.deps;

    level.platforms.forEach((spec, i) => {
      this.addHandle({ kind: "platform", spec, visual: platformVisuals[i] }, true);
    });
    level.servers.forEach((spec, i) => {
      this.addHandle({ kind: "server", spec, visual: servers[i] }, false);
    });
    level.hazards?.forEach((spec, i) => {
      this.addHandle({ kind: "hazard", spec, visual: hazards[i] }, false);
    });
    this.addHandle({ kind: "drain", spec: drainSpec, visual: drainVisual }, false);
  }

  private addHandle(ref: Ref, canResize: boolean) {
    const { w, h } = this.sizeOf(ref);
    const { x, y } = ref.spec as { x: number; y: number };

    const move = this.scene.add
      .rectangle(x, y, w, h, 0x4ab0ff, 0.12)
      .setStrokeStyle(1, 0x4ab0ff, 0.95)
      .setDepth(99)
      .setInteractive({ draggable: true, useHandCursor: true });

    const label = this.scene.add
      .text(x, y - h / 2 - 4, this.labelFor(ref), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9fd0ff",
      })
      .setOrigin(0.5, 1)
      .setDepth(99);

    const handle: Handle = { ref, move, label };

    move.on("drag", (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const nx = clampX(snap(dragX));
      const ny = clampY(snap(dragY));
      (ref.spec as { x: number; y: number }).x = nx;
      (ref.spec as { x: number; y: number }).y = ny;
      this.syncRef(ref);
      this.updateHandleVisual(handle);
      if (this.selected === handle) this.updateInfo();
    });
    move.on("pointerdown", () => this.select(handle));

    if (canResize && ref.kind === "platform") {
      const rx = x + w / 2;
      const ry = y + h / 2;
      const resize = this.scene.add
        .rectangle(rx, ry, 12, 12, 0xffe27a, 0.95)
        .setStrokeStyle(1, 0x000000, 0.7)
        .setDepth(99)
        .setInteractive({ draggable: true, useHandCursor: true });

      resize.on("drag", (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const nw = Math.max(10, snap((dragX - ref.spec.x) * 2));
        const nh = Math.max(6, snap((dragY - ref.spec.y) * 2));
        ref.spec.w = nw;
        ref.spec.h = nh;
        this.syncRef(ref);
        this.updateHandleVisual(handle);
        if (this.selected === handle) this.updateInfo();
      });
      resize.on("pointerdown", () => this.select(handle));
      handle.resize = resize;
    }

    this.handles.push(handle);
  }

  private sizeOf(ref: Ref): { w: number; h: number } {
    if (ref.kind === "platform") return { w: ref.spec.w, h: ref.spec.h };
    if (ref.kind === "server") return { w: 48, h: 72 };
    if (ref.kind === "hazard") {
      if (ref.spec.type === "electric") return { w: ref.spec.w, h: ref.spec.h };
      return { w: 32, h: 32 };
    }
    return { w: 56, h: 40 };
  }

  private labelFor(ref: Ref): string {
    switch (ref.kind) {
      case "platform":
        return `PLAT ${ref.spec.w}x${ref.spec.h}`;
      case "server":
        return "SERVER";
      case "hazard":
        return ref.spec.type === "electric"
          ? `ELEC ${ref.spec.w}x${ref.spec.h}`
          : `STEAM ${ref.spec.direction}`;
      case "drain":
        return "DRAIN";
    }
  }

  private updateHandleVisual(h: Handle) {
    const { x, y } = h.ref.spec as { x: number; y: number };
    const { w, h: hh } = this.sizeOf(h.ref);
    h.move.setPosition(x, y);
    h.move.setSize(w, hh);
    if (h.move.input?.hitArea) {
      (h.move.input.hitArea as Phaser.Geom.Rectangle).setTo(-w / 2, -hh / 2, w, hh);
    }
    h.label.setPosition(x, y - hh / 2 - 4);
    h.label.setText(this.labelFor(h.ref));
    if (h.resize) h.resize.setPosition(x + w / 2, y + hh / 2);
    this.applySelectionStyle(h);
  }

  private syncRef(ref: Ref) {
    if (ref.kind === "platform") {
      const rect = ref.visual;
      rect.setPosition(ref.spec.x, ref.spec.y);
      rect.setSize(ref.spec.w, ref.spec.h);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody | undefined;
      if (body) {
        body.setSize(ref.spec.w, ref.spec.h);
        body.updateFromGameObject();
      }
    } else if (ref.kind === "server") {
      ref.visual.setPosition(ref.spec.x, ref.spec.y);
    } else if (ref.kind === "hazard") {
      ref.visual.setPosition(ref.spec.x, ref.spec.y);
    } else {
      ref.visual.setPosition(ref.spec.x, ref.spec.y);
    }
  }

  private select(h: Handle | null) {
    this.selected = h;
    for (const hh of this.handles) this.applySelectionStyle(hh);
    this.updateInfo();
  }

  private applySelectionStyle(h: Handle) {
    const sel = this.selected === h;
    h.move.setStrokeStyle(sel ? 2 : 1, sel ? 0xffe27a : 0x4ab0ff, sel ? 1 : 0.95);
    h.move.setFillStyle(sel ? 0xffe27a : 0x4ab0ff, sel ? 0.18 : 0.12);
  }

  private updateInfo() {
    if (!this.selected) {
      this.info.setText(`${this.handles.length} entities  |  snap ${SNAP}px`);
      return;
    }
    const { ref } = this.selected;
    const base = `${ref.kind.toUpperCase()}  x=${(ref.spec as any).x}  y=${(ref.spec as any).y}`;
    if (ref.kind === "platform") {
      this.info.setText(`${base}  w=${ref.spec.w}  h=${ref.spec.h}`);
    } else if (ref.kind === "hazard" && ref.spec.type === "electric") {
      this.info.setText(`${base}  w=${ref.spec.w}  h=${ref.spec.h}`);
    } else if (ref.kind === "hazard" && ref.spec.type === "steam") {
      this.info.setText(`${base}  dir=${ref.spec.direction}  len=${ref.spec.length ?? 120}  wid=${ref.spec.width ?? 38}`);
    } else {
      this.info.setText(base);
    }
  }

  update(delta: number) {
    if (!this.active) return;

    if (Phaser.Input.Keyboard.JustDown(this.copyKey)) this.exportToClipboard();

    if (this.selected && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      const r = this.selected.ref;
      if (r.kind === "hazard" && r.spec.type === "steam") {
        const dirs: Array<"up" | "down" | "left" | "right"> = ["up", "right", "down", "left"];
        const i = dirs.indexOf(r.spec.direction);
        r.spec.direction = dirs[(i + 1) % dirs.length];
        this.updateInfo();
        this.showToast("steam direction changed - exit editor (F2) to rebuild", "#ffe27a");
      }
    }

    if (this.selected) {
      this.nudgeAccum += delta;
      const step = this.shiftKey.isDown ? 5 : 1;
      const repeatMs = 90;
      const doNudge = this.nudgeAccum >= repeatMs;
      const dxKey =
        (this.leftKey.isDown ? -1 : 0) + (this.rightKey.isDown ? 1 : 0);
      const dyKey =
        (this.upKey.isDown ? -1 : 0) + (this.downKey.isDown ? 1 : 0);
      if (dxKey === 0 && dyKey === 0) {
        this.nudgeAccum = 0;
      } else if (doNudge) {
        this.nudgeAccum = 0;
        const s = this.selected.ref.spec as { x: number; y: number };
        s.x = clampX(s.x + dxKey * step);
        s.y = clampY(s.y + dyKey * step);
        this.syncRef(this.selected.ref);
        this.updateHandleVisual(this.selected);
        this.updateInfo();
      }
    }
  }

  private exportToClipboard() {
    const text = this.buildLevelTS();
    navigator.clipboard
      .writeText(text)
      .then(() => this.showToast("level copied to clipboard", "#2ee66b"))
      .catch(() => {
        console.log("[LevelEditor] clipboard blocked - paste from console below:");
        console.log(text);
        this.showToast("clipboard blocked - see console", "#ff884a");
      });
  }

  private buildLevelTS(): string {
    const l = this.deps.level;
    const pad = "      ";
    const platforms = l.platforms
      .map((p) => `${pad}{ x: ${p.x}, y: ${p.y}, w: ${p.w}, h: ${p.h} },`)
      .join("\n");
    const servers = l.servers
      .map((s) => `${pad}{ x: ${s.x}, y: ${s.y} },`)
      .join("\n");
    const hazards = (l.hazards ?? [])
      .map((h) => {
        if (h.type === "electric") {
          const extras = [
            h.offMs !== undefined ? `offMs: ${h.offMs}` : null,
            h.warnMs !== undefined ? `warnMs: ${h.warnMs}` : null,
            h.activeMs !== undefined ? `activeMs: ${h.activeMs}` : null,
            h.phaseOffsetMs !== undefined ? `phaseOffsetMs: ${h.phaseOffsetMs}` : null,
          ]
            .filter(Boolean)
            .join(", ");
          return `${pad}{ type: "electric", x: ${h.x}, y: ${h.y}, w: ${h.w}, h: ${h.h}${extras ? ", " + extras : ""} },`;
        }
        const extras = [
          h.length !== undefined ? `length: ${h.length}` : null,
          h.width !== undefined ? `width: ${h.width}` : null,
          h.offMs !== undefined ? `offMs: ${h.offMs}` : null,
          h.warnMs !== undefined ? `warnMs: ${h.warnMs}` : null,
          h.activeMs !== undefined ? `activeMs: ${h.activeMs}` : null,
          h.phaseOffsetMs !== undefined ? `phaseOffsetMs: ${h.phaseOffsetMs}` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return `${pad}{ type: "steam", x: ${h.x}, y: ${h.y}, direction: "${h.direction}"${extras ? ", " + extras : ""} },`;
      })
      .join("\n");

    const d = this.deps.drainSpec;
    return [
      `// Level ${l.id} - ${l.name}`,
      `    platforms: [`,
      platforms,
      `    ],`,
      `    servers: [`,
      servers,
      `    ],`,
      `    drain: { x: ${d.x}, y: ${d.y} },`,
      l.hazards && l.hazards.length > 0 ? `    hazards: [\n${hazards}\n    ],` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private showToast(msg: string, color: string) {
    const t = this.scene.add
      .text(GAME_WIDTH / 2, 70, msg, {
        fontFamily: "monospace",
        fontSize: "14px",
        color,
        backgroundColor: "#000000aa",
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setDepth(101);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      duration: 400,
      delay: 1600,
      onComplete: () => t.destroy(),
    });
  }
}
