"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Mascot } from "@/components/app/shell";

export interface RecalcInfo {
  id: number;
  title: string;
  lines: string[];
}

/** GPS-style "Recalculating…" moment, then what changed. */
function RecalcBody({ info, onDone }: { info: RecalcInfo; onDone: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 1400);
    return () => clearTimeout(a);
  }, []);

  return (
    <motion.div className="duo recalc" role="dialog" aria-label="Route recalculated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => stage === 1 && onDone()}>
      <AnimatePresence mode="wait">
        {stage === 0 ? (
          <motion.div key="r" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }} exit={{ opacity: 0, y: -20 }}>
            <div className="spin" />
            <h1 className="orange">Recalculating…</h1>
          </motion.div>
        ) : (
          <motion.div key="s" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", width: "100%" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Mascot mood="happy" size={130} />
            <h1>{info.title}</h1>
            <ul className="recalc-lines">
              {info.lines.map((l, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
                  <span className="n">{i + 1}</span>
                  {l}
                </motion.li>
              ))}
            </ul>
            <footer className="lesson-foot">
              <div style={{ justifyContent: "flex-end" }}>
                <button className="dbtn orange" onClick={onDone} autoFocus>
                  Got it
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Recalculating({ info, onDone }: { info: RecalcInfo | null; onDone: () => void }) {
  return <AnimatePresence>{info && <RecalcBody key={info.id} info={info} onDone={onDone} />}</AnimatePresence>;
}

/** Confetti burst for passing a check. */
export function Burst({ id }: { id: number }) {
  const pieces = useMemo(() => {
    if (!id) return [];
    const colors = ["#86b85a", "#f26b1d", "#e9b949", "#e2483d", "#3aa59a", "#e2483d"];
    let seed = id * 9301 + 49297;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: 80 }, (_, k) => {
      const a = rnd() * Math.PI * 2;
      const d = 160 + rnd() * 380;
      return { k, x: Math.cos(a) * d, y: Math.sin(a) * d - 120, r: rnd() * 540 - 270, c: colors[k % colors.length], s: 7 + rnd() * 8, round: rnd() > 0.5 };
    });
  }, [id]);
  return (
    <div key={id} className="pointer-events-none fixed left-1/2 top-1/2 z-[90]" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.k}
          className="absolute block"
          style={{ width: p.s, height: p.round ? p.s : p.s * 0.5, background: p.c, borderRadius: p.round ? "50%" : 3 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y + 260, rotate: p.r, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
