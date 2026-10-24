"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Familiarity } from "@/lib/types";
import { EASE } from "../ui/motion";

export interface CalibTopic {
  id: string;
  title: string;
  blurb: string;
  children: number;
  demand: number;
}

const CHOICES: { v: Familiarity; label: string; key: string; hint: string }[] = [
  { v: 0, label: "New to me", key: "1", hint: "← swipe" },
  { v: 1, label: "Seen it", key: "2", hint: "↑ swipe" },
  { v: 2, label: "I can use it", key: "3", hint: "swipe →" },
];

function Card({ t, index, total, onPick }: { t: CalibTopic; index: number; total: number; onPick: (v: Familiarity, dir: number) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-12, 12]);
  const leftOp = useTransform(x, [-140, -30], [1, 0]);
  const rightOp = useTransform(x, [30, 140], [0, 1]);

  const onEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) onPick(2, 1);
    else if (info.offset.x < -120) onPick(0, -1);
    else if (info.offset.y < -100) onPick(1, 0);
  };

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={onEnd}
      style={{ x, rotate }}
      initial={{ scale: 0.92, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="absolute inset-0 cursor-grab select-none rounded-[0.2rem] border border-line-strong bg-ink-3 p-8 active:cursor-grabbing md:p-10"
    >
      <motion.span style={{ opacity: leftOp }} className="absolute left-6 top-6 rounded-[0.15rem] bg-ember px-2 py-1 font-mono text-xs uppercase text-cream">
        New to me
      </motion.span>
      <motion.span style={{ opacity: rightOp }} className="absolute right-6 top-6 rounded-[0.15rem] bg-blue px-2 py-1 font-mono text-xs uppercase text-cream">
        I can use it
      </motion.span>
      <p className="label">
        Stop {index + 1} / {total}
      </p>
      <h3 className="mt-6 text-5xl leading-[0.95] tracking-[-0.02em] md:text-6xl">{t.title}</h3>
      {t.blurb && <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">{t.blurb}</p>}
      <div className="absolute inset-x-8 bottom-8 flex flex-wrap gap-2 md:inset-x-10">
        {t.demand >= 0.1 && (
          <span className="rounded-[0.15rem] bg-cream px-2 py-1 font-mono text-xs uppercase text-ink">In {Math.round(t.demand * 100)}% of job posts</span>
        )}
        {t.children > 0 && <span className="rounded-[0.15rem] border border-line-strong px-2 py-1 font-mono text-xs uppercase text-muted">{t.children} subtopics</span>}
      </div>
    </motion.div>
  );
}

export function Calibrate({ topics, onDone, onSkip }: { topics: CalibTopic[]; onDone: (r: Record<string, Familiarity>) => void; onSkip: () => void }) {
  const [i, setI] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Familiarity>>({});
  const [exitDir, setExitDir] = useState(0);

  const pick = useCallback(
    (v: Familiarity, dir: number) => {
      const t = topics[i];
      if (!t) return;
      const next = { ...ratings, [t.id]: v };
      setExitDir(dir);
      setRatings(next);
      if (i + 1 >= topics.length) setTimeout(() => onDone(next), 350);
      setI(i + 1);
    },
    [i, onDone, ratings, topics],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = CHOICES.find((c) => c.key === e.key);
      if (c) pick(c.v, c.v === 0 ? -1 : c.v === 2 ? 1 : 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick]);

  const known = Object.values(ratings).filter((v) => v === 2).length;

  return (
    <div className="calibration-screen">
      <p className="step-kicker"><span>03 / 04</span> Starting point</p>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
          A head start, earned.
        </h1>
        <div className="text-right">
          <p className="font-mono text-sm uppercase text-muted">Skipping {known} so far</p>
          <button onClick={onSkip} className="mt-2 font-mono text-sm uppercase text-faint underline-offset-4 hover:text-cream hover:underline">
            Skip calibration
          </button>
        </div>
      </div>

      <p className="calibration-instructions">No test. No pressure. Tell us what feels familiar and we will skip what you already know.</p>
      <div className="mt-10 h-1 w-full overflow-hidden bg-line">
        <motion.div className="h-full bg-cream" animate={{ width: `${(i / Math.max(1, topics.length)) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
      </div>

      <div className="relative mx-auto mt-10 h-[380px] max-w-2xl md:h-[420px]">
        {topics.slice(i + 1, i + 3).map((t, k) => (
          <div
            key={t.id}
            className="absolute inset-0 rounded-[0.2rem] border border-line bg-ink-2"
            style={{ transform: `translateY(${(k + 1) * 14}px) scale(${1 - (k + 1) * 0.04})`, zIndex: -k - 1, opacity: 0.7 - k * 0.3 }}
          />
        ))}
        <AnimatePresence custom={exitDir}>
          {topics[i] && (
            <motion.div
              key={topics[i].id}
              className="absolute inset-0"
              custom={exitDir}
              exit={{ x: exitDir * 520, y: exitDir === 0 ? -420 : 40, rotate: exitDir * 20, opacity: 0, transition: { duration: 0.6, ease: EASE } }}
            >
              <Card t={topics[i]} index={i} total={topics.length} onPick={pick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
        {CHOICES.map((c) => (
          <button
            key={c.v}
            onClick={() => pick(c.v, c.v === 0 ? -1 : c.v === 2 ? 1 : 0)}
            className="group rounded-[0.15rem] border border-line-strong px-3 py-4 text-center transition-colors duration-300 hover:bg-cream hover:text-ink"
          >
            <span className="block font-mono text-sm uppercase">{c.label}</span>
            <span className="mt-1 block font-mono text-[11px] uppercase text-faint group-hover:text-ink/60">
              {c.key} · {c.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
