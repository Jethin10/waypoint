"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { EASE } from "../ui/motion";

export interface RecalcInfo {
  id: number;
  title: string;
  lines: string[];
}

/** Full-screen GPS-style "Recalculating…" moment. */
function RecalcBody({ info, onDone }: { info: RecalcInfo; onDone: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 1300);
    const b = setTimeout(onDone, 3600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col justify-between bg-ink p-4"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.8, ease: EASE }}
      onClick={onDone}
    >
      <div className="flex justify-between font-mono text-[1.4rem] uppercase">
        <span>Waypoint</span>
        <span className="text-ember">● Rerouting</span>
      </div>
      <div>
        <AnimatePresence mode="wait">
          {stage === 0 ? (
            <motion.h2 key="r" exit={{ opacity: 0, y: -30 }} className="text-[12vw] leading-[0.9] tracking-[-0.03em]">
              {"Recalculating".split("").map((c, i) => (
                <motion.span key={i} className="inline-block" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.3, 1] }} transition={{ delay: i * 0.05, duration: 0.6, times: [0, 0.3, 0.6, 1] }}>
                  {c}
                </motion.span>
              ))}
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                …
              </motion.span>
            </motion.h2>
          ) : (
            <motion.div key="s" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
              <h2 className="text-[7vw] leading-[0.9] tracking-[-0.03em]">{info.title}</h2>
              <div className="mt-8 grid gap-2 md:grid-cols-3">
                {info.lines.map((l, i) => (
                  <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: EASE }} className="font-mono text-base uppercase text-muted md:text-lg">
                    ({String(i + 1).padStart(2, "0")}) {l}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="font-mono text-sm uppercase text-faint">Click anywhere to continue</p>
    </motion.div>
  );
}

/** Full-screen GPS-style "Recalculating…" moment. */
export function Recalculating({ info, onDone }: { info: RecalcInfo | null; onDone: () => void }) {
  return <AnimatePresence>{info && <RecalcBody key={info.id} info={info} onDone={onDone} />}</AnimatePresence>;
}

/** A short burst of square confetti for passing a check. */
export function Burst({ id }: { id: number }) {
  const pieces = useMemo(() => {
    if (!id) return [];
    const colors = ["#171717", "#b7b7ad", "#0000ff", "#5c5cff"];
    let seed = id * 9301 + 49297;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 70 }, (_, k) => {
      const a = rnd() * Math.PI * 2;
      const d = 160 + rnd() * 380;
      return { k, x: Math.cos(a) * d, y: Math.sin(a) * d - 120, r: rnd() * 540 - 270, c: colors[k % colors.length], s: 5 + rnd() * 8 };
    });
  }, [id]);
  return (
    <div key={id} className="pointer-events-none fixed left-1/2 top-1/2 z-[90]" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.k}
          className="absolute block"
          style={{ width: p.s, height: p.s, background: p.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y + 260, rotate: p.r, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
