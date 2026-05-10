import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Two fonts — one serif for the brand/header, one sans for body.
// Loaded via next/font for automatic self-hosting and zero CLS.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Syloline — Digital Art Portfolio",
  description: "Selected works by Syloline.",
  openGraph: {
    title: "Syloline — Digital Art Portfolio",
    description: "Selected works by Syloline.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans bg-bg text-text">{children}</body>
    </html>
  );
}
