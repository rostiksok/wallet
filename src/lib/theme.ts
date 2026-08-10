"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type Resolved = "light" | "dark";

export const THEME_KEY = "wallet.theme.v1";

/** Колір адресного рядка / статус-бару під кожну тему (== --color-ink-950). */
export const THEME_COLOR: Record<Resolved, string> = {
  dark: "#07090f",
  light: "#f4f6fb",
};

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Системна" },
  { value: "light", label: "Світла" },
  { value: "dark", label: "Темна" },
];

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function systemTheme(): Resolved {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function readMode(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
  } catch {
    return "system";
  }
}

export function resolveMode(mode: ThemeMode): Resolved {
  return mode === "system" ? systemTheme() : mode;
}

/** Єдине місце, де тема реально потрапляє в DOM. */
export function applyTheme(mode: ThemeMode): Resolved {
  const resolved = resolveMode(mode);
  document.documentElement.dataset.theme = resolved;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[resolved];

  return resolved;
}

/**
 * Той самий код, але як рядок для інлайн-скрипта в <body>: він має відпрацювати
 * ДО першого малювання, інакше на секунду блимне темна тема поверх світлої.
 * Тому ж тут немає themeColor у viewport-експорті — meta створює цей скрипт,
 * щоб не було двох тегів з різними значеннями.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var m=localStorage.getItem(${JSON.stringify(THEME_KEY)});
if(m!=="light"&&m!=="dark")m="system";
var d=m==="dark"||(m==="system"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);
document.documentElement.dataset.theme=d?"dark":"light";
var t=document.querySelector('meta[name="theme-color"]');
if(!t){t=document.createElement("meta");t.name="theme-color";document.head.appendChild(t);}
t.content=d?${JSON.stringify(THEME_COLOR.dark)}:${JSON.stringify(THEME_COLOR.light)};
}catch(e){}})();`;

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  // Читаємо після монтування: на сервері localStorage немає, а до гідрації
  // потрібну тему вже поставив THEME_INIT_SCRIPT.
  useEffect(() => {
    setModeState(readMode());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(mode);
  }, [mode, ready]);

  // «Системна» має відгукуватись на перемикання теми в самій ОС.
  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Приватний режим Safari — тема просто не переживе перезавантаження.
    }
    setModeState(next);
  }, []);

  return { mode, setMode, ready };
}
