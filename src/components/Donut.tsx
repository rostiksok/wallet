"use client";

import { useLayoutEffect, useRef } from "react";
import type { Slice } from "@/lib/compute";

const SIZE = 180;
const R = 68;
const STROKE = 24;
const C = 2 * Math.PI * R;
const GAP = 2; // проміжок між сегментами, у px по дузі
/**
 * Внутрішній діаметр кільця (112px) мінус запас: отвір круглий, тому верхній
 * і нижній рядки мають менше місця, ніж центральний.
 */
const HOLE = 2 * (R - STROKE / 2) - 12;
/** Нижче цього масштабу текст уже нечитабельний — краще дати вилізти. */
const MIN_SCALE = 0.62;

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
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-ink-700)"
          strokeWidth={STROKE}
        />

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

      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <FitToHole>{center}</FitToHole>
      </div>
    </div>
  );
}

/**
 * Підсумок буває довгим («19 519,6 USD»), а отвір кільця — фіксовані 104px,
 * тому текст вилазив на сегменти. Міряємо реальну ширину рядка й, якщо треба,
 * дотискаємо його масштабом — так підпис лишається в один рядок за будь-якої суми.
 *
 * useLayoutEffect безпечний: page.tsx малює діаграму лише після читання
 * localStorage, тобто на сервері цей компонент не рендериться.
 */
function FitToHole({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.transform = "scale(1)";
      const width = el.getBoundingClientRect().width;
      const scale = width > HOLE ? Math.max(HOLE / width, MIN_SCALE) : 1;
      el.style.transform = `scale(${scale})`;
    };

    fit();
    // Поки не підвантажився шрифт, ширина міряється по фолбеку — і промахується.
    document.fonts?.ready.then(fit).catch(() => {});
  });

  return (
    <div style={{ width: HOLE }}>
      <div ref={ref} className="inline-block origin-center will-change-transform">
        {children}
      </div>
    </div>
  );
}
