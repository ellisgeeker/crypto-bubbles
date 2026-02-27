import type { BubbleColors, CoinData } from "./types";
import { COINS, type CoinMeta } from "../data/coins";
import { CONFIG } from "./types";

// ─── Easing ──────────────────────────────────────────────────

/** Elastic overshoot — used for bubble pop-in */
export function easeOutElastic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/** Accelerating pull-back — used for bubble shrink-out */
export function easeInBack(t: number): number {
  const c = 1.70158;
  return (c + 1) * t * t * t - c * t * t;
}

// ─── Colors ──────────────────────────────────────────────────

export function getBubbleColors(change: number): BubbleColors {
  const abs = Math.abs(change);
  const intensity = Math.min(abs / 3.5, 1);

  if (change >= 0) {
    return {
      border: `rgba(${34 + intensity * 40},${160 + intensity * 80},${50 + intensity * 35},${0.5 + intensity * 0.5})`,
      glow: `rgba(34,197,94,${0.05 + intensity * 0.2})`,
      text: "#4ade80",
    };
  }
  return {
    border: `rgba(${160 + intensity * 80},${25 + intensity * 30},${25 + intensity * 30},${0.5 + intensity * 0.5})`,
    glow: `rgba(239,68,68,${0.05 + intensity * 0.2})`,
    text: "#f87171",
  };
}

// ─── Radius ──────────────────────────────────────────────────

const LOG_MAX = Math.log(1921); // BTC mcap
const LOG_MIN = Math.log(0.3); // smallest coin

/** Map market cap → pixel radius using log scale */
export function calcRadius(mcap: number, viewW: number, viewH: number, headerH: number, footerH: number): number {
  const t = (Math.log(mcap + 1) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  const maxR = Math.min(viewW, viewH - headerH - footerH) * CONFIG.radius.maxViewportFraction;
  return CONFIG.radius.minPx + (maxR - CONFIG.radius.minPx) * Math.pow(t, 0.7);
}

// ─── Data Generation ─────────────────────────────────────────

/** Generate random change% for all coins with realistic distribution */
export function generateCoinData(range: number = 4): CoinData[] {
  return COINS.map((c: CoinMeta) => {
    const r = Math.random();
    let change: number;
    if (r < 0.1) {
      // 10% big movers
      change = (2 + Math.random() * (range - 2)) * (Math.random() > 0.5 ? 1 : -1);
    } else if (r < 0.3) {
      // 20% medium
      change = (0.8 + Math.random() * 1.2) * (Math.random() > 0.5 ? 1 : -1);
    } else {
      // 70% small
      change = (0.1 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
    }
    return { ...c, change: parseFloat(change.toFixed(1)) };
  });
}

// ─── Formatting ──────────────────────────────────────────────

export function formatPrice(p: number): string {
  if (p >= 1) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(8);
}

// ─── Array Helpers ───────────────────────────────────────────

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
