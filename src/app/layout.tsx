import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Boot } from "@/components/Boot";
import { Nav } from "@/components/Nav";
import { ScrollRestoration } from "@/components/ScrollRestoration";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "一盏茶 · A Cup's Time",
  description:
    "A cup's time — a quiet gongfu tea timer, steep by steep.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "一盏茶",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1813" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const THEME_SCRIPT = `
try {
  var s = JSON.parse(localStorage.getItem("gongfu.settings") || "{}");
  var t = s.theme || "system";
  var dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${fraunces.variable} ${nunito.variable}`}>
        <Boot />
        <ScrollRestoration />
        <div
          id="app-shell"
          className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-24 pt-4 sm:px-6 sm:pt-8 md:pb-8 md:pt-10"
        >
          <main className="flex-1">{children}</main>
        </div>
        <Nav />
      </body>
    </html>
  );
}
