"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { Bar, Icon } from "@/components/app/shell";
import { QUALIFY_AT } from "@/lib/engine";
import type { JobsData, Plan, PlanNode } from "@/lib/types";
import type { Attempt } from "@/store/journey";
import { UNIT, XP_PER_STOP } from "./route-map";

function Ticker({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

const DAY = 86_400_000;
const LOGO = ["#f26b1d", "#3a8f86", "#6f9a45", "#3a8f86", "#527633"];

export function xpOf(plan: Plan) {
  return plan.nodes.filter((n) => n.status === "done").length * XP_PER_STOP;
}

export function Stats({ plan, streak, qualified, className = "" }: { plan: Plan; streak: number; qualified: number; className?: string }) {
  return (
    <div className={`stats ${className}`}>
      <span className="course-chip" title={plan.roadmapTitle} style={{ "--u": UNIT[0].u } as React.CSSProperties}>
        <span className="sq">{Icon.map()}</span>
      </span>
      <span className={streak ? "stat c-orange" : "stat off"} title={`${streak} day streak`}>
        {Icon.flame(streak > 0)}
        <Ticker value={streak} />
      </span>
      <span className="stat c-gold" title="XP earned">
        {Icon.bolt()}
        <Ticker value={xpOf(plan)} />
      </span>
      <span className="stat c-purple" title="Roles you qualify for">
        {Icon.brief()}
        <Ticker value={qualified} />
      </span>
    </div>
  );
}

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
  const top = [...matches].sort((a, b) => b.coverage - a.coverage).slice(0, 4);
  return (
    <section className="card" id="readiness">
      <div className="card-head">
        <h3>Job readiness</h3>
        {jobs && <span className="link">{jobs.postings.length} live</span>}
      </div>
      <div className="big-num">
        {Icon.brief()}
        <strong>
          <Ticker value={qualified} />
        </strong>
        <span>of {total} real roles</span>
      </div>
      <Bar value={total ? qualified / total : 0} color="purple" className="thin" />
      <p className="muted" style={{ marginTop: "0.75rem" }}>
        You qualify when you cover {Math.round(QUALIFY_AT * 100)}%+ of a role&apos;s skills.
      </p>
      {unlock && (
        <button onClick={() => onOpen(unlock.node)} className="dbtn blue block" style={{ marginTop: "1rem", whiteSpace: "normal", lineHeight: 1.2, padding: "0.6rem 1rem" }}>
          Next unlock: +{unlock.gain} {unlock.gain === 1 ? "role" : "roles"}
        </button>
      )}
      {jobs && top.length > 0 && (
        <ul className="role-list">
          {top.map((m, k) => {
            const p = jobs.postings[m.i];
            return (
              <li key={m.i}>
                <a href={p.url} target="_blank" rel="noreferrer">
                  <span className="role-logo" style={{ background: LOGO[(p.company.charCodeAt(0) + k) % LOGO.length] }}>
                    {p.company.charAt(0).toUpperCase()}
                  </span>
                  <span className="role-copy">
                    <b>{p.title}</b>
                    <small>
                      {p.company} · {p.location || "Remote"}
                    </small>
                  </span>
                  <span className={m.coverage >= QUALIFY_AT ? "role-pct ok" : "role-pct"}>{Math.round(m.coverage * 100)}%</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {jobs && <p className="card-foot">Snapshot {jobs.snapshot} · Greenhouse &amp; Lever</p>}
    </section>
  );
}

export function Quests({ plan, attempts, streak }: { plan: Plan; attempts: Attempt[]; streak: number }) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todays = attempts.filter((a) => a.at >= start.getTime());
  const passed = todays.filter((a) => a.score >= 70);
  const minutes = passed.reduce((s, a) => s + (plan.nodes.find((n) => n.id === a.nodeId)?.minutes ?? 0), 0);
  const goal = plan.minutesPerDay;
  const quests = [
    { icon: Icon.bolt(), title: "Prove 1 stop", have: Math.min(passed.length, 1), need: 1, color: "gold" as const },
    { icon: Icon.clock(), title: `Learn for ${goal} minutes`, have: Math.min(minutes, goal), need: goal, color: "blue" as const },
    { icon: Icon.flame(streak > 0), title: "Reach a 3 day streak", have: Math.min(streak, 3), need: 3, color: "gold" as const },
  ];
  return (
    <section className="card" id="quests">
      <div className="card-head">
        <h3>Daily quests</h3>
        <span className="link">Today</span>
      </div>
      {quests.map((q) => (
        <div key={q.title} className="quest" style={q.color === "blue" ? { color: "var(--blue)" } : undefined}>
          {q.icon}
          <div className="quest-body">
            <b style={{ color: "var(--text)" }}>{q.title}</b>
            <div className="quest-bar">
              <Bar value={q.have / q.need} color={q.color} />
              <em>
                {q.have} / {q.need}
              </em>
            </div>
          </div>
        </div>
      ))}
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
    <section className="card" id="pace">
      <div className="card-head">
        <h3>Your pace</h3>
        <span className={onTrack ? "pill green" : "pill red"}>{onTrack ? "On track" : `${plan.totalDays - plan.deadlineDay} days over`}</span>
      </div>
      <div className="pace-grid">
        <div className="pace-tile">
          <b>{fmt(eta)}</b>
          <small>Arrival</small>
        </div>
        <div className="pace-tile">
          <b>{fmt(deadline)}</b>
          <small>Deadline</small>
        </div>
        <div className="pace-tile">
          <b>
            {done}/{plan.nodes.length}
          </b>
          <small>Stops</small>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Day {today + 1} of {plan.deadlineDay}.{plan.trimmedSubtopics > 0 ? ` ${plan.trimmedSubtopics} low-demand subtopics trimmed to fit.` : ""}
      </p>
      <button onClick={onMiss} className="dbtn ghost block" style={{ whiteSpace: "normal", fontSize: "0.85rem", lineHeight: 1.2 }}>
        Life happened · I missed 3 days
      </button>
    </section>
  );
}
