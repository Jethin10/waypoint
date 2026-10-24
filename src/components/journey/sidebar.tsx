"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { QUALIFY_AT } from "@/lib/engine";
import type { JobsData, Plan, PlanNode } from "@/lib/types";
import { EASE } from "../ui/motion";

function Ticker({ value, className = "" }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.4, ease: EASE });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

const card = "rounded-[0.2rem] border border-line bg-ink-2 p-5";
const DAY = 86_400_000;

export function Readiness({
  jobs,
  qualified,
  total,
  matches,
  unlock,
  onOpen,
}: {
  jobs: JobsData | null;
  qualified: number;
  total: number;
  matches: { i: number; coverage: number }[];
  unlock: { node: PlanNode; gain: number } | null;
  onOpen: (n: PlanNode) => void;
}) {
  const top = [...matches].sort((a, b) => b.coverage - a.coverage).slice(0, 5);
  return (
    <section className={card}>
      <p className="label">Job readiness</p>
      <div className="mt-4 flex items-end gap-3">
        <Ticker value={qualified} className="text-7xl leading-none tracking-[-0.03em]" />
        <span className="pb-2 font-mono text-sm uppercase text-muted">/ {total} roles</span>
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase text-faint">You cover {Math.round(QUALIFY_AT * 100)}%+ of their skills</p>
      <div className="mt-4 h-1.5 bg-line">
        <motion.div className="h-full bg-cream" animate={{ width: `${total ? (qualified / total) * 100 : 0}%` }} transition={{ duration: 1.4, ease: EASE }} />
      </div>
      {unlock && (
        <button onClick={() => onOpen(unlock.node)} className="mt-5 flex w-full items-center justify-between rounded-[0.15rem] bg-blue px-3 py-2.5 text-left font-mono text-xs uppercase text-cream transition-colors hover:bg-cream hover:text-ink">
          <span>Next unlock: {unlock.node.title}</span>
          <span>+{unlock.gain} roles</span>
        </button>
      )}
      {jobs && top.length > 0 && (
        <div className="mt-6">
          <p className="label mb-2">Closest real roles</p>
          <ul className="divide-y divide-line">
            {top.map((m) => {
              const p = jobs.postings[m.i];
              return (
                <li key={m.i}>
                  <a href={p.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 py-2.5">
                    <span className="flex-1 truncate text-[14px] group-hover:underline">
                      {p.title}
                      <span className="block font-mono text-[10px] uppercase text-faint">
                        {p.company} · {p.location || "—"}
                      </span>
                    </span>
                    <span className={`font-mono text-xs ${m.coverage >= QUALIFY_AT ? "text-cream" : "text-faint"}`}>{Math.round(m.coverage * 100)}%</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 font-mono text-[10px] uppercase text-faint">Live postings · snapshot {jobs.snapshot}</p>
        </div>
      )}
    </section>
  );
}

export function Today({ plan, today, onOpen }: { plan: Plan; today: number; onOpen: (n: PlanNode) => void }) {
  const open = plan.nodes.filter((n) => n.status === "current" || n.status === "upcoming");
  const todays = open.filter((n) => n.day <= today).slice(0, 3);
  const list = todays.length ? todays : open.slice(0, 1);
  const mins = list.reduce((a, n) => a + n.minutes, 0);
  return (
    <section className={card}>
      <div className="flex items-baseline justify-between">
        <p className="label">Today · day {today + 1}</p>
        <span className="font-mono text-xs uppercase text-muted">{mins} min</span>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((n) => (
          <li key={n.id}>
            <button onClick={() => onOpen(n)} className="group flex w-full items-center gap-3 rounded-[0.15rem] border border-line px-3 py-3 text-left transition-colors hover:bg-cream hover:text-ink">
              <span className={`h-2.5 w-2.5 shrink-0 ${n.kind === "review" ? "rotate-45 bg-ember" : n.status === "current" ? "rounded-full bg-blue" : "rounded-full border border-line-strong"}`} />
              <span className="flex-1 text-[15px]">{n.title}</span>
              <span className="font-mono text-[11px] uppercase text-faint group-hover:text-ink/60">{n.minutes}m</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="font-mono text-sm uppercase text-muted">Route complete. You arrived.</li>}
      </ul>
    </section>
  );
}

export function Pace({ plan, today, startedAt, onMiss }: { plan: Plan; today: number; startedAt: number; onMiss: () => void }) {
  const eta = new Date(startedAt + plan.totalDays * DAY);
  const deadline = new Date(startedAt + plan.deadlineDay * DAY);
  const onTrack = plan.totalDays <= plan.deadlineDay;
  const done = plan.nodes.filter((n) => n.status === "done" || n.status === "mastered").length;
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <section className={card}>
      <p className="label">Pace</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-3xl tracking-tight">{fmt(eta)}</p>
          <p className="font-mono text-[10px] uppercase text-faint">Arrival</p>
        </div>
        <div>
          <p className="text-3xl tracking-tight">{fmt(deadline)}</p>
          <p className="font-mono text-[10px] uppercase text-faint">Deadline</p>
        </div>
        <div>
          <p className="text-3xl tracking-tight">
            {done}/{plan.nodes.length}
          </p>
          <p className="font-mono text-[10px] uppercase text-faint">Stops</p>
        </div>
      </div>
      <p className={`mt-4 inline-block rounded-[0.15rem] px-2 py-1 font-mono text-[11px] uppercase ${onTrack ? "bg-cream text-ink" : "bg-ember text-cream"}`}>
        {onTrack ? "On track" : `${plan.totalDays - plan.deadlineDay} days over`}
      </p>
      {plan.trimmedSubtopics > 0 && <p className="mt-3 font-mono text-[11px] uppercase text-faint">{plan.trimmedSubtopics} low-demand subtopics trimmed to fit</p>}
      <button onClick={onMiss} className="mt-5 w-full rounded-[0.15rem] border border-line-strong py-3 font-mono text-xs uppercase transition-colors hover:bg-cream hover:text-ink">
        Life happened · I missed 3 days
      </button>
      <p className="mt-2 text-center font-mono text-[10px] uppercase text-faint">Day {today + 1} of {plan.deadlineDay}</p>
    </section>
  );
}
