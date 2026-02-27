import type { Bubble } from "./types";
import { CONFIG } from "./types";
import { HEADER_H, FOOTER_H } from "./BubbleEngine";

// ─── Main Renderer ───────────────────────────────────────────

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bubbles: Bubble[],
  hoveredBubble: Bubble | null,
  now: number
) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H);
  drawGrid(ctx, W, H);
  for (const b of bubbles) {
    drawBubble(ctx, b, hoveredBubble === b, now);
  }
}

// ─── Background ──────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  bg.addColorStop(0, "#111120");
  bg.addColorStop(1, "#0d0d14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.012)";
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = step; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, HEADER_H);
    ctx.lineTo(x, H - FOOTER_H);
    ctx.stroke();
  }
  for (let y = HEADER_H + step; y < H - FOOTER_H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

// ─── Single Bubble ───────────────────────────────────────────

function drawBubble(
  ctx: CanvasRenderingContext2D,
  b: Bubble,
  isHovered: boolean,
  now: number
) {
  const vs = b.visualScale;
  if (vs < 0.02) return;

  const { x, y } = b.body.position;
  const r = b.radius * vs;
  const { change } = b.coin;
  const absChange = Math.abs(change);
  const isGreen = change >= 0;
  const c = b.colors;

  ctx.save();
  ctx.translate(x, y);

  // ── Outer glow ──
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.0007 + b.glowPhase);
  const glowR = r * (1.12 + pulse * 0.05);
  const glowGrad = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, glowR);
  glowGrad.addColorStop(0, c.glow);
  glowGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = (isHovered ? 1.3 : 0.7) * (0.5 + pulse * 0.12);
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Base dark fill ──
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = isGreen ? "rgba(10,18,12,0.94)" : "rgba(20,10,10,0.94)";
  ctx.fill();

  // ── Color tint (bright center → dark edges) ──
  drawColorTint(ctx, r, absChange, isGreen);

  // ── Inner shadow ──
  drawInnerShadow(ctx, r);

  // ── Border ──
  drawBorder(ctx, r, c.border, isHovered);

  // ── Glass highlight ──
  drawGlassHighlight(ctx, r);

  // ── Text ──
  drawText(ctx, b, r, c.text);

  ctx.restore();
}

// ─── Sub-draw helpers ────────────────────────────────────────

function drawColorTint(ctx: CanvasRenderingContext2D, r: number, absChange: number, isGreen: boolean) {
  const i = Math.min(absChange / 3.5, 1);
  const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);

  if (isGreen) {
    tg.addColorStop(0, `rgba(${35 + i * 55},${85 + i * 110},${35 + i * 45},${0.28 + i * 0.38})`);
    tg.addColorStop(0.5, `rgba(${22 + i * 30},${55 + i * 65},${22 + i * 28},${0.16 + i * 0.2})`);
    tg.addColorStop(0.8, `rgba(${12 + i * 12},${28 + i * 22},${12 + i * 10},${0.06 + i * 0.08})`);
    tg.addColorStop(1, "rgba(5,10,5,0.01)");
  } else {
    tg.addColorStop(0, `rgba(${85 + i * 130},${18 + i * 28},${18 + i * 28},${0.28 + i * 0.45})`);
    tg.addColorStop(0.5, `rgba(${55 + i * 75},${12 + i * 16},${12 + i * 16},${0.16 + i * 0.2})`);
    tg.addColorStop(0.8, `rgba(${22 + i * 28},${6 + i * 7},${6 + i * 7},${0.06 + i * 0.08})`);
    tg.addColorStop(1, "rgba(8,3,3,0.01)");
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = tg;
  ctx.fill();
}

function drawInnerShadow(ctx: CanvasRenderingContext2D, r: number) {
  const sg = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r);
  sg.addColorStop(0, "rgba(0,0,0,0)");
  sg.addColorStop(0.55, "rgba(0,0,0,0)");
  sg.addColorStop(0.78, "rgba(0,0,0,0.12)");
  sg.addColorStop(0.9, "rgba(0,0,0,0.3)");
  sg.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = sg;
  ctx.fill();
}

function drawBorder(ctx: CanvasRenderingContext2D, r: number, borderColor: string, isHovered: boolean) {
  const baseWidth = Math.max(1.2, r * 0.022);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  if (isHovered) {
    ctx.strokeStyle = CONFIG.hoverBorderColor;
    ctx.lineWidth = baseWidth + CONFIG.hoverBorderWidth;
  } else {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = baseWidth;
  }
  ctx.stroke();
}

function drawGlassHighlight(ctx: CanvasRenderingContext2D, r: number) {
  const hl = ctx.createRadialGradient(-r * 0.22, -r * 0.28, 0, -r * 0.1, -r * 0.12, r * 0.65);
  hl.addColorStop(0, "rgba(255,255,255,0.05)");
  hl.addColorStop(0.4, "rgba(255,255,255,0.012)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawText(ctx: CanvasRenderingContext2D, b: Bubble, r: number, textColor: string) {
  const { change } = b.coin;
  const sign = change > 0 ? "+" : "";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 3;

  if (r >= 30) {
    // Large: symbol + change
    const symSize = Math.min(r * 0.36, 24);
    const chgSize = Math.min(r * 0.24, 16);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${symSize}px 'Space Grotesk',sans-serif`;
    ctx.fillText(b.coin.symbol, 0, -chgSize * 0.4);
    ctx.fillStyle = textColor;
    ctx.font = `600 ${chgSize}px 'Space Grotesk',sans-serif`;
    ctx.fillText(`${sign}${change}%`, 0, symSize * 0.44);
  } else if (r >= 18) {
    // Medium
    const symSize = Math.max(8, r * 0.44);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${symSize}px 'Space Grotesk',sans-serif`;
    ctx.fillText(b.coin.symbol, 0, r > 24 ? -symSize * 0.22 : 0);
    if (r > 24) {
      const chgSize = Math.max(6, r * 0.28);
      ctx.fillStyle = textColor;
      ctx.font = `600 ${chgSize}px 'Space Grotesk',sans-serif`;
      ctx.fillText(`${sign}${change}%`, 0, symSize * 0.5);
    }
  } else {
    // Tiny
    const symSize = Math.max(6, r * 0.52);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `600 ${symSize}px 'Space Grotesk',sans-serif`;
    ctx.fillText(b.coin.symbol.slice(0, 4), 0, 0);
  }

  ctx.shadowBlur = 0;
}
