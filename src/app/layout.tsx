import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Waypoint — a GPS for learning",
  description: "Stop collecting roadmaps. Waypoint plots your route from real job demand, checks you actually learned it, and recalculates when life happens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="grain min-h-dvh overflow-x-hidden" style={{ fontFamily: "\"Helvetica Neue\", Helvetica, Arial, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
