import type { Metadata, Viewport } from "next";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallet — мої активи",
  description: "Підсумок усіх заощаджень по категоріях і валютах",
  applicationName: "Wallet",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Wallet" },
  // З appleWebApp Next віддає лише сучасний mobile-web-app-capable. Safari до
  // iOS 16.4 знає тільки цей префіксований варіант — без нього з домашнього
  // екрана відкривалася б звичайна вкладка з панеллю знизу.
  other: { "apple-mobile-web-app-capable": "yes" },
  // Home-screen іконка не має показувати «сторінку в браузері».
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  // themeColor свідомо не тут: meta[name=theme-color] створює й оновлює
  // THEME_INIT_SCRIPT, інакше при ручному виборі теми було б два теги.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        {/*
          Перший вузол body: виконується до того, як браузер намалює вміст,
          тому світла тема не блимає темною. У <head> його класти не можна —
          root layout не має містити ручних head-тегів.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
