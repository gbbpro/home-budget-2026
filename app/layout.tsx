import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Home Budget", description: "Our household budget and home projects" };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#276749" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

// Runs before the page paints so there's no flash of the wrong theme.
// "theme" in localStorage is "light", "dark", or missing (follow the device).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased">{children}</body>
    </html>
  );
}
