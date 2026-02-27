"use client";

import type { TooltipData } from "../lib/types";
import { formatPrice } from "../lib/utils";

interface TooltipProps {
  data: TooltipData | null;
  viewW: number;
  viewH: number;
}

export default function Tooltip({ data, viewW, viewH }: TooltipProps) {
  if (!data) return null;

  const { coin, x: mx, y: my } = data;
  let tx = mx + 14;
  let ty = my + 14;
  if (tx + 180 > viewW) tx = mx - 185;
  if (ty + 95 > viewH) ty = my - 100;

  return (
    <div className="tooltip show" style={{ left: tx, top: ty }}>
      <div className="tt-head">
        <span className="tt-sym">{coin.symbol}</span>
        <span className="tt-name">{coin.name}</span>
      </div>
      <div className="tt-row">
        <span className="tt-l">Price</span>
        <span className="tt-v">{formatPrice(coin.price)}</span>
      </div>
      <div className="tt-row">
        <span className="tt-l">24h</span>
        <span className="tt-v" style={{ color: coin.change >= 0 ? "#4ade80" : "#f87171" }}>
          {coin.change > 0 ? "+" : ""}
          {coin.change}%
        </span>
      </div>
      <div className="tt-row">
        <span className="tt-l">MCap</span>
        <span className="tt-v">${coin.mcapDisplay}</span>
      </div>
    </div>
  );
}
