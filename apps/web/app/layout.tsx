import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Placeholder for the poster's rounded geometric sans-serif until the brand font name arrives (decision 2).
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MYai", template: "%s · MYai" },
  description: "MYai: the AI assistant that speaks English, Bahasa Melayu, Chinese and Tamil. Proudly Malaysian.",
};

export const viewport: Viewport = {
  themeColor: "#010416",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
