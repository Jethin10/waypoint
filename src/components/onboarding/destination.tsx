"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
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

const DESCRIPTIONS: Record<string, string> = {
  frontend: "Interfaces, interactions, the web.", backend: "APIs, databases, architecture.",
  "full-stack": "From interface to infrastructure.", "machine-learning": "Models, patterns, predictions.",
  "ai-engineer": "Language models, agents, systems.", "data-analyst": "Queries, insights, decisions.",
  devops: "Deploy, automate, scale.", "cyber-security": "Networks, threats, defense.",
};

export function Destination({ roadmaps, slug, goal, onSlug, onGoal }: {
  roadmaps: RoadmapMeta[]; slug: string | null; goal: string;
  onSlug: (s: string) => void; onGoal: (g: string) => void;
}) {
  const suggested = useMemo(() => goal.trim().length > 2 ? guessSlug(goal) : null, [goal]);
  return (
    <div className="destination-screen">
      <div className="destination-intro"><div><p className="step-kicker"><span>01 / 04</span> Destination</p><h1>What do you<br />want to build?</h1><p className="intro-copy">Pick the work you want to do. We will map the skills.</p></div></div>
      <div className="destination-grid" aria-label="Career paths">
        {roadmaps.map(r => {
          const selected = slug === r.slug;
          return <button key={r.slug} onClick={() => onSlug(r.slug)} aria-pressed={selected}
            className={`path-card ${selected ? "is-selected" : ""}`}>
            <span className="path-check" aria-hidden="true">{selected ? "\u2713" : "\u2197"}</span>
            <span className="path-art"><PathArt slug={r.slug} /></span>{selected && <motion.span className="path-selection" layoutId="selected-path" initial={false} transition={{type:"spring",stiffness:350,damping:32}} />}
            <span className="path-card-copy"><strong>{r.shortTitle}</strong><span className="path-description">{DESCRIPTIONS[r.slug]}</span>
            <span className="path-meta"><span>{r.topics} lessons</span><span>{r.postings} roles</span></span></span>
            {suggested === r.slug && <span className="path-suggestion">Matches your goal</span>}
          </button>;
        })}
      </div>
      <div className="goal-field"><label htmlFor="goal">Have a goal in mind? <span>Optional</span></label>
        <input id="goal" value={goal} onChange={e => { onGoal(e.target.value); const g = guessSlug(e.target.value); if(g) onSlug(g); }} placeholder="I want to land my first frontend internship..." />
        <span className="goal-note">You can change your path whenever you need to.</span>
      </div>
    </div>
  );
}
