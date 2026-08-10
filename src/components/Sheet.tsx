"use client";

import { useEffect } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Знизу — на мобільному (bottom sheet), по центру — на десктопі.
 * Висота обмежена, вміст скролиться всередині, врахований safe-area на iPhone.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer }: Props) {
  // Замок тримаємо окремо від Escape: onClose — інлайнова стрілка, вона
  // змінюється щорендера, і замок би знімався та ставився на кожен апдейт.
  useEffect(() => {
    if (!open) return;
    lockScroll();
    return unlockScroll;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Закрити"
        onClick={onClose}
        className="scrim animate-fade-in absolute inset-0 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-in relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-ink-700 bg-ink-900 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="shrink-0 px-5 pt-3 pb-4">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-600 sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Закрити"
              className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-400 transition active:scale-90 hover:bg-ink-800 hover:text-ink-100"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>

        <div
          className="shrink-0 px-5 pt-4"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
