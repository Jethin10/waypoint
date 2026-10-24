"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type { Plan, PlanNode } from "@/lib/types";
import { EASE } from "../ui/motion";

const ROW = 128;
const CHAPTER_GAP = 150;

interface Placed {
  node: PlanNode;
  x: number; // 0..100 (% of width)
  y: number; // px
  index: number;
  chapterStart: boolean;
}

function placeNodes(plan: Plan): { placed: Placed[]; height: number } {
  const placed: Placed[] = [];
  let y = 40;
  let lastChapter = -1;
  plan.nodes.forEach((node, i) => {
    const chapterStart = node.chapter !== lastChapter;
    if (chapterStart) y += CHAPTER_GAP;
    lastChapter = node.chapter;
    const x = 50 + Math.sin(i * 0.85) * 26;
    placed.push({ node, x, y, index: i, chapterStart });
    y += ROW;
  });
  return { placed, height: y + 80 };
}

function pathThrough(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  let d = `M ${points[0].x * 10} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x * 10} ${my}, ${b.x * 10} ${my}, ${b.x * 10} ${b.y}`;
  }
  return d;
}

function Orb({ node, index }: { node: PlanNode; index: number }) {
 const state = node.kind === "review" ? "review" : node.status;
 return <span className={`route-node ${state}`}>{node.status === "done" ? "\u2713" : node.status === "mastered" ? "Known" : node.kind === "review" ? "\u21bb" : node.status === "current" ? "\u2605" : index + 1}</span>;
}

export function RouteMap({ plan, onOpen }: { plan: Plan; onOpen: (n: PlanNode) => void }) {
  const { placed, height } = useMemo(() => placeNodes(plan), [plan]);
  const currentIdx = placed.findIndex((p) => p.node.status === "current");
  const reached = currentIdx < 0 ? placed : placed.slice(0, currentIdx + 1);
  const full = pathThrough(placed);
  const done = pathThrough(reached);
  const current = currentIdx >= 0 ? placed[currentIdx] : null;
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!current || !wrap.current) return;
    const top = wrap.current.getBoundingClientRect().top + window.scrollY + current.y - window.innerHeight * 0.4;
    window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [current?.node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrap} className="route-map relative w-full" style={{ height }}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden>
        <path d={full} fill="none" stroke="#d7d7ce" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <motion.path key={done} d={done} fill="none" stroke="#0000ff" strokeWidth="3" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE }} />
      </svg>

      {placed
        .filter((p) => p.chapterStart)
        .map((p) => {
          const ch = plan.chapters[p.node.chapter];
          return (
            <motion.div
              key={`ch-${p.node.chapter}`}
              layout
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="route-chapter absolute left-0 right-0 px-1"
              style={{ top: p.y - CHAPTER_GAP + 20 }}
            >
              <p className="label">Chapter {String(p.node.chapter + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-[clamp(2rem,4.5vw,4rem)] leading-[0.9] tracking-[-0.02em] text-cream/90">{ch?.title}</h3>
              {ch?.why && <p className="mt-2 max-w-lg font-mono text-sm text-muted">{ch.why}</p>}
            </motion.div>
          );
        })}

      <AnimatePresence initial={false}>
        {placed.map((p) => {
          const n = p.node;
          const right = p.x < 50;
          const size = n.status === "current" ? 70 : n.kind === "review" ? 56 : 60;
          return (
            <motion.button
              key={n.id}
              layout
              onClick={() => onOpen(n)}
              initial={false}
              animate={{ opacity: 1, scale: 1, left: `${p.x}%`, top: p.y }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 text-left"
              aria-label={`${n.title}, ${n.status}`}
            >
              <span className="block transition-transform duration-500 group-hover:scale-110" style={{ width: size, height: size }}>
                <Orb node={n} index={p.index} />
              </span>
              <span className={`pointer-events-none absolute top-1/2 w-[min(42vw,340px)] -translate-y-1/2 ${right ? "left-full pl-5" : "right-full pr-5 text-right"}`}>
                <span className={`block text-lg leading-tight md:text-xl ${n.status === "upcoming" ? "text-cream/60" : "text-cream"} group-hover:text-cream`}>{n.title}</span>
                <span className="mt-1 block font-mono text-[11px] uppercase tracking-wide text-faint">
                  {n.status === "mastered" ? "Skipped · you know this" : n.status === "done" ? `Proved · ${n.score ?? "✓"}` : `${n.minutes} min · day ${n.day + 1}`}
                  {n.demand >= 0.15 && n.status !== "mastered" && <span className="ml-2 text-cream/70">· {Math.round(n.demand * 100)}% of jobs</span>}
                </span>
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {current && (
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          animate={{ left: `${current.x}%`, top: current.y - 54 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <span className="whitespace-nowrap rounded-[0.15rem] bg-cream px-2 py-1 font-mono text-[11px] uppercase text-ink">Your next win</span>
        </motion.div>
      )}
    </div>
  );
}
