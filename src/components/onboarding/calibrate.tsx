"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Prompt } from "@/components/app/shell";
import type { Familiarity } from "@/lib/types";

export interface CalibTopic {
  id: string;
  title: string;
  blurb: string;
  children: number;
  demand: number;
}

const CHOICES: { v: Familiarity; label: string; hint: string }[] = [
  { v: 0, label: "New to me", hint: "Teach me from scratch" },
  { v: 1, label: "I've seen it", hint: "A quick refresher" },
  { v: 2, label: "I can use it", hint: "Skip it" },
];

const LINES = ["How well do you know this one?", "And this?", "What about this?", "Be honest, no wrong answers!", "Almost there. This one?"];

export function Calibrate({
  topics,
  onDone,
  onSkip,
  onProgress,
}: {
  topics: CalibTopic[];
  onDone: (r: Record<string, Familiarity>) => void;
  onSkip: () => void;
  onProgress: (p: number) => void;
}) {
  const [i, setI] = useState(0);
  const [ratings, setRatings] = useState<Record<string, Familiarity>>({});
  const [picked, setPicked] = useState<Familiarity | null>(null);
  const busy = useRef(false);

  const pick = useCallback(
    (v: Familiarity) => {
      const t = topics[i];
      if (!t || busy.current) return;
      busy.current = true;
      setPicked(v);
      const next = { ...ratings, [t.id]: v };
      setTimeout(() => {
        setRatings(next);
        setPicked(null);
        busy.current = false;
        onProgress((i + 1) / topics.length);
        if (i + 1 >= topics.length) onDone(next);
        else setI(i + 1);
      }, 380);
    },
    [i, onDone, onProgress, ratings, topics],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 3) pick(CHOICES[n - 1].v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick]);

  const known = Object.values(ratings).filter((v) => v === 2).length;
  const t = topics[i];
  if (!t) return null;

  return (
    <>
      <div className="q narrow">
        <Prompt mood={picked === 2 ? "cheer" : picked === 0 ? "happy" : "think"}>{picked === 2 ? "Skipping it. Nice!" : LINES[i % LINES.length]}</Prompt>
        <AnimatePresence mode="wait">
          <motion.div
            key={t.id}
            className="topic-card"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <span className="topic-count">
              Topic {i + 1} of {topics.length}
            </span>
            <h2>{t.title}</h2>
            {t.blurb && <p>{t.blurb}</p>}
            <div className="pills">
              {t.demand >= 0.1 && <span className="pill blue">In {Math.round(t.demand * 100)}% of job posts</span>}
              {t.children > 0 && <span className="pill">{t.children} subtopics</span>}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="opt-list" role="radiogroup" aria-label={`How well do you know ${t.title}`}>
          {CHOICES.map((c, k) => (
            <button key={c.v} role="radio" aria-checked={picked === c.v} onClick={() => pick(c.v)} className={picked === c.v ? "dopt row is-on" : "dopt row"}>
              <kbd>{k + 1}</kbd>
              <span className="row-main">{c.label}</span>
              <span className="row-aside">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <footer className="lesson-foot">
        <div>
          <button onClick={onSkip} className="dbtn ghost">
            Skip test
          </button>
          <span className="foot-note">{known ? `Skipping ${known} topic${known > 1 ? "s" : ""} you know` : "Press 1, 2 or 3"}</span>
        </div>
      </footer>
    </>
  );
}
