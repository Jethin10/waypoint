"use client";

import { useScroll, type MotionValue } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { clamp, map, noise3 } from "@/lib/noise";
import { useProgress } from "./hooks";
import { SectionTitle, Subtitle } from "./section-title";

const COLUMNS = [
  [
    "Learning paths shape careers, confidence, opportunity, and time. A roadmap is no longer a document you download once, but a condition you move through every day with incomplete information. Most roadmaps ignore this. They are static lists, identical for everyone, indifferent to what you already know and blind to what employers actually ask for.",
    "The aim is not to collect more tutorials or to revive the fantasy of a perfect course. The aim is to engage learning as it actually happens: interrupted, uneven, personal, and incomplete. Complexity is neither avoided nor simplified away. It is ordered, measured, and made navigable.",
    "Waypoint prioritizes routes over resources. It produces direction, pacing, and feedback rather than another pile of links. The result is not a finished curriculum, but a position on a path that keeps moving with you.",
    "This approach is not defined by subject or medium. It is defined by method. A learner is treated as a system with state: what they know, what they can prove, and how much time they really have."
  ],
  [
    "In Waypoint, the route defines the work. Learning is directed toward a sequence of stops that unfold over weeks rather than a single sitting. What is authored is an order of operations and dependencies, not a final state.",
    "Routes unfold through dependency and iteration. Each stop exists because the stop before it made it possible, and each one shapes what follows. Change is not an exception applied afterward; it is a property of the route.",
    "Miss a concept and the route inserts a detour. Lose a week and the route recalculates, trimming what employers ask for least so the deadline still holds.",
    "No plan is treated as final. Any route is a temporary configuration shaped by your time, your goal, and what you prove you know. It is observed, adjusted, and redrawn, never simply completed."
  ],
  [
    "Proof provides the structure. A checkmark says you watched something. An explanation shows you understood it, and only understanding moves you forward.",
    "At every stop you explain the idea back in your own words, out loud or in writing. Claude reads it the way a good teacher would, naming what you nailed, what you missed, and the one question that tests the weakest part.",
    "Gaps are not failures. They are input. Each one bends the route toward the exact concept you still need, and nothing you already know is taught twice.",
    "Calibration comes first. Thirty seconds of honest answers removes everything you can already use, so the route begins where you actually are rather than where a syllabus assumes you start.",
    "Rules stay legible. Every detour, every trimmed topic, and every rescheduled day can be traced back to a reason you can see."
  ],
  [
    "Demand functions as material. We read thousands of live job postings so the route spends your hours where the roles are, and spends less where nobody is hiring.",
    "Data is not treated as neutral. Postings are collected from public Greenhouse and Lever boards, matched to topics, and dated, so you always know what the signal is and how old it is.",
    "Topics come from roadmap.sh, ordered and curated by a community of engineers who have walked these routes before. Their resources are the starting point at every stop.",
    "The two meet in a single number that moves while you learn: how many real roles you would qualify for today. Everything else is in service of making that number go up, honestly, one proven stop at a time."
  ]
];

// Same parameters as the reference "fluid" manifesto: each character cell is sampled from a
// position displaced by a curl-noise field; rows far from the moving threshold smear the most.
const STEP = 15;
const FREQ = 10 * 0.001;

interface Col {
  src: HTMLCanvasElement;
  out: HTMLCanvasElement;
  cols: number;
  rows: number;
  cw: number;
  ch: number;
  dpr: number;
}

function buildColumn(p: HTMLParagraphElement, out: HTMLCanvasElement): Col | null {
  const cs = getComputedStyle(p);
  const fontSize = parseFloat(cs.fontSize);
  const lh = parseFloat(cs.lineHeight) || fontSize * 1.2;
  const font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
  // Break into the exact lines the browser laid out.
  const lines: string[] = [];
  const range = document.createRange();
  let brs = 0;
  for (const node of Array.from(p.childNodes)) {
    if (node.nodeName === "BR") {
      if (++brs === 2) {
        lines.push("");
        brs = 0;
      }
      continue;
    }
    brs = 0;
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = node.textContent ?? "";
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
      range.setStart(node, start);
      range.setEnd(node, i);
      if (range.getClientRects().length > 1) {
        const line = text.slice(start, i - 1).replace(/[\n\t]/g, "");
        if (line.trim()) lines.push(line);
        start = i - 1;
      }
    }
    const tail = text.slice(start).replace(/[\n\t]/g, "");
    if (tail.trim()) lines.push(tail);
  }
  if (!lines.length) return null;
  const cols = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const rows = lines.length;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const cw = measure.measureText("M").width;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cols * cw;
  const H = rows * lh;
  const src = document.createElement("canvas");
  for (const c of [src, out]) {
    c.width = W * dpr;
    c.height = H * dpr;
  }
  out.style.width = `${W}px`;
  out.style.height = `${H}px`;
  const sctx = src.getContext("2d")!;
  sctx.scale(dpr, dpr);
  sctx.font = font;
  sctx.fillStyle = cs.color;
  sctx.textBaseline = "top";
  lines.forEach((l, r) => {
    const padded = l.padEnd(cols, " ");
    for (let c = 0; c < padded.length; c++) sctx.fillText(padded[c], c * cw, r * lh);
  });
  return { src, out, cols, rows, cw, ch: lh, dpr };
}

function Fluid({ paragraphs, progress, index }: { paragraphs: string[]; progress: MotionValue<number>; index: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const p = para.current;
    const out = canvas.current;
    const el = wrap.current;
    if (!p || !out || !el) return;
    let col: Col | null = null;
    let builtFor = -1;
    let disposed = false;
    // Rebuild only when the column width actually changes (avoids resize feedback loops).
    const setup = () => {
      const w = Math.round(p.clientWidth);
      if (w === builtFor || w === 0) return;
      builtFor = w;
      col = buildColumn(p, out);
      el.classList.toggle("fluid-ready", col !== null);
    };
    setup();
    document.fonts.ready.then(() => {
      if (disposed) return;
      builtFor = -1;
      setup();
    });
    const ro = new ResizeObserver(setup);
    ro.observe(p);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let threshold = 0;
    let raf = 0;
    let last = performance.now();
    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      if (!col) return;
      const box = el.getBoundingClientRect();
      if (box.bottom < -100 || box.top > window.innerHeight + 100) return;
      const dt = Math.min(0.1, (time - last) / 1000);
      last = time;
      // gradient "sine": progress mapped .25 → .75, eased over ~2s (quickTo power3.out).
      const target = reduced ? 1 : clamp(map(progress.get(), 0.25, 0.75, 0, 1), 0, 1);
      threshold += (target - threshold) * (1 - Math.exp(-dt * 2.2));
      const { src, out: o, cols, rows, cw, ch, dpr } = col;
      const ctx = o.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, o.width, o.height);
      const t = time * 1e-4;
      const scrollRow = window.scrollY * 0.05;
      const offset = index * cols;
      for (let r = 0; r < rows; r++) {
        const b = rows > 1 ? r / (rows - 1) : 0;
        const amt = reduced ? 0 : Math.abs(threshold - b) ** 1.5;
        const disp = STEP * amt;
        const ky = (r + scrollRow) * FREQ;
        for (let c = 0; c < cols; c++) {
          let dx = 0;
          let dy = 0;
          if (disp > 0.01) {
            const n = noise3((c + offset) * FREQ, ky, t);
            const a = Math.PI * 2 * n;
            dx = Math.round(Math.cos(a) * disp);
            dy = Math.round(Math.sin(a) * disp);
          }
          const sr = clamp(r + dy, 0, rows - 1);
          const sc = clamp(c + dx, 0, cols - 1);
          ctx.drawImage(src, sc * cw * dpr, sr * ch * dpr, cw * dpr, ch * dpr, c * cw * dpr, r * ch * dpr, cw * dpr, ch * dpr);
        }
      }
    };
    raf = requestAnimationFrame(render);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.classList.remove("fluid-ready");
    };
  }, [progress, index]);

  return (
    <div className="col" ref={wrap}>
      <p ref={para} className="src" aria-hidden="true">
        {paragraphs.map((t, i) => (
          <Fragment key={i}>
            {t}
            {i < paragraphs.length - 1 && (
              <>
                <br />
                <br />
              </>
            )}
          </Fragment>
        ))}
      </p>
      <canvas ref={canvas} aria-hidden />
      <span className="sr-only">{paragraphs.join(" ")}</span>
    </div>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const texts = useRef<HTMLDivElement>(null);
  const progress = useProgress(ref);
  // The dissolve runs from "top center" to "bottom center" of the text block.
  const { scrollYProgress: textProgress } = useScroll({ target: texts, offset: ["start center", "end center"] });
  return (
    <div className="lp-manifesto theme--light" id="manifesto" ref={ref}>
      <SectionTitle
        variant="t-manifesto"
        words={["Learning-", "Driven", "Route", "Engine", "Between", "Ambition", "&", "Jobs"]}
        progress={progress}
        link={
          <Link href="/start" className="btn">
            (Plot Yours)
          </Link>
        }
      />
      <div className="texts" ref={texts}>
        {COLUMNS.map((c, i) => (
          <Fluid key={i} index={i} paragraphs={c} progress={textProgress} />
        ))}
      </div>
      <Subtitle text="On Learning As A Route Not A List" />
    </div>
  );
}
