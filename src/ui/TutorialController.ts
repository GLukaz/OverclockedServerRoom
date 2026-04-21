import * as Phaser from "phaser";

const STORAGE_KEY = "osr.tutorial.v1";

type LessonId = "vent" | "flush" | "drain";

interface LessonState {
  pressure: number;
  bursting: boolean;
}

interface Lesson {
  id: LessonId;
  message: string;
  color: string;
  shouldShow: (s: LessonState, done: Record<LessonId, boolean>) => boolean;
}

const LESSONS: Lesson[] = [
  {
    id: "drain",
    message:
      "OVERPRESSURE!\nHold [F] at the DRAIN VALVE\n(bottom-left) to release.",
    color: "#ff884a",
    shouldShow: (s, d) => !d.drain && s.bursting,
  },
  {
    id: "flush",
    message:
      "Hold [Q] near a server to FLUSH —\nspends 20 PRESSURE for a deep cool.",
    color: "#4ab0ff",
    shouldShow: (s, d) => !d.flush && d.vent && s.pressure >= 20,
  },
  {
    id: "vent",
    message:
      "Press [E] near a server to VENT —\ncools nearby servers + builds PRESSURE.",
    color: "#2ee66b",
    shouldShow: (s, d) => !d.vent,
  },
];

export class TutorialController {
  static isAllComplete(): boolean {
    const done = TutorialController.loadDone();
    return done.vent && done.flush && done.drain;
  }

  private text: Phaser.GameObjects.Text;
  private done: Record<LessonId, boolean>;
  private currentLessonId: LessonId | null = null;

  constructor(private scene: Phaser.Scene) {
    this.done = TutorialController.loadDone();
    this.text = scene.add
      .text(scene.scale.width / 2, scene.scale.height / 2 - 80, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffe27a",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(28)
      .setAlpha(0);
  }

  notifyVent() {
    this.complete("vent");
  }
  notifyFlush() {
    this.complete("flush");
  }
  notifyDrain() {
    this.complete("drain");
  }

  update(state: LessonState) {
    if (this.allDone()) {
      if (this.currentLessonId) this.hide();
      return;
    }
    const lesson = LESSONS.find((l) => l.shouldShow(state, this.done));
    const nextId = lesson?.id ?? null;
    if (nextId === this.currentLessonId) return;
    if (lesson) this.show(lesson);
    else this.hide();
  }

  destroy() {
    this.text.destroy();
  }

  private complete(id: LessonId) {
    if (this.done[id]) return;
    this.done[id] = true;
    this.save();
    if (this.currentLessonId === id) this.hide();
  }

  private show(lesson: Lesson) {
    this.currentLessonId = lesson.id;
    this.text.setText(lesson.message);
    this.text.setColor(lesson.color);
    this.scene.tweens.killTweensOf(this.text);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 1,
      duration: 280,
    });
  }

  private hide() {
    this.currentLessonId = null;
    this.scene.tweens.killTweensOf(this.text);
    this.scene.tweens.add({
      targets: this.text,
      alpha: 0,
      duration: 280,
    });
  }

  private allDone() {
    return this.done.vent && this.done.flush && this.done.drain;
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.done));
    } catch {
      /* ignore */
    }
  }

  private static loadDone(): Record<LessonId, boolean> {
    const fallback = { vent: false, flush: false, drain: false };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<Record<LessonId, boolean>>;
      return {
        vent: !!parsed.vent,
        flush: !!parsed.flush,
        drain: !!parsed.drain,
      };
    } catch {
      return fallback;
    }
  }
}
