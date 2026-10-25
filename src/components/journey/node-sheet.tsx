"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bar, Icon } from "@/components/app/shell";
import type { Plan, PlanNode, Resource } from "@/lib/types";
import { unitStyle, XP_PER_STOP } from "./route-map";

const RES: Record<string, { glyph: string; color: string }> = {
  video: { glyph: "▶", color: "#e2483d" },
  article: { glyph: "¶", color: "#f26b1d" },
  course: { glyph: "◎", color: "#3aa59a" },
  opensource: { glyph: "</>", color: "#86b85a" },
  official: { glyph: "★", color: "#e9b949" },
  feed: { glyph: "≋", color: "#e2483d" },
  podcast: { glyph: "◉", color: "#f2a07b" },
  book: { glyph: "▤", color: "#7fb8b0" },
};

function ResourceLink({ r }: { r: Resource }) {
  const s = RES[r.type] ?? { glyph: "→", color: "#6e6b5c" };
  return (
    <a href={r.url} target="_blank" rel="noreferrer" className="res">
      <span className="res-ico" style={{ background: s.color, fontSize: s.glyph.length > 1 ? "0.75rem" : undefined }}>
        {s.glyph}
      </span>
      <span>
        <b>{r.title}</b>
        <small>{r.type}</small>
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
  const live = node ? (plan.nodes.find((n) => n.id === node.id) ?? node) : null;
  const chapter = live ? plan.chapters[live.chapter] : null;
  const actionable = live && (live.status === "current" || live.status === "upcoming");
  const review = live?.kind === "review";

  return (
    <AnimatePresence>
      {live && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={live.title}
            className="sheet"
            style={review ? ({ "--u": "#e2483d", "--ud": "#b3312a" } as React.CSSProperties) : unitStyle(live.chapter)}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="sheet-top">
              <span>
                Chapter {live.chapter + 1} · {chapter?.title}
              </span>
              <button onClick={onClose} className="icon-btn" aria-label="Close">
                {Icon.close()}
              </button>
            </div>

            <div className="sheet-body">
              <div className="sheet-hero">
                <h2>{live.title.replace(/^Detour · /, "")}</h2>
                {live.why && <p>{live.why}</p>}
                <div className="pills">
                  {review && <span className="pill">Detour · 30 min</span>}
                  <span className="pill">{live.minutes} min</span>
                  {live.status === "done" && <span className="pill">Proved {live.score ?? ""}</span>}
                  {live.status === "mastered" && <span className="pill">Already known</span>}
                </div>
              </div>

              {live.demand > 0 && (
                <div>
                  <div className="demand-row">
                    <span>Asked for in real job posts</span>
                    <span>
                      {Math.round(live.demand * 100)}% of {postings}
                    </span>
                  </div>
                  <Bar value={live.demand} color="blue" className="thin" />
                </div>
              )}

              {live.focus && (
                <div>
                  <h3>Focus on what you missed</h3>
                  <div className="pills">
                    {live.focus.map((f) => (
                      <span key={f} className="pill red">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {live.description && <p className="desc">{live.description}</p>}

              {live.resources.length > 0 && (
                <div>
                  <h3>Start here</h3>
                  <div className="res-list">
                    {live.resources.map((r) => (
                      <ResourceLink key={r.url} r={r} />
                    ))}
                  </div>
                </div>
              )}

              {live.subtopics.length > 0 && (
                <div>
                  <h3>
                    Inside this stop · {live.subtopics.filter((s) => s.done).length}/{live.subtopics.filter((s) => !s.skipped).length} done
                  </h3>
                  <div className="subs">
                    {live.subtopics.map((s) => (
                      <details key={s.refId} className={s.skipped ? "sub skipped" : "sub"}>
                        <summary>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if (!s.skipped) onToggle(live, s.refId);
                            }}
                            aria-label={s.done ? "Mark not done" : "Mark done"}
                            className={s.done ? "check on" : "check"}
                          >
                            {s.done ? Icon.check() : null}
                          </button>
                          <span className="sub-title">{s.title}</span>
                          {s.skipped ? <span className="sub-meta">Trimmed</span> : s.demand >= 0.1 ? <span className="sub-meta hot">{Math.round(s.demand * 100)}% of jobs</span> : null}
                          <span className="sub-plus">+</span>
                        </summary>
                        <div className="sub-body">
                          {s.description && <p>{s.description}</p>}
                          {s.resources.slice(0, 3).map((r) => (
                            <a key={r.url} href={r.url} target="_blank" rel="noreferrer">
                              {r.title} ↗
                            </a>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
              <p className="credit">Topic content &amp; resources: roadmap.sh</p>
            </div>

            {actionable && (
              <div className="sheet-foot">
                {review ? (
                  <button onClick={() => onFinishDetour(live)} className="dbtn orange block">
                    I&apos;ve reviewed this · back on route
                  </button>
                ) : (
                  <button onClick={() => onProve(live)} className="dbtn primary block">
                    Prove it · +{XP_PER_STOP} XP
                  </button>
                )}
                {live.status === "upcoming" && <p>Jumping ahead is allowed. Proving it marks it done.</p>}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
