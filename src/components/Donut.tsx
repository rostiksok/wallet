"use client";

import type { Slice } from "@/lib/compute";

const SIZE = 180;
const R = 68;
const STROKE = 24;
const C = 2 * Math.PI * R;
const GAP = 2; // проміжок між сегментами, у px по дузі

type Props = {
  slices: Slice[];
  activeKey: string | null;
  onSelect: (key: string | null) => void;
  center: React.ReactNode;
};

export default function Donut({ slices, activeKey, onSelect, center }: Props) {
  const visible = slices.filter((s) => s.usd > 0);
  let offset = 0;

  return (
    <div className="relative mx-auto aspect-square w-[180px] shrink-0">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#212736" strokeWidth={STROKE} />

        {visible.map((slice) => {
          const len = (slice.share / 100) * C;
          const dash = Math.max(len - (visible.length > 1 ? GAP : 0), 0.5);
          const dimmed = activeKey !== null && activeKey !== slice.key;
          const el = (
            <circle
              key={slice.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={slice.color}
              strokeWidth={activeKey === slice.key ? STROKE + 5 : STROKE}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              opacity={dimmed ? 0.25 : 1}
              className="cursor-pointer transition-all duration-300"
              onClick={() => onSelect(activeKey === slice.key ? null : slice.key)}
            />
          );
          offset += len;
          return el;
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
        {center}
      </div>
    </div>
  );
}
