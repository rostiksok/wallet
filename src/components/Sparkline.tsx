"use client";

import type { Snapshot } from "@/lib/types";

const W = 300;
const H = 56;

export default function Sparkline({ history }: { history: Snapshot[] }) {
  const points = history.slice(-60);
  if (points.length < 2) return null;

  const values = points.map((p) => p.totalUsd);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    // 4px відступ згори й знизу, щоб лінія не липла до країв
    const y = H - 4 - ((p.totalUsd - min) / span) * (H - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const up = values[values.length - 1] >= values[0];
  const stroke = up ? "#4ade80" : "#fb7185";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${coords.join(" ")} ${W},${H}`} fill="url(#spark-fill)" />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
