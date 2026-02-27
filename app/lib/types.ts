import type { CoinMeta } from "../data/coins";

// ─── Types ───────────────────────────────────────────────────
export interface CoinData extends CoinMeta {
  change: number;
}

export type BubbleState = "appearing" | "idle" | "disappearing" | "gone";

export interface Bubble {
  body: Matter.Body;
  radius: number;
  coin: CoinData;
  dataIdx: number;
  colors: BubbleColors;
  glowPhase: number;
  drift: { angle: number; speed: number; strength: number };
  state: BubbleState;
  animStart: number;
  visualScale: number;
}

export interface BubbleColors {
  border: string;
  glow: string;
  text: string;
}

export interface TooltipData {
  coin: CoinData;
  x: number;
  y: number;
}

// ─── Configuration ───────────────────────────────────────────
export const CONFIG = {
  /** Top N coins by mcap — always visible, never rotated out */
  permanentCount: 30,

  /** Max bubbles visible at once (auto-adjusted to screen) */
  maxVisible: 55,

  /** Rotation: swap interval & batch size */
  rotationIntervalMs: 5000,
  rotationBatchMin: 2,
  rotationBatchMax: 4,

  /** Animation durations (ms) — slower for smoother feel */
  appearDuration: 900,
  disappearDuration: 700,

  /** Physics */
  physics: {
    gravity: { x: 0, y: 0 },
    positionIterations: 14,
    velocityIterations: 10,
  },
  body: {
    restitution: 0.4,
    friction: 0.0005,
    frictionAir: 0.02,
    density: 0.001,
    slop: 0.02,
  },

  /** Drift: gentle floating force applied every tick */
  drift: {
    intervalMs: 60,
    forceMultiplier: 0.0000055,
    maxSpeed: 1.0,
    damping: 0.96,
  },

  /** Radius bounds (relative to viewport) */
  radius: {
    minPx: 13,
    maxViewportFraction: 0.1,
  },

  /** Visual */
  hoverBorderWidth: 1.2,
  hoverBorderColor: "rgba(255,255,255,0.75)",
} as const;

// ─── Time period config ──────────────────────────────────────
export type TimePeriod = "hour" | "day" | "week" | "month" | "year";

export const TIME_PERIODS: { key: TimePeriod; label: string; range: number }[] = [
  { key: "hour", label: "小时", range: 2 },
  { key: "day", label: "天", range: 4 },
  { key: "week", label: "周", range: 8 },
  { key: "month", label: "月", range: 15 },
  { key: "year", label: "年", range: 30 },
];
