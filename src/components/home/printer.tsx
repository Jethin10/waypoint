"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useId } from "react";
import { clamp, map } from "@/lib/noise";

// A pill-segment display face: each glyph is 9 rows; every run of "#" becomes one rounded bar.
const GLYPHS: Record<string, string[]> = {
  W: ["##   ##", "##   ##", "##   ##", "##   ##", "## # ##", "## # ##", "#######", "### ###", "##   ##"],
  A: ["  ###  ", " ## ## ", "##   ##", "##   ##", "#######", "##   ##", "##   ##", "##   ##", "##   ##"],
  Y: ["##   ##", "##   ##", " ## ## ", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  "],
  P: ["###### ", "##   ##", "##   ##", "##   ##", "###### ", "##     ", "##     ", "##     ", "##     "],
  O: [" ##### ", "##   ##", "##   ##", "##   ##", "##   ##", "##   ##", "##   ##", "##   ##", " ##### "],
  I: ["####", " ## ", " ## ", " ## ", " ## ", " ## ", " ## ", " ## ", "####"],
  N: ["##   ##", "###  ##", "###  ##", "## # ##", "## # ##", "## # ##", "##  ###", "##  ###", "##   ##"],
  T: ["#######", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  ", "  ###  "],
  "0": [" ##### ", "##   ##", "##  ###", "## # ##", "## # ##", "## # ##", "###  ##", "##   ##", " ##### "],
  "1": ["   ##  ", "  ###  ", " ####  ", "   ##  ", "   ##  ", "   ##  ", "   ##  ", "   ##  ", " ######"],
  "2": [" ##### ", "##   ##", "     ##", "     ##", "    ## ", "   ##  ", "  ##   ", " ##    ", "#######"],
  "3": [" ##### ", "##   ##", "     ##", "     ##", "  #### ", "     ##", "     ##", "##   ##", " ##### "],
  "4": ["##   ##", "##   ##", "##   ##", "##   ##", "#######", "     ##", "     ##", "     ##", "     ##"],
  "5": ["#######", "##     ", "##     ", "###### ", "     ##", "     ##", "     ##", "##   ##", " ##### "],
  "6": [" ##### ", "##   ##", "##     ", "##     ", "###### ", "##   ##", "##   ##", "##   ##", " ##### "],
  "7": ["#######", "     ##", "     ##", "    ## ", "   ##  ", "  ##   ", "  ##   ", "  ##   ", "  ##   "],
  "8": [" ##### ", "##   ##", "##   ##", "##   ##", " ##### ", "##   ##", "##   ##", "##   ##", " ##### "],
  "9": [" ##### ", "##   ##", "##   ##", "##   ##", " ######", "     ##", "     ##", "##   ##", " ##### "],
  "/": ["      #", "     ##", "    ## ", "   ##  ", "  ##   ", " ##    ", "##     ", "#      ", "       "],
};

const U = 26; // unit width
const PITCH = 46.5; // row pitch
const H = 30; // bar height
const SPACE = 2; // letter spacing in units

function layout(word: string) {
  const bars: { x: number; y: number; w: number }[] = [];
  let cx = 0;
  for (const ch of word) {
    const g = GLYPHS[ch];
    if (!g) {
      cx += 4;
      continue;
    }
    g.forEach((row, r) => {
      for (const m of row.matchAll(/#+/g)) bars.push({ x: (cx + (m.index ?? 0)) * U, y: r * PITCH, w: m[0].length * U });
    });
    cx += g[0].length + SPACE;
  }
  const width = (cx - SPACE) * U;
  return { bars, width, height: 8 * PITCH + H };
}

function Line({ i, rows, width, progress }: { i: number; rows: number; width: number; progress: MotionValue<number> }) {
  const start = i / rows;
  const end = (i + 1) / rows;
  // Map this row's window to -1..0, then snap to 5% steps for the "printing" feel.
  const x = useTransform(progress, (p) => Math.round(clamp(map(p, start, end, -1, 0), -1, 0) / 0.05) * 0.05 * width);
  return <motion.rect className="line" x={0} y={i * PITCH} width={width} height={H} style={{ x }} />;
}

export function Printer({ word = "WAYPOINT", progress, label, className = "" }: { word?: string; progress: MotionValue<number>; label?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const { bars, width, height } = layout(word);
  return (
    <div className={`lp-printer ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? word}>
        <mask id={`m${id}`} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          {bars.map((b, k) => (
            <rect key={k} x={b.x} y={b.y} width={b.w} height={H} rx={H / 2} fill="white" />
          ))}
        </mask>
        <g mask={`url(#m${id})`}>
          {Array.from({ length: 9 }, (_, i) => (
            <Line key={i} i={i} rows={9} width={width} progress={progress} />
          ))}
        </g>
      </svg>
    </div>
  );
}
