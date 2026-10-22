import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are self-hosted (latin subsets of the upstream variable fonts) so that
// `next build` never has to reach fonts.googleapis.com / fonts.gstatic.com.
// `next/font/google` downloads at build time, and the build fails hard when
// that download does not resolve, which made CI depend on network luck.
const display = localFont({
  src: [
    {
      path: "./fonts/space-grotesk-latin-variable.woff2",
      weight: "300 700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const body = localFont({
  src: [
    {
      path: "./fonts/inter-latin-variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const SITE = "https://aurora-lens-ruddy.vercel.app";
const TITLE = "AuroraLens — Live Solar-Storm Ops Globe for Humans & Agents";
const DESCRIPTION =
  "Real-time NOAA space weather + USGS seismic feeds on a 3D planet, a deterministic storm-risk engine with hash-chained audit seals, and an MCP agent interface. Zero API keys.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "space weather",
    "solar storm",
    "aurora forecast",
    "Kp index",
    "NOAA SWPC",
    "USGS earthquakes",
    "MCP server",
    "AI agents",
    "geomagnetic storm",
    "3D globe",
    "Next.js",
  ],
  authors: [{ name: "aniruddhaadak80" }],
  creator: "aniruddhaadak80",
  metadataBase: new URL(SITE),
  openGraph: {
    type: "website",
    url: SITE,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "AuroraLens",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="noise min-h-full antialiased">{children}</body>
    </html>
  );
}
