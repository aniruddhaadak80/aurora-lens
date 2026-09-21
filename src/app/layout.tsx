import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const SITE = "https://aurora-lens.vercel.app";
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
