import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ReactLenis } from "lenis/react";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClientForge · Leads ➔ Conversion",
  description: "ClientForge — High-converting local business scraping, auditing, ranking, website building, and cold outreach engine.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-lime-400 selection:text-slate-950">
        <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
          {children}
        </ReactLenis>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
