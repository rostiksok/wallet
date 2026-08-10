import type { MetadataRoute } from "next";

/**
 * Робить сайт встановлюваним: Android/Chrome пропонує «Install app»,
 * а з display: standalone додаток відкривається без адресного рядка.
 * На iOS те саме дає «Поділитись → На екран Домівки» + appleWebApp у layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Wallet — мої активи",
    short_name: "Wallet",
    description: "Підсумок усіх заощаджень по категоріях і валютах",
    lang: "uk",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07090f",
    theme_color: "#07090f",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
