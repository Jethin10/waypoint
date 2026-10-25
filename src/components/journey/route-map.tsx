"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Mascot } from "@/components/app/shell";
import type { Plan, PlanNode } from "@/lib/types";
import { PROPS } from "./scenery";

/** Chapter colours: flat trail-sign tones (orange, teal, moss, mustard). */
export const UNIT = [
  { u: "#e8692a", ud: "#b94d17", u2: "#e8692a" },
  { u: "#2f8a80", ud: "#226860", u2: "#2f8a80" },
  { u: "#6f9a45", ud: "#527633", u2: "#6f9a45" },
  { u: "#c98f22", ud: "#9c6d14", u2: "#c98f22" },
];
export const unitStyle = (chapter: number) => {
  const c = UNIT[chapter % UNIT.length];
  return { "--u": c.u, "--ud": c.ud, "--u2": c.u2 } as React.CSSProperties;
};

const OFFSETS = [0, 46, 74, 46, 0, -46, -74, -46];
const ROW = 124;
const TOP = 56;
export const XP_PER_STOP = 15;

function nodeIcon(n: PlanNode) {
  if (n.kind === "review" && n.status !== "done") return Icon.redo();
  if (n.status === "done") return Icon.check();
  if (n.status === "mastered") return Icon.crown();
  if (n.status === "current") return Icon.star();
  return Icon.lock();
}

/** Smooth vertical S-curve through every stop, in px relative to the path's centre line. */
function road(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  }
  return d;
}

function Popover({ n, index, total, onOpen }: { n: PlanNode; index: number; total: number; onOpen: () => void }) {
  const review = n.kind === "review" && n.status !== "done";
  const conf = review
    ? { cls: "pop", style: { "--pc": "#e2483d" }, meta: `Detour · ${n.minutes} min · fixes what you missed`, cta: "Start detour", btn: "#b3312a" }
    : n.status === "current"
      ? { cls: "pop", style: {}, meta: `Stop ${index + 1} of ${total} · ${n.minutes} min`, cta: `Start +${XP_PER_STOP} XP`, btn: undefined }
      : n.status === "done"
        ? { cls: "pop", style: {}, meta: `Proved${n.score ? ` with ${n.score}/100` : ""}. Nice work.`, cta: "Review", btn: undefined }
        : n.status === "mastered"
          ? { cls: "pop", style: { "--pc": "#e9b949", color: "#3d2c00" }, meta: "You already know this, so it's skipped.", cta: "Take a look", btn: "#8a6510" }
          : { cls: "pop locked", style: {}, meta: `Day ${n.day + 1} · ${n.minutes} min${n.demand >= 0.1 ? ` · in ${Math.round(n.demand * 100)}% of jobs` : ""}`, cta: "Jump ahead", btn: undefined };
  return (
    <motion.div
      className={conf.cls}
      style={conf.style as React.CSSProperties}
      initial={{ opacity: 0, y: -6, scale: 0.92, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, y: -6, scale: 0.95, x: "-50%" }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
    >
      <h4>{n.title.replace(/^Detour · /, "")}</h4>
      <p>{conf.meta}</p>
      <button className="dbtn white" style={conf.btn ? ({ "--u": conf.btn } as React.CSSProperties) : undefined} onClick={onOpen}>
        {conf.cta}
      </button>
    </motion.div>
  );
}

function Ring({ value }: { value: number }) {
  const C = 2 * Math.PI * 44;
  return (
    <svg className="node-ring" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="8" />
      <motion.circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="var(--u)"
        strokeWidth="8"
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        initial={false}
        animate={{ strokeDasharray: `${Math.max(0.001, value) * C} ${C}` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
    </svg>
  );
}

export function RouteMap({ plan, onOpen, tip }: { plan: Plan; onOpen: (n: PlanNode) => void; tip?: string }) {
  const [pop, setPop] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const current = plan.nodes.find((n) => n.status === "current");

  const units = useMemo(() => {
    const out: { chapter: number; nodes: { n: PlanNode; i: number }[] }[] = [];
    plan.nodes.forEach((n, i) => {
      const last = out[out.length - 1];
      if (!last || last.chapter !== n.chapter) out.push({ chapter: n.chapter, nodes: [{ n, i }] });
      else last.nodes.push({ n, i });
    });
    return out;
  }, [plan.nodes]);

  useEffect(() => {
    // React is mounted on document, so filter by target instead of relying on stopPropagation.
    const close = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".stop-inner")) setPop(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    if (!currentRef.current) return;
    // Only bring the current stop into view when it's below the fold, so the hero stays visible on load.
    const r = currentRef.current.getBoundingClientRect();
    if (r.top > 0 && r.bottom < window.innerHeight) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    currentRef.current.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }, [current?.id]);

  return (
    <div>
      {units.map((unit) => {
        const ch = plan.chapters[unit.chapter];
        const proved = unit.nodes.filter(({ n }) => n.status === "done" || n.status === "mastered").length;
        const complete = proved === unit.nodes.length;
        const count = unit.nodes.length;
        const pts = [...unit.nodes, null].map((_, k) => ({ x: OFFSETS[k % OFFSETS.length], y: TOP + k * ROW + ROW / 2 - 4 }));
        const cur = unit.nodes.findIndex(({ n }) => n.status === "current");
        const gi = plan.nodes.findIndex((n) => n.status === "current");
        const reached = complete ? pts.length : cur >= 0 ? cur + 1 : gi < 0 || unit.nodes[count - 1].i < gi ? pts.length : 0;
        const height = TOP + (count + 1) * ROW - 24;
        // Mascot rides beside the current stop, on the side without a label.
        const mascotRow = cur >= 0 ? Math.min(cur + 1, count) : -1;

        return (
          <section key={unit.chapter} style={unitStyle(unit.chapter)}>
            <div className="unit">
              <div className="unit-copy">
                <small>
                  Chapter {unit.chapter + 1} · {count} stops
                </small>
                <h2>{ch?.title ?? `Chapter ${unit.chapter + 1}`}</h2>
                {ch?.why && <p>{ch.why}</p>}
                <div className="unit-bar">
                  <span style={{ width: `${(proved / count) * 100}%` }} />
                </div>
              </div>
              <span className="unit-count">
                {Icon.book()} {proved}/{count}
              </span>
            </div>

            <div className="path" style={{ height }}>
              <svg className="road" width="1" height={height} aria-hidden>
                <path d={road(pts)} className="road-edge" />
                <path d={road(pts)} className="road-bed" />
                <path d={road(pts)} className="road-dash" />
                {reached > 1 && <motion.path d={road(pts.slice(0, reached))} className="road-done" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />}
              </svg>

              {pts.map((p, k) => {
                if (k === 0 || k === mascotRow) return null;
                const Prop = PROPS[(unit.chapter * 3 + k) % PROPS.length];
                const side = p.x > 0 ? 1 : p.x < 0 ? -1 : unit.chapter % 2 ? 1 : -1;
                return (
                  <div key={`p${k}`} className="prop" style={{ top: p.y - 60, left: `calc(50% + ${p.x + side * 150}px)`, transform: "translateX(-50%)" }}>
                    <Prop />
                  </div>
                );
              })}

              {mascotRow >= 0 && (
                <div className="path-mascot" style={{ top: pts[mascotRow].y - 70, left: `calc(50% + ${pts[mascotRow].x + (pts[mascotRow].x > 0 ? 1 : -1) * 150}px)` }}>
                  {tip && (
                    <motion.div className="mascot-tip" initial={{ opacity: 0, scale: 0.8, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 24 }}>
                      {tip}
                    </motion.div>
                  )}
                  <Mascot size={96} mood="happy" />
                </div>
              )}

              {unit.nodes.map(({ n, i }, k) => {
                const x = OFFSETS[k % OFFSETS.length];
                const isCurrent = n.status === "current";
                const review = n.kind === "review" && n.status !== "done";
                const cls = review ? "review" : n.status === "upcoming" ? "" : n.status;
                const subs = n.subtopics.filter((s) => !s.skipped);
                const ring = subs.length ? subs.filter((s) => s.done).length / subs.length : 0;
                return (
                  <div key={n.id} className="stop" ref={isCurrent ? currentRef : undefined} style={{ top: TOP + k * ROW, zIndex: pop === n.id ? 15 : undefined }}>
                    <div className="stop-inner" style={{ "--x": `${x}px` } as React.CSSProperties}>
                      {isCurrent && <Ring value={ring} />}
                      {isCurrent && pop !== n.id && (
                        <motion.span className="start-tip" animate={{ y: [0, -6, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}>
                          Start
                        </motion.span>
                      )}
                      <motion.button
                        className={`node ${cls}`}
                        aria-label={`${n.title}, ${n.status}`}
                        aria-expanded={pop === n.id}
                        onClick={() => setPop(pop === n.id ? null : n.id)}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 26, delay: Math.min(k * 0.03, 0.3) }}
                      >
                        {nodeIcon(n)}
                      </motion.button>
                      <span className={`stop-label ${x > 0 ? "left" : "right"} ${isCurrent || n.status === "done" ? "on" : ""}`}>
                        {n.title.replace(/^Detour · /, "")}
                        <small>
                          {n.status === "mastered" ? "Known · skipped" : n.status === "done" ? `Proved${n.score ? ` · ${n.score}` : ""}` : `${n.minutes} min${n.demand >= 0.15 ? ` · ${Math.round(n.demand * 100)}% of jobs` : ""}`}
                        </small>
                      </span>
                      <AnimatePresence>
                        {pop === n.id && (
                          <Popover
                            n={n}
                            index={i}
                            total={plan.nodes.length}
                            onOpen={() => {
                              setPop(null);
                              onOpen(n);
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}

              <div className="stop" style={{ top: TOP + count * ROW }}>
                <div className="stop-inner" style={{ "--x": `${pts[count].x}px` } as React.CSSProperties}>
                  <div className={complete ? "finish is-done" : "finish"} title={complete ? "Chapter complete" : "Finish this chapter"}>
                    <svg viewBox="0 0 40 40" aria-hidden>
                      <path d="M12 6h16v8a8 8 0 0 1-16 0V6Z" fill="currentColor" />
                      <path d="M12 9H6a6 6 0 0 0 6 7M28 9h6a6 6 0 0 1-6 7" fill="none" stroke="currentColor" strokeWidth="3" />
                      <rect x="17" y="21" width="6" height="7" fill="currentColor" />
                      <rect x="11" y="28" width="18" height="5" rx="2" fill="currentColor" />
                    </svg>
                  </div>
                  <span className={`stop-label ${pts[count].x > 0 ? "left" : "right"} ${complete ? "on" : ""}`}>
                    {complete ? "Chapter complete!" : "Chapter finish"}
                    <small>{complete ? `${count} stops proved` : `${count - proved} stops to go`}</small>
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
