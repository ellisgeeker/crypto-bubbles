import Matter from "matter-js";
import type { Bubble, CoinData } from "./types";
import { CONFIG } from "./types";
import { calcRadius, getBubbleColors, shuffleArray, easeOutElastic, easeInBack } from "./utils";

const { Engine, Bodies, Body, Mouse, MouseConstraint, Composite } = Matter;

// ─── Layout Constants ────────────────────────────────────────
const HEADER_H = 48;
const FOOTER_H = 34;

export { HEADER_H, FOOTER_H };

// ─── Engine Class ────────────────────────────────────────────
export class BubbleEngine {
  engine: Matter.Engine;
  bubbles: Bubble[] = [];
  hoveredBubble: Bubble | null = null;

  private walls: Matter.Body[] = [];
  private shownIndices = new Set<number>();
  private waitingQueue: number[] = [];
  private allData: CoinData[] = [];
  private maxVisible: number;
  private W = 0;
  private H = 0;
  private driftAccumulator = 0;

  constructor() {
    this.engine = Engine.create({
      gravity: CONFIG.physics.gravity,
      positionIterations: CONFIG.physics.positionIterations,
      velocityIterations: CONFIG.physics.velocityIterations,
    });
    this.maxVisible = CONFIG.maxVisible;
  }

  // ─── Setup ───────────────────────────────────────────────

  init(canvas: HTMLCanvasElement, W: number, H: number, data: CoinData[]) {
    this.W = W;
    this.H = H;
    this.allData = data;
    this.computeMaxVisible();
    this.createWalls();
    this.setupMouse(canvas);
    this.populateInitialBubbles();
  }

  private computeMaxVisible() {
    const area = this.W * (this.H - HEADER_H - FOOTER_H);
    const avgR = calcRadius(2, this.W, this.H, HEADER_H, FOOTER_H);
    const fit = Math.floor((area * 0.6) / (Math.PI * avgR * avgR));
    this.maxVisible = Math.min(65, Math.max(30, fit));
  }

  private createWalls() {
    this.walls.forEach((w) => Composite.remove(this.engine.world, w));
    const t = 80;
    const opts = { isStatic: true, restitution: 0.3, friction: 0.02 };
    this.walls = [
      Bodies.rectangle(this.W / 2, -t / 2 + HEADER_H, this.W * 2, t, opts),
      Bodies.rectangle(this.W / 2, this.H + t / 2 - FOOTER_H, this.W * 2, t, opts),
      Bodies.rectangle(-t / 2, this.H / 2, t, this.H * 2, opts),
      Bodies.rectangle(this.W + t / 2, this.H / 2, t, this.H * 2, opts),
    ];
    Composite.add(this.engine.world, this.walls);
  }

  private setupMouse(canvas: HTMLCanvasElement) {
    const mouse = Mouse.create(canvas);
    mouse.pixelRatio = window.devicePixelRatio || 1;
    const mc = MouseConstraint.create(this.engine, {
      mouse,
      constraint: { stiffness: 0.06, damping: 0.1, render: { visible: false } },
    });
    Composite.add(this.engine.world, mc);
  }

  // ─── Bubble Lifecycle ────────────────────────────────────

  private findOpenPosition(radius: number): { x: number; y: number } {
    const usableH = this.H - HEADER_H - FOOTER_H;
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = radius + 5 + Math.random() * (this.W - radius * 2 - 10);
      const y = HEADER_H + radius + 5 + Math.random() * (usableH - radius * 2 - 10);

      const hasOverlap = this.bubbles.some((b) => {
        if (b.state === "gone") return false;
        const p = b.body.position;
        const dx = x - p.x;
        const dy = y - p.y;
        const minDist = radius + b.radius + 4;
        return dx * dx + dy * dy < minDist * minDist;
      });

      if (!hasOverlap) return { x, y };
    }
    // Fallback: random position
    return {
      x: radius + Math.random() * (this.W - radius * 2),
      y: HEADER_H + radius + Math.random() * (this.H - HEADER_H - FOOTER_H - radius * 2),
    };
  }

  private addBubble(dataIdx: number, delay: number = 0) {
    const coin = this.allData[dataIdx];
    const radius = calcRadius(coin.mcapNum, this.W, this.H, HEADER_H, FOOTER_H);
    const pos = this.findOpenPosition(radius);

    const body = Bodies.circle(pos.x, pos.y, radius, CONFIG.body);
    Composite.add(this.engine.world, body);

    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
    });

    const bubble: Bubble = {
      body,
      radius,
      coin,
      dataIdx,
      colors: getBubbleColors(coin.change),
      glowPhase: Math.random() * Math.PI * 2,
      drift: {
        angle: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0007,
        strength: 0.5 + Math.random(),
      },
      state: "appearing",
      animStart: performance.now() + delay,
      visualScale: 0,
    };

    this.bubbles.push(bubble);
    this.shownIndices.add(dataIdx);
  }

  private populateInitialBubbles() {
    const count = Math.min(this.maxVisible, this.allData.length);
    const topN = Math.min(CONFIG.permanentCount, count);

    // Always show top coins first
    for (let i = 0; i < topN; i++) {
      this.addBubble(i, i * 25 + Math.random() * 40);
    }

    // Fill remaining from shuffled lower-ranked coins
    const rest = shuffleArray(
      Array.from({ length: this.allData.length - topN }, (_, i) => i + topN)
    );
    const extraCount = count - topN;
    for (let i = 0; i < extraCount && i < rest.length; i++) {
      this.addBubble(rest[i], (topN + i) * 18 + Math.random() * 60);
    }

    this.waitingQueue = rest.slice(extraCount);
  }

  // ─── Rotation ────────────────────────────────────────────

  rotate() {
    if (this.waitingQueue.length === 0) return;

    const swappable = shuffleArray(
      this.bubbles.filter(
        (b) => b.state === "idle" && b.dataIdx >= CONFIG.permanentCount && this.hoveredBubble !== b
      )
    );
    if (swappable.length === 0) return;

    const count = Math.min(
      CONFIG.rotationBatchMin + Math.floor(Math.random() * (CONFIG.rotationBatchMax - CONFIG.rotationBatchMin + 1)),
      swappable.length,
      this.waitingQueue.length
    );

    for (let i = 0; i < count; i++) {
      swappable[i].state = "disappearing";
      swappable[i].animStart = performance.now();
    }
  }

  // ─── Per-frame Update ────────────────────────────────────

  update(now: number, dt: number) {
    Engine.update(this.engine, 1000 / 60);
    this.updateAnimations(now);
    this.applyDrift(dt);
  }

  private updateAnimations(now: number) {
    const toRemove: Bubble[] = [];

    for (const b of this.bubbles) {
      if (b.state === "appearing") {
        const elapsed = now - b.animStart;
        if (elapsed < 0) {
          b.visualScale = 0;
        } else {
          const t = Math.min(elapsed / CONFIG.appearDuration, 1);
          b.visualScale = easeOutElastic(t);
          if (t >= 1) {
            b.visualScale = 1;
            b.state = "idle";
          }
        }
      } else if (b.state === "disappearing") {
        const t = Math.min((now - b.animStart) / CONFIG.disappearDuration, 1);
        b.visualScale = Math.max(0, 1 - easeInBack(t));
        if (t >= 1) {
          b.state = "gone";
          b.visualScale = 0;
          toRemove.push(b);
        }
      }
    }

    // Cleanup dead bubbles & spawn replacements at NEW random positions
    for (const b of toRemove) {
      Composite.remove(this.engine.world, b.body);
      this.shownIndices.delete(b.dataIdx);
      const idx = this.bubbles.indexOf(b);
      if (idx >= 0) this.bubbles.splice(idx, 1);

      // Spawn replacement from queue at a random position (not the old spot)
      if (this.waitingQueue.length > 0) {
        const newIdx = this.waitingQueue.shift()!;
        this.addBubble(newIdx, 150 + Math.random() * 300);
      }

      // Recycle non-permanent coins back to queue
      if (b.dataIdx >= CONFIG.permanentCount) {
        this.waitingQueue.push(b.dataIdx);
      }
    }
  }

  private applyDrift(dt: number) {
    this.driftAccumulator += dt;
    if (this.driftAccumulator < CONFIG.drift.intervalMs) return;
    this.driftAccumulator = 0;

    const { forceMultiplier, maxSpeed, damping, intervalMs } = CONFIG.drift;

    for (const b of this.bubbles) {
      if (b.state === "gone") continue;
      b.drift.angle += b.drift.speed * intervalMs;

      const f = forceMultiplier * b.radius * b.drift.strength;
      Body.applyForce(b.body, b.body.position, {
        x: Math.cos(b.drift.angle) * f,
        y: Math.sin(b.drift.angle) * f,
      });

      const v = b.body.velocity;
      if (Math.sqrt(v.x * v.x + v.y * v.y) > maxSpeed) {
        Body.setVelocity(b.body, { x: v.x * damping, y: v.y * damping });
      }
    }
  }

  // ─── Hover Detection ─────────────────────────────────────

  updateHover(mx: number, my: number): Bubble | null {
    this.hoveredBubble = null;
    for (const b of this.bubbles) {
      if (b.state === "gone" || b.visualScale < 0.5) continue;
      const p = b.body.position;
      const dx = mx - p.x;
      const dy = my - p.y;
      const hr = b.radius * b.visualScale;
      if (dx * dx + dy * dy < hr * hr) {
        this.hoveredBubble = b;
        break;
      }
    }
    return this.hoveredBubble;
  }

  clearHover() {
    this.hoveredBubble = null;
  }

  // ─── Data Refresh ────────────────────────────────────────

  refreshData(data: CoinData[]) {
    this.allData = data;
    for (const b of this.bubbles) {
      if (b.state === "gone") continue;
      b.coin = data[b.dataIdx];
      b.colors = getBubbleColors(b.coin.change);
      Body.applyForce(b.body, b.body.position, {
        x: (Math.random() - 0.5) * 0.012,
        y: (Math.random() - 0.5) * 0.01,
      });
    }
  }

  // ─── Resize ──────────────────────────────────────────────

  resize(W: number, H: number) {
    this.W = W;
    this.H = H;
    this.createWalls();
    this.computeMaxVisible();
  }

  // ─── Visible bubbles (sorted for rendering) ──────────────

  getVisibleBubbles(): Bubble[] {
    return this.bubbles
      .filter((b) => b.state !== "gone" && b.visualScale > 0.01)
      .sort((a, b) => b.radius - a.radius);
  }
}
