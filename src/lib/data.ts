import "server-only";
import type { JobsData, Roadmap } from "./types";
import index from "@/data/index.json";

import rmFrontend from "@/data/roadmaps/frontend.json";
import rmBackend from "@/data/roadmaps/backend.json";
import rmFullStack from "@/data/roadmaps/full-stack.json";
import rmMl from "@/data/roadmaps/machine-learning.json";
import rmAi from "@/data/roadmaps/ai-engineer.json";
import rmData from "@/data/roadmaps/data-analyst.json";
import rmDevops from "@/data/roadmaps/devops.json";
import rmSec from "@/data/roadmaps/cyber-security.json";

import jFrontend from "@/data/jobs/frontend.json";
import jBackend from "@/data/jobs/backend.json";
import jFullStack from "@/data/jobs/full-stack.json";
import jMl from "@/data/jobs/machine-learning.json";
import jAi from "@/data/jobs/ai-engineer.json";
import jData from "@/data/jobs/data-analyst.json";
import jDevops from "@/data/jobs/devops.json";
import jSec from "@/data/jobs/cyber-security.json";

const ROADMAPS: Record<string, Roadmap> = {
  frontend: rmFrontend as Roadmap,
  backend: rmBackend as Roadmap,
  "full-stack": rmFullStack as Roadmap,
  "machine-learning": rmMl as Roadmap,
  "ai-engineer": rmAi as Roadmap,
  "data-analyst": rmData as Roadmap,
  devops: rmDevops as Roadmap,
  "cyber-security": rmSec as Roadmap,
};

const JOBS: Record<string, JobsData> = {
  frontend: jFrontend as JobsData,
  backend: jBackend as JobsData,
  "full-stack": jFullStack as JobsData,
  "machine-learning": jMl as JobsData,
  "ai-engineer": jAi as JobsData,
  "data-analyst": jData as JobsData,
  devops: jDevops as JobsData,
  "cyber-security": jSec as JobsData,
};

export const datasetIndex = index;

export function getRoadmap(slug: string): Roadmap | null {
  return ROADMAPS[slug] ?? null;
}

export function getJobs(slug: string): JobsData | null {
  return JOBS[slug] ?? null;
}

/** Top in-demand skills for a roadmap, deduplicated by title. */
export function topSkills(slug: string, limit = 8) {
  const rm = getRoadmap(slug);
  const jobs = getJobs(slug);
  if (!rm || !jobs) return [];
  const titles = new Map<string, string>();
  for (const t of rm.topics) {
    titles.set(t.id, t.title);
    for (const c of t.children) titles.set(c.id, c.title);
  }
  const seen = new Set<string>();
  const out: { title: string; share: number }[] = [];
  for (const [id, share] of Object.entries(jobs.demand).sort((a, b) => b[1] - a[1])) {
    const title = (titles.get(id) ?? "").replace(/\s*\(.*\)$/, "");
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    out.push({ title, share });
    if (out.length >= limit) break;
  }
  return out;
}
