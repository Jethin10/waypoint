"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { Prompt } from "@/components/app/shell";
import type { RoadmapMeta } from "@/lib/types";
import { PathArt } from "./path-art";

const KEYWORDS: [RegExp, string][] = [
  [/\b(ml|machine learning|deep learning|pytorch|tensorflow|data scien)/i, "machine-learning"],
  [/\b(ai|llm|agent|gpt|claude|genai|rag|prompt)/i, "ai-engineer"],
  [/\b(full[\s-]?stack|mern|startup|saas)/i, "full-stack"],
  [/\b(front[\s-]?end|react|ui|web design|css|next\.?js|website)/i, "frontend"],
  [/\b(back[\s-]?end|api|node|server|database|java|golang|spring)/i, "backend"],
  [/\b(data analy|analyst|sql|excel|tableau|power ?bi|dashboard)/i, "data-analyst"],
  [/\b(devops|cloud|kubernetes|docker|aws|sre|infra)/i, "devops"],
  [/\b(security|cyber|hack|pentest|ctf|soc)/i, "cyber-security"],
];

export function guessSlug(goal: string) {
  return KEYWORDS.find(([re]) => re.test(goal))?.[1] ?? null;
}

/** One accent per destination, from the Duolingo-style palette. */
export const PATH_COLOR: Record<string, string> = {
  frontend: "#f26b1d",
  backend: "#3aa59a",
  "full-stack": "#e2483d",
  "machine-learning": "#86b85a",
  "ai-engineer": "#f2a07b",
  "data-analyst": "#e9b949",
  devops: "#7fb8b0",
  "cyber-security": "#e2483d",
};

const BLURB: Record<string, string> = {
  frontend: "Build what people see and touch",
  backend: "APIs, databases, the engine room",
  "full-stack": "Ship whole products, end to end",
  "machine-learning": "Teach models to find patterns",
  "ai-engineer": "Build with LLMs and agents",
  "data-analyst": "Turn numbers into decisions",
  devops: "Deploy, automate, scale",
  "cyber-security": "Defend networks and systems",
};

export function Destination({
  roadmaps,
  slug,
  goal,
  onSlug,
  onGoal,
}: {
  roadmaps: RoadmapMeta[];
  slug: string | null;
  goal: string;
  onSlug: (s: string) => void;
  onGoal: (g: string) => void;
}) {
  const suggested = useMemo(() => (goal.trim().length > 2 ? guessSlug(goal) : null), [goal]);
  const meta = roadmaps.find((r) => r.slug === slug);

  return (
    <div className="q">
      <Prompt mood={meta ? "wow" : "happy"}>
        {meta ? (
          <>
            <b>{meta.shortTitle}!</b> {meta.companies} companies are hiring for that right now.
          </>
        ) : (
          "Where do you want to end up?"
        )}
      </Prompt>

      <div className="path-grid" role="radiogroup" aria-label="Career paths">
        {roadmaps.map((r, i) => {
          const on = slug === r.slug;
          return (
            <motion.button
              key={r.slug}
              role="radio"
              aria-checked={on}
              onClick={() => onSlug(r.slug)}
              className={on ? "dopt dest is-on" : "dopt dest"}
              style={{ "--accent": PATH_COLOR[r.slug] } as React.CSSProperties}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, type: "spring", stiffness: 400, damping: 30 }}
            >
              <span className="path-icon" style={{ "--art-accent": PATH_COLOR[r.slug] } as React.CSSProperties}>
                <PathArt slug={r.slug} />
              </span>
              <span className="path-copy">
                <strong>{r.shortTitle}</strong>
                <small>{BLURB[r.slug]}</small>
              </span>
              <span className="path-roles">{r.postings} jobs</span>
              {suggested === r.slug && <span className="path-match">Matches your goal</span>}
            </motion.button>
          );
        })}
      </div>

      <label className="goal-field" htmlFor="goal">
        <span>Got a specific goal? (optional)</span>
        <input
          id="goal"
          value={goal}
          autoComplete="off"
          onChange={(e) => {
            onGoal(e.target.value);
            const g = guessSlug(e.target.value);
            if (g) onSlug(g);
          }}
          placeholder="I want to land my first frontend internship"
        />
      </label>
    </div>
  );
}
