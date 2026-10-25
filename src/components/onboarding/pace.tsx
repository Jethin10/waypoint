"use client";

import { useEffect } from "react";
import { Prompt } from "@/components/app/shell";

const DAILY = [
  { h: 0.5, time: "30 min / day", label: "Casual" },
  { h: 1, time: "1 hour / day", label: "Regular" },
  { h: 2, time: "2 hours / day", label: "Serious" },
  { h: 3, time: "3 hours / day", label: "Intense" },
];

const WEEKS = [
  { w: 4, label: "1 month", hint: "Sprint mode" },
  { w: 8, label: "2 months", hint: "Build momentum" },
  { w: 12, label: "3 months", hint: "Most popular" },
  { w: 24, label: "6 months", hint: "Slow and steady" },
];

function Option({ on, onClick, n, children, aside }: { on: boolean; onClick: () => void; n: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <button role="radio" aria-checked={on} onClick={onClick} className={on ? "dopt row is-on" : "dopt row"}>
      <kbd>{n}</kbd>
      <span className="row-main">{children}</span>
      {aside && <span className="row-aside">{aside}</span>}
    </button>
  );
}

export function Daily({ hours, onHours }: { hours: number | null; onHours: (h: number) => void }) {
  const pick = DAILY.find((d) => d.h === hours);
  return (
    <div className="q narrow">
      <Prompt mood={pick ? (pick.h >= 3 ? "wow" : "happy") : "think"}>
        {pick ? (pick.h >= 3 ? "Whoa, intense! I like your energy." : pick.h >= 2 ? "Serious! That's how careers get built." : "Nice and steady. Small wins add up.") : "What's your daily learning goal?"}
      </Prompt>
      <div className="opt-list" role="radiogroup" aria-label="Daily goal">
        {DAILY.map((d, i) => (
          <Option key={d.h} n={i + 1} on={hours === d.h} onClick={() => onHours(d.h)} aside={d.label}>
            {d.time}
          </Option>
        ))}
      </div>
      <KeyPick count={DAILY.length} onPick={(i) => onHours(DAILY[i].h)} />
    </div>
  );
}

export function Timeline({ hours, weeks, onWeeks }: { hours: number; weeks: number | null; onWeeks: (w: number) => void }) {
  const total = weeks ? Math.round(hours * weeks * 6) : null;
  return (
    <div className="q narrow">
      <Prompt mood={total ? "cheer" : "think"}>
        {total ? (
          <>
            That&apos;s <b className="hl">{total} focused hours</b>. Very doable. I&apos;ll fit the route into it.
          </>
        ) : (
          "When do you want to get there?"
        )}
      </Prompt>
      <div className="opt-list" role="radiogroup" aria-label="Timeline">
        {WEEKS.map((o, i) => (
          <Option key={o.w} n={i + 1} on={weeks === o.w} onClick={() => onWeeks(o.w)} aside={o.hint}>
            {o.label}
          </Option>
        ))}
      </div>
      <KeyPick count={WEEKS.length} onPick={(i) => onWeeks(WEEKS[i].w)} />
    </div>
  );
}


/** Number keys pick options, like Duolingo. */
function KeyPick({ count, onPick }: { count: number; onPick: (i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) onPick(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onPick]);
  return null;
}
