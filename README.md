# Crypto Bubbles

[English] | [中文](README.zh.md)

A physics-based cryptocurrency visualization built with Next.js 15, React 19, and Matter.js. Coins are rendered as floating bubbles sized by market cap, colored by price change.

## Getting Started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customizing Colors

All bubble colors are driven by two files.

### 1. Main color palette — `app/lib/utils.ts`

The `getBubbleColors(change)` function is the single source of truth for bubble colors. Edit it to retheme everything at once.

```ts
export function getBubbleColors(change: number): BubbleColors {
  const intensity = Math.min(Math.abs(change) / 3.5, 1); // 0 → 1 as change grows

  if (change >= 0) {
    return {
      border: `rgba(34, 160, 50, ${0.5 + intensity * 0.5})`, // green border
      glow: `rgba(34, 197, 94, ${0.05 + intensity * 0.2})`, // green outer glow
      text: "#4ade80", // green % text
    };
  }
  return {
    border: `rgba(160, 25, 25, ${0.5 + intensity * 0.5})`, // red border
    glow: `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`, // red outer glow
    text: "#f87171", // red % text
  };
}
```

| Property | Controls                                           |
| -------- | -------------------------------------------------- |
| `border` | Bubble ring — intensifies with larger price swings |
| `glow`   | Soft halo around each bubble                       |
| `text`   | Color of the `+2.4%` label inside the bubble       |

### 2. Inner gradient tint — `app/lib/BubbleRenderer.ts`

`drawColorTint()` controls the radial fill inside each bubble. To change the base hue, update the first `addColorStop`:

```ts
// Green bubble center color: adjust the R, G, B numbers
tg.addColorStop(0, `rgba(35, 85, 35, ${0.28 + i * 0.38})`);

// Red bubble center color
tg.addColorStop(0, `rgba(85, 18, 18, ${0.28 + i * 0.45})`);
```

### 3. Other color references

| File                        | Location                  | Controls                                           |
| --------------------------- | ------------------------- | -------------------------------------------------- |
| `app/lib/BubbleRenderer.ts` | `drawBackground()`        | Canvas background gradient (`#111120` → `#0d0d14`) |
| `app/lib/BubbleRenderer.ts` | `drawBubble()` fillStyle  | Dark base fill of each bubble                      |
| `app/lib/types.ts`          | `CONFIG.hoverBorderColor` | Border color when hovering a bubble                |
