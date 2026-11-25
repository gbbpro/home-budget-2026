import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Home Budget", description: "Our household budget and home projects" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#276749" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
