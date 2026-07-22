import type { Metadata } from "next";
import { Inter, Calistoga, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const calistoga = Calistoga({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.dizopulse.in"),

  title: {
    default: "Lead→Launch | AI Client Acquisition Workspace",
    template: "%s | Lead→Launch",
  },

  description:
    "Lead→Launch helps agencies and freelancers scrape leads, audit websites, improve SEO, build websites, and automate outreach from one AI-powered workspace.",

  keywords: [
    "Lead Generation",
    "Lead Scraper",
    "Google Maps Leads",
    "Website Audit",
    "SEO Tool",
    "AI Lead Generation",
    "Client Acquisition",
    "Agency CRM",
    "Outreach Automation",
    "Web Development",
  ],

  authors: [
    {
      name: "Dizo Pulse",
    },
  ],

  creator: "Dizo Pulse",
  publisher: "Dizo Pulse",

  verification: {
    google: "_-O8F8uSo1wVkjLruF-TtHK3NVcXCIVQAqiV7GMY5Ac",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Lead→Launch | AI Client Acquisition Workspace",
    description:
      "Scrape leads, audit websites, improve SEO, build websites and automate outreach from one dashboard.",
    url: "https://app.dizopulse.in",
    siteName: "Lead→Launch",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lead→Launch",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Lead→Launch | AI Client Acquisition Workspace",
    description:
      "AI-powered client acquisition workspace for agencies and freelancers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${calistoga.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
