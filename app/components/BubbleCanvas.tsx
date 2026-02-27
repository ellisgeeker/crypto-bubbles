"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { BubbleEngine } from "../lib/BubbleEngine";
import { renderFrame } from "../lib/BubbleRenderer";
import { generateCoinData } from "../lib/utils";
import { CONFIG, TIME_PERIODS, type TimePeriod, type TooltipData, type CoinData } from "../lib/types";
import Header from "./Header";
import Tooltip from "./Tooltip";
import StatsBar from "./StatsBar";

export default function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BubbleEngine | null>(null);
  const rafRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("day");
  const [coinData, setCoinData] = useState<CoinData[]>([]);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // ─── Initialize engine ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    setDimensions({ w: W, h: H });

    const initialData = generateCoinData(4);
    setCoinData(initialData);

    const engine = new BubbleEngine();
    engine.init(canvas, W, H, initialData);
    engineRef.current = engine;

    // Rotation timer
    const rotationTimer = setInterval(() => engine.rotate(), CONFIG.rotationIntervalMs);

    // Animation loop
    const loop = (now: number) => {
      const dt = Math.min(now - prevTimeRef.current, 50);
      prevTimeRef.current = now;

      engine.update(now, dt);

      // Re-acquire context for HiDPI
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderFrame(ctx, W, H, engine.getVisibleBubbles(), engine.hoveredBubble, now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(rotationTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Resize handler ─────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const dpr = window.devicePixelRatio || 1;
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      setDimensions({ w: W, h: H });
      engine.resize(W, H);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Mouse hover ────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const hovered = engine.updateHover(e.clientX, e.clientY);
    if (hovered) {
      setTooltip({ coin: hovered.coin, x: e.clientX, y: e.clientY });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    engineRef.current?.clearHover();
    setTooltip(null);
  }, []);

  // ─── Period change ──────────────────────────────────────
  const handlePeriodChange = useCallback((period: TimePeriod) => {
    setActivePeriod(period);
    const range = TIME_PERIODS.find((p) => p.key === period)?.range ?? 4;
    const newData = generateCoinData(range);
    setCoinData(newData);
    engineRef.current?.refreshData(newData);
  }, []);

  return (
    <>
      <Header activePeriod={activePeriod} onPeriodChange={handlePeriodChange} />

      <canvas
        ref={canvasRef}
        id="bubbleCanvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <Tooltip data={tooltip} viewW={dimensions.w} viewH={dimensions.h} />
      <StatsBar data={coinData} />
    </>
  );
}
