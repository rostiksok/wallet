"use client";

import { useRef, useState } from "react";
import Sheet from "./Sheet";
import { exportState, importState } from "@/lib/storage";
import { THEME_OPTIONS, useTheme } from "@/lib/theme";
import type { WalletState } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  state: WalletState;
  onReplace: (state: WalletState) => void;
  onReset: () => void;
};

export default function SettingsSheet({ open, onClose, state, onReplace, onReset }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const theme = useTheme();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      onReplace(await importState(file));
      setError(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося прочитати файл");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Налаштування"
      subtitle="Дані зберігаються тільки у цьому браузері"
      footer={
        <button
          onClick={onClose}
          className="h-13 w-full rounded-2xl bg-ink-800 font-semibold transition active:scale-[0.97]"
        >
          Закрити
        </button>
      }
    >
      <div className="space-y-3 pb-2">
        <div className="rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4">
          <p className="font-medium">Тема</p>
          <p className="mt-0.5 text-sm text-ink-400">Світла, темна або як у системі</p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Тема">
            {THEME_OPTIONS.map((option) => {
              const active = theme.ready && theme.mode === option.value;
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => theme.setMode(option.value)}
                  className={`h-11 rounded-xl border text-sm transition active:scale-95 ${
                    active
                      ? "border-ink-100 bg-ink-100 font-medium text-ink-950"
                      : "border-ink-700 bg-ink-900 text-ink-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <Row
          title="Експорт у файл"
          hint={`${state.assets.length} активів, ${state.categories.length} категорій`}
          onClick={() => exportState(state)}
        />
        <Row
          title="Імпорт з файлу"
          hint="Замінить поточні дані резервною копією"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        <button
          onClick={() => (confirmReset ? (onReset(), onClose()) : setConfirmReset(true))}
          className={`w-full rounded-2xl px-4 py-4 text-left transition active:scale-[0.98] ${
            confirmReset ? "bg-danger text-ink-950" : "border border-ink-700"
          }`}
        >
          <p className="font-medium">{confirmReset ? "Натисни ще раз — все зникне" : "Очистити все"}</p>
          <p className={`mt-0.5 text-sm ${confirmReset ? "text-ink-950/70" : "text-ink-400"}`}>
            Видалить усі активи й історію без відновлення
          </p>
        </button>

        <p className="px-1 pt-2 text-sm leading-relaxed text-ink-400">
          Нічого не йде на сервер. Якщо почистиш дані сайту — дані зникнуть, тому час від часу
          роби експорт.
        </p>
      </div>
    </Sheet>
  );
}

function Row({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4 text-left transition active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="truncate text-sm text-ink-400">{hint}</p>
      </div>
      <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
