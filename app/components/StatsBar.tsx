"use client";

import type { CoinData } from "../lib/types";

interface StatsBarProps {
  data: CoinData[];
}

export default function StatsBar({ data }: StatsBarProps) {
  const up = data.filter((c) => c.change > 0).length;
  const down = data.length - up;

  return (
    <div className="stats-bar">
      <div className="si">
        <div className="sd g" />
        <span>{up}</span> 上涨
      </div>
      <div className="si">
        <div className="sd r" />
        <span>{down}</span> 下跌
      </div>
      <div className="si">
        共 <span>{data.length}</span> 个币种
      </div>
    </div>
  );
}
