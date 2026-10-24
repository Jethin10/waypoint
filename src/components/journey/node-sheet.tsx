"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Plan, PlanNode, Resource } from "@/lib/types";
import { EASE } from "../ui/motion";

const ICON: Record<string, string> = { video: "▶", article: "◇", course: "◎", opensource: "⌘", official: "★", feed: "≋", podcast: "◉", book: "▤" };

function ResourceLink({ r }: { r: Resource }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-3 rounded-[0.15rem] px-2 py-2 transition-colors duration-300 hover:bg-cream hover:text-ink"
    >
      <span className="mt-0.5 w-4 shrink-0 text-center font-mono text-xs text-muted group-hover:text-ink">{ICON[r.type] ?? "→"}</span>
      <span className="text-[14px] leading-snug">
        {r.title}
        <span className="ml-2 font-mono text-[10px] uppercase text-faint group-hover:text-ink/60">{r.type}</span>
      </span>
    </a>
  );
}

export function NodeSheet({
  node,
  plan,
  postings,
  onClose,
  onProve,
  onFinishDetour,
  onToggle,
}: {
  node: PlanNode | null;
  plan: Plan;
  postings: number;
  onClose: () => void;
  onProve: (n: PlanNode) => void;
  onFinishDetour: (n: PlanNode) => void;
  onToggle: (n: PlanNode, refId: string) => void;
}) {
  const live = node ? plan.nodes.find((n) => n.id === node.id) ?? node : null;
  const chapter = live ? plan.chapters[live.chapter] : null;
  const actionable = live && (live.status === "current" || live.status === "upcoming");

  return (
    <AnimatePresence>
      {live && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={live.title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: EASE }}
            className="thin-scroll fixed inset-y-0 right-0 z-50 flex w-full max-w-[600px] flex-col overflow-y-auto border-l border-line bg-ink-2"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4 font-mono text-sm uppercase">
              <span className="text-muted">
                Ch.{String(live.chapter + 1).padStart(2, "0")} · {chapter?.title}
              </span>
              <button onClick={onClose} className="rounded-[0.15rem] px-2 py-1 hover:bg-cream hover:text-ink">
                Close ✕
              </button>
            </div>

            <div className="flex-1 px-6 pb-36 pt-8">
              {live.kind === "review" && <p className="mb-4 inline-block rounded-[0.15rem] bg-ember px-2 py-1 font-mono text-xs uppercase text-cream">Detour · 30 min</p>}
              <h2 className="text-5xl leading-[0.95] tracking-[-0.02em]">{live.title.replace(/^Detour · /, "")}</h2>
              {live.why && <p className="mt-4 font-mono text-sm leading-relaxed text-cream/80">{live.why}</p>}

              {live.demand > 0 && (
                <div className="mt-8">
                  <div className="flex items-baseline justify-between font-mono text-xs uppercase text-muted">
                    <span>Asked for in real postings</span>
                    <span className="text-cream">{Math.round(live.demand * 100)}% of {postings}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-line">
                    <motion.div className="h-full bg-cream" initial={{ width: 0 }} animate={{ width: `${Math.min(100, live.demand * 100)}%` }} transition={{ duration: 1.2, ease: EASE, delay: 0.3 }} />
                  </div>
                </div>
              )}

              {live.focus && (
                <div className="mt-8">
                  <p className="label">Focus on what you missed</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {live.focus.map((f) => (
                      <span key={f} className="rounded-[0.15rem] border border-ember/60 px-2 py-1 font-mono text-xs uppercase text-ember">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {live.description && <p className="mt-8 text-[15px] leading-relaxed text-muted">{live.description}</p>}

              {live.resources.length > 0 && (
                <div className="mt-8">
                  <p className="label mb-2">Start here</p>
                  {live.resources.map((r) => (
                    <ResourceLink key={r.url} r={r} />
                  ))}
                </div>
              )}

              {live.subtopics.length > 0 && (
                <div className="mt-10">
                  <p className="label mb-3">
                    Stops inside · {live.subtopics.filter((s) => !s.skipped).length} of {live.subtopics.length}
                  </p>
                  <div className="divide-y divide-line border-y border-line">
                    {live.subtopics.map((s) => (
                      <details key={s.refId} className={`group py-3 ${s.skipped ? "opacity-40" : ""}`}>
                        <summary className="flex cursor-pointer list-none items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (!s.skipped) onToggle(live, s.refId);
                            }}
                            aria-label={s.done ? "Mark not done" : "Mark done"}
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-[0.15rem] border text-[11px] ${s.done ? "border-cream bg-cream text-ink" : "border-line-strong"}`}
                          >
                            {s.done ? "✓" : ""}
                          </button>
                          <span className="flex-1 text-[15px]">{s.title}</span>
                          {s.skipped ? (
                            <span className="font-mono text-[10px] uppercase text-faint">Trimmed · low demand</span>
                          ) : s.demand >= 0.1 ? (
                            <span className="font-mono text-[10px] uppercase text-cream/70">{Math.round(s.demand * 100)}% of jobs</span>
                          ) : null}
                          <span className="font-mono text-xs text-faint transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <div className="pl-8 pt-2">
                          {s.description && <p className="text-[13px] leading-relaxed text-muted">{s.description}</p>}
                          <div className="mt-2">
                            {s.resources.slice(0, 3).map((r) => (
                              <ResourceLink key={r.url} r={r} />
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-8 font-mono text-[10px] uppercase text-faint">Topic content &amp; resources: roadmap.sh</p>
            </div>

            {actionable && (
              <div className="sticky bottom-0 border-t border-line bg-ink-2/95 p-5 backdrop-blur">
                {live.kind === "review" ? (
                  <button onClick={() => onFinishDetour(live)} className="w-full rounded-[0.15rem] bg-cream py-4 font-mono text-sm uppercase text-ink transition-colors hover:bg-blue hover:text-cream">
                    I&apos;ve reviewed this — back on route →
                  </button>
                ) : (
                  <button onClick={() => onProve(live)} className="w-full rounded-[0.15rem] bg-cream py-4 font-mono text-sm uppercase text-ink transition-colors hover:bg-blue hover:text-cream">
                    Prove it — explain it back →
                  </button>
                )}
                {live.status === "upcoming" && <p className="mt-2 text-center font-mono text-[10px] uppercase text-faint">Jumping ahead is allowed. Proving it marks it done.</p>}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
