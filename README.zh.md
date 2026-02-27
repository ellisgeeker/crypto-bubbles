# 加密货币气泡图

[English](README.md) | [中文]

基于物理引擎的加密货币可视化项目，使用 Next.js 15、React 19 和 Matter.js 构建。气泡大小代表市值，颜色代表涨跌幅。

## 快速启动

```bash
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 自定义颜色

气泡颜色由两个文件控制。

### 1. 主色配置 — `app/lib/utils.ts`

`getBubbleColors(change)` 是颜色的唯一入口，修改这里可以一次性更换整体配色。

```ts
export function getBubbleColors(change: number): BubbleColors {
  const intensity = Math.min(Math.abs(change) / 3.5, 1); // 涨跌幅越大，intensity 越接近 1

  if (change >= 0) {
    return {
      border: `rgba(34, 160, 50, ${0.5 + intensity * 0.5})`, // 绿色边框
      glow:   `rgba(34, 197, 94, ${0.05 + intensity * 0.2})`, // 绿色外发光
      text:   "#4ade80",                                       // 绿色涨跌幅文字
    };
  }
  return {
    border: `rgba(160, 25, 25, ${0.5 + intensity * 0.5})`,   // 红色边框
    glow:   `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,   // 红色外发光
    text:   "#f87171",                                         // 红色涨跌幅文字
  };
}
```

| 属性     | 说明                         |
| -------- | ---------------------------- |
| `border` | 气泡边框，涨跌幅越大颜色越深 |
| `glow`   | 气泡周围的柔光光晕           |
| `text`   | 气泡内涨跌幅文字的颜色       |

### 2. 内部渐变 — `app/lib/BubbleRenderer.ts`

`drawColorTint()` 控制气泡内部的径向填充色。修改第一个 `addColorStop` 可以调整气泡中心的主色调：

```ts
// 绿色气泡中心色：调整 R、G、B 数值
tg.addColorStop(0, `rgba(35, 85, 35, ${0.28 + i * 0.38})`);

// 红色气泡中心色
tg.addColorStop(0, `rgba(85, 18, 18, ${0.28 + i * 0.45})`);
```

### 3. 其他颜色位置速查

| 文件                        | 位置                      | 控制内容                                |
| --------------------------- | ------------------------- | --------------------------------------- |
| `app/lib/BubbleRenderer.ts` | `drawBackground()`        | 画布背景渐变色（`#111120` → `#0d0d14`） |
| `app/lib/BubbleRenderer.ts` | `drawBubble()` fillStyle  | 每个气泡的深色底填充                    |
| `app/lib/types.ts`          | `CONFIG.hoverBorderColor` | 鼠标悬停时的气泡边框颜色                |
