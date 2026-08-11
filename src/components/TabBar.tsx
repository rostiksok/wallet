"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Активи",
    icon: (
      <>
        <path d="M3 8.5A2.5 2.5 0 015.5 6H18a2 2 0 012 2v9a2 2 0 01-2 2H5.5A2.5 2.5 0 013 16.5v-8z" />
        <path d="M3 8.5V7a2 2 0 012-2h10.5" strokeLinecap="round" />
        <circle cx="16.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/tax",
    label: "Податки",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2.5" />
        <path d="M8.5 7.5h7" strokeLinecap="round" />
        <path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" strokeLinecap="round" />
      </>
    ),
  },
];

/**
 * Плаваюча «пігулка» знизу по центру: на телефоні лягає над home indicator,
 * на десктопі лишається там само — розділів усього два, окреме бічне меню зайве.
 */
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Розділи"
      className="fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex gap-1 rounded-full border border-ink-700 bg-ink-900/85 p-1.5 shadow-lg shadow-black/30 backdrop-blur-xl">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-2 rounded-full px-4 text-[15px] transition active:scale-95 ${
                active ? "bg-ink-100 font-medium text-ink-950" : "text-ink-300"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                {tab.icon}
              </svg>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
