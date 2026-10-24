// The route engine: pure functions shared by the server (initial plan) and the
// client (rerouting, rescheduling after missed days). No AI required here —
// Claude only layers names and reasoning on top of what this produces.

import type { Chapter, Familiarity, JobsData, Plan, PlanNode, PlanSubtopic, Profile, Roadmap } from "./types";

const STUDY_DAYS_RATIO = 6 / 7;

function itemMinutes(resources: number, base: number) {
  return Math.min(95, base + resources * 8);
}

export function nodeMinutes(node: Pick<PlanNode, "kind" | "subtopics" | "resources" | "familiarity">) {
  if (node.kind === "mastered") return 0;
  if (node.kind === "review") return 30;
  const factor = node.familiarity === 1 ? 0.55 : 1;
  const own = itemMinutes(node.resources.length, 30);
  const subs = node.subtopics.filter((s) => !s.skipped).reduce((a, s) => a + itemMinutes(s.resources.length, 22), 0);
  return Math.round((own + subs) * factor);
}

function chapterize(count: number): number[] {
  // Split topics into 4–7 chapters of roughly equal size.
  const chapters = Math.max(1, Math.min(7, Math.round(count / 5)));
  const size = Math.ceil(count / chapters);
  return Array.from({ length: count }, (_, i) => Math.floor(i / size));
}

export function buildPlan(roadmap: Roadmap, jobs: JobsData | null, profile: Profile): Plan {
  const demand = jobs?.demand ?? {};
  const minutesPerDay = Math.round(profile.hoursPerDay * 60);
  const deadlineDay = Math.max(7, Math.round(profile.weeks * 7));
  const budget = minutesPerDay * deadlineDay * STUDY_DAYS_RATIO;

  let nodes: PlanNode[] = roadmap.topics.map((t, i) => {
    const familiarity: Familiarity = profile.ratings[t.id] ?? 0;
    const subtopics: PlanSubtopic[] = t.children.map((c) => ({
      refId: c.id,
      title: c.title,
      description: c.description,
      resources: c.resources,
      demand: demand[c.id] ?? 0,
      skipped: false,
      done: familiarity === 2,
    }));
    const nodeDemand = Math.max(demand[t.id] ?? 0, ...subtopics.map((s) => s.demand), 0);
    const kind = familiarity === 2 ? "mastered" : "learn";
    const node: PlanNode = {
      id: `n-${t.id}`,
      refId: t.id,
      kind,
      status: kind === "mastered" ? "mastered" : "upcoming",
      title: t.title,
      description: t.description,
      resources: t.resources,
      subtopics,
      minutes: 0,
      day: 0,
      demand: nodeDemand,
      familiarity,
      attempts: 0,
      chapter: 0,
    };
    node.minutes = nodeMinutes(node);
    void i;
    return node;
  });

  // 1) Trim low-demand subtopics until the route fits the deadline.
  let trimmedSubtopics = 0;
  const total = () => nodes.reduce((a, n) => a + n.minutes, 0);
  if (total() > budget) {
    const candidates = nodes
      .filter((n) => n.kind === "learn")
      .flatMap((n) => n.subtopics.map((s) => ({ n, s })))
      .sort((a, b) => a.s.demand - b.s.demand);
    for (const { n, s } of candidates) {
      if (total() <= budget) break;
      if (s.demand >= 0.08) break;
      // Keep at least one subtopic per topic so nothing becomes empty.
      if (n.subtopics.filter((x) => !x.skipped).length <= 1) continue;
      s.skipped = true;
      trimmedSubtopics++;
      n.minutes = nodeMinutes(n);
    }
  }

  // 2) Still over budget: push late, low-demand topics beyond the deadline.
  const beyond: Plan["beyond"] = [];
  if (total() > budget) {
    const startCut = Math.floor(nodes.length * 0.45);
    const late = nodes
      .map((n, i) => ({ n, i }))
      .filter(({ n, i }) => i >= startCut && n.kind === "learn")
      .sort((a, b) => a.n.demand - b.n.demand);
    const drop = new Set<string>();
    let t = total();
    for (const { n } of late) {
      if (t <= budget) break;
      drop.add(n.id);
      t -= n.minutes;
    }
    beyond.push(...nodes.filter((n) => drop.has(n.id)).map((n) => ({ refId: n.refId, title: n.title, demand: n.demand })));
    nodes = nodes.filter((n) => !drop.has(n.id));
  }

  const chapterOf = chapterize(nodes.length);
  nodes.forEach((n, i) => (n.chapter = chapterOf[i]));
  const chapterCount = (chapterOf[chapterOf.length - 1] ?? 0) + 1;
  const chapters: Chapter[] = Array.from({ length: chapterCount }, (_, c) => {
    const inC = nodes.filter((n) => n.chapter === c);
    const first = inC[0]?.title ?? "";
    const last = inC[inC.length - 1]?.title ?? "";
    return {
      index: c,
      title: c === 0 ? "Foundations" : inC.length > 1 ? `${first} → ${last}` : first,
      why: "",
    };
  });

  const firstLearn = nodes.find((n) => n.kind === "learn");
  if (firstLearn) firstLearn.status = "current";

  const plan: Plan = {
    slug: roadmap.slug,
    roadmapTitle: roadmap.title,
    headline: "",
    chapters,
    nodes,
    beyond,
    minutesPerDay,
    deadlineDay,
    totalDays: 0,
    trimmedSubtopics,
    engine: "offline",
  };
  return schedule(plan, 0);
}

/** Assign a start day to each remaining node, beginning at `fromDay`. */
export function schedule(plan: Plan, fromDay: number): Plan {
  const perDay = Math.max(15, plan.minutesPerDay * STUDY_DAYS_RATIO);
  let cursor = 0;
  let lastDay = fromDay;
  const nodes = plan.nodes.map((n) => {
    if (n.status === "done" || n.status === "mastered") return n;
    const day = fromDay + Math.floor(cursor / perDay);
    cursor += n.minutes;
    lastDay = fromDay + Math.ceil(cursor / perDay);
    return { ...n, day };
  });
  return { ...plan, nodes, totalDays: lastDay };
}

/** Make sure exactly one node is "current": the first unfinished one. */
export function normalizeStatus(nodes: PlanNode[]): PlanNode[] {
  let found = false;
  return nodes.map((n) => {
    if (n.status === "done" || n.status === "mastered") return n;
    if (!found) {
      found = true;
      return { ...n, status: "current" };
    }
    return { ...n, status: "upcoming" };
  });
}

/** Failed a check: insert a short detour that targets the gaps, then retry. */
export function reroute(plan: Plan, nodeId: string, gaps: string[], today: number): Plan {
  const idx = plan.nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return plan;
  const target = plan.nodes[idx];
  const focus = gaps.length ? gaps.slice(0, 3) : ["the core idea"];
  const review: PlanNode = {
    id: `r-${target.refId}-${Date.now()}`,
    refId: target.refId,
    kind: "review",
    status: "current",
    title: `Detour · ${target.title}`,
    description: `A focused pass on what your explanation missed, then you'll explain ${target.title} again.`,
    resources: target.resources,
    subtopics: target.subtopics.filter((s) => !s.skipped),
    minutes: 30,
    day: today,
    demand: target.demand,
    familiarity: 0,
    focus,
    attempts: 0,
    chapter: target.chapter,
  };
  const nodes = [...plan.nodes];
  nodes[idx] = { ...target, status: "upcoming", attempts: target.attempts + 1 };
  nodes.splice(idx, 0, review);
  return schedule({ ...plan, nodes: normalizeStatus(nodes) }, today);
}

/** Passed a check (or finished a detour): mark done and move on. */
export function complete(plan: Plan, nodeId: string, score: number | undefined, today: number): Plan {
  const nodes = plan.nodes.map((n) =>
    n.id === nodeId
      ? { ...n, status: "done" as const, score: score ?? n.score, attempts: n.attempts + (score !== undefined ? 1 : 0), subtopics: n.subtopics.map((s) => ({ ...s, done: !s.skipped || s.done })) }
      : n,
  );
  return schedule({ ...plan, nodes: normalizeStatus(nodes) }, today);
}

/**
 * Life happened: the learner is `missed` days behind. Re-fit the remaining route
 * into the remaining days by trimming the least-demanded subtopics first.
 */
export function replanAfterMiss(plan: Plan, today: number) {
  const before = plan.totalDays;
  const remainingDays = Math.max(1, plan.deadlineDay - today);
  const budget = remainingDays * plan.minutesPerDay * STUDY_DAYS_RATIO;
  const nodes = plan.nodes.map((n) => ({ ...n, subtopics: n.subtopics.map((s) => ({ ...s })) }));
  const open = nodes.filter((n) => n.status === "current" || n.status === "upcoming");
  const total = () => open.reduce((a, n) => a + n.minutes, 0);
  let trimmed = 0;
  const trimmedTitles: string[] = [];
  if (total() > budget) {
    const cands = open
      .filter((n) => n.kind === "learn" && n.status === "upcoming")
      .flatMap((n) => n.subtopics.filter((s) => !s.skipped && !s.done).map((s) => ({ n, s })))
      .sort((a, b) => a.s.demand - b.s.demand);
    for (const { n, s } of cands) {
      if (total() <= budget) break;
      if (s.demand >= 0.12) break;
      if (n.subtopics.filter((x) => !x.skipped).length <= 1) continue;
      s.skipped = true;
      trimmed++;
      if (trimmedTitles.length < 4) trimmedTitles.push(s.title);
      n.minutes = nodeMinutes(n);
    }
  }
  const next = schedule({ ...plan, nodes, trimmedSubtopics: plan.trimmedSubtopics + trimmed }, today);
  return { plan: next, trimmed, trimmedTitles, before, after: next.totalDays, onTrack: next.totalDays <= plan.deadlineDay };
}

// ---------- job readiness ----------

export function coveredSkills(plan: Plan): Set<string> {
  const covered = new Set<string>();
  for (const n of plan.nodes) {
    if (n.kind === "review") continue;
    if (n.status === "done" || n.status === "mastered") {
      covered.add(n.refId);
      for (const s of n.subtopics) if (!s.skipped || n.status === "mastered") covered.add(s.refId);
    }
  }
  return covered;
}

export const QUALIFY_AT = 0.5;

export function readiness(jobs: JobsData | null, covered: Set<string>) {
  if (!jobs || !jobs.postings.length) return { qualified: 0, total: 0, avg: 0, matches: [] as { i: number; coverage: number }[] };
  let qualified = 0;
  let sum = 0;
  const matches = jobs.postings.map((p, i) => {
    const have = p.skills.filter((s) => covered.has(s)).length;
    const coverage = have / p.skills.length;
    if (coverage >= QUALIFY_AT) qualified++;
    sum += coverage;
    return { i, coverage };
  });
  return { qualified, total: jobs.postings.length, avg: sum / jobs.postings.length, matches };
}

/** Which upcoming node unlocks the most roles if finished next? */
export function nextUnlock(plan: Plan, jobs: JobsData | null) {
  if (!jobs) return null;
  const covered = coveredSkills(plan);
  const base = readiness(jobs, covered).qualified;
  let best: { node: PlanNode; gain: number } | null = null;
  for (const n of plan.nodes) {
    if (n.kind !== "learn" || (n.status !== "upcoming" && n.status !== "current")) continue;
    const c = new Set(covered);
    c.add(n.refId);
    n.subtopics.forEach((s) => !s.skipped && c.add(s.refId));
    const gain = readiness(jobs, c).qualified - base;
    if (!best || gain > best.gain) best = { node: n, gain };
  }
  return best && best.gain > 0 ? best : null;
}
