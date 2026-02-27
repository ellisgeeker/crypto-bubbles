"use client";

import { TIME_PERIODS, type TimePeriod } from "../lib/types";

interface HeaderProps {
  activePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export default function Header({ activePeriod, onPeriodChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon" />
        CRYPTO BUBBLES
      </div>
      <div className="header-controls">
        <div className="time-filters">
          {TIME_PERIODS.map(({ key, label }) => (
            <button
              key={key}
              className={`time-btn ${activePeriod === key ? "active" : ""}`}
              onClick={() => onPeriodChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="range-badge">1 - 100</span>
      </div>
    </header>
  );
}
