"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { PALETTE } from "@/lib/defaults";
import { plural } from "@/lib/format";
import { newId } from "@/lib/useWallet";
import type { Category, CategoryKind } from "@/lib/types";

const KINDS: { value: CategoryKind; label: string }[] = [
  { value: "bank", label: "Банк" },
  { value: "crypto", label: "Крипта" },
  { value: "cash", label: "Готівка" },
  { value: "invest", label: "Інвестиції" },
  { value: "other", label: "Інше" },
];

const EMOJI = ["🏦", "🐱", "💳", "💵", "💰", "₿", "🅑", "⬦", "📈", "🏠", "🚗", "📦", "🎯", "🪙"];

type Props = {
  open: boolean;
  onClose: () => void;
  /** null — створення нової категорії. */
  category: Category | null;
  categories: Category[];
  assetCount: number;
  onSave: (category: Category) => void;
  onDelete: (id: string) => void;
};

export default function CategorySheet({
  open,
  onClose,
  category,
  categories,
  assetCount,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Форма наповнюється при кожному відкритті — інакше в ній лишиться попередня категорія.
  useEffect(() => {
    if (!open) return;
    setDraft(
      category ?? {
        id: newId(),
        name: "",
        kind: "bank",
        color: PALETTE[categories.length % PALETTE.length],
        emoji: "🏦",
      },
    );
    setConfirmDelete(false);
  }, [open, category, categories.length]);

  if (!draft) return null;

  const isNew = category === null;
  const canSave = draft.name.trim().length > 0;
  const canDelete = !isNew && categories.length > 1;

  function submit() {
    if (!draft || !canSave) return;
    onSave({ ...draft, name: draft.name.trim() });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? "Нова категорія" : draft.name || "Категорія"}
      subtitle={
        isNew
          ? "Банк, біржа, готівка — будь-яке місце зберігання"
          : `${assetCount} ${plural(assetCount, "актив", "активи", "активів")}`
      }
      footer={
        <div className="flex gap-3">
          {canDelete && (
            <button
              onClick={() => (confirmDelete ? (onDelete(draft.id), onClose()) : setConfirmDelete(true))}
              className={`h-13 shrink-0 rounded-2xl px-5 font-medium transition active:scale-[0.97] ${
                confirmDelete ? "bg-danger text-ink-950" : "border border-ink-700 text-danger"
              }`}
            >
              {confirmDelete ? "Точно?" : "Видалити"}
            </button>
          )}
          <button
            onClick={submit}
            disabled={!canSave}
            className="h-13 flex-1 rounded-2xl bg-accent font-semibold text-ink-950 transition active:scale-[0.97] disabled:opacity-30"
          >
            Зберегти
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        {canDelete && assetCount > 0 && (
          <p className="rounded-2xl bg-ink-850 px-4 py-3 text-sm leading-relaxed text-ink-400">
            Якщо видалити категорію, її активи переїдуть до іншої — з підсумку вони не зникнуть.
          </p>
        )}

        <div>
          <div className="flex items-center gap-3">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl"
              style={{ background: `${draft.color}1f` }}
            >
              {draft.emoji}
            </span>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Монобанк, Binance…"
              autoComplete="off"
              className="h-14 min-w-0 flex-1 rounded-2xl border border-ink-700 bg-ink-850 px-4 outline-none placeholder:text-ink-600 focus:border-accent/60"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-medium text-ink-400">Тип</p>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setDraft({ ...draft, kind: k.value })}
                className={`h-11 rounded-xl border px-3.5 text-[15px] transition active:scale-95 ${
                  draft.kind === k.value
                    ? "border-accent bg-accent/10 font-medium text-accent"
                    : "border-ink-700 bg-ink-850 text-ink-300"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-medium text-ink-400">Іконка</p>
          <div className="grid grid-cols-7 gap-2">
            {EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => setDraft({ ...draft, emoji: e })}
                className={`grid aspect-square place-items-center rounded-xl border text-xl transition active:scale-90 ${
                  draft.emoji === e ? "border-accent bg-accent/10" : "border-ink-700 bg-ink-850"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-medium text-ink-400">Колір</p>
          <div className="grid grid-cols-7 gap-2">
            {PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => setDraft({ ...draft, color })}
                aria-label={`Колір ${color}`}
                className={`grid aspect-square place-items-center rounded-xl transition active:scale-90 ${
                  draft.color === color ? "ring-2 ring-ink-100 ring-offset-2 ring-offset-ink-900" : ""
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
