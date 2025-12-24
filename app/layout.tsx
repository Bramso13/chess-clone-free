import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chess Training - Entraînement aux échecs",
    template: "%s | Chess Training",
  },
  description:
    "Plateforme d'entraînement aux échecs moderne. Pratiquez les ouvertures, affrontez Stockfish, résolvez des problèmes tactiques et améliorez votre jeu.",
  keywords: [
    "échecs",
    "chess",
    "entraînement",
    "training",
    "ouvertures",
    "tactiques",
    "stockfish",
    "puzzles",
    "apprendre échecs",
  ],
  authors: [{ name: "Chess Training" }],
  creator: "Chess Training",
  publisher: "Chess Training",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: "Chess Training",
    title: "Chess Training - Entraînement aux échecs",
    description:
      "Plateforme d'entraînement aux échecs moderne. Pratiquez les ouvertures, affrontez Stockfish, résolvez des problèmes tactiques.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Training - Entraînement aux échecs",
    description:
      "Plateforme d'entraînement aux échecs moderne. Pratiquez les ouvertures, affrontez Stockfish, résolvez des problèmes tactiques.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
