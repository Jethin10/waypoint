// Builds the local dataset Waypoint runs on:
//   1. roadmap.sh topic graphs (order + structure) and topic content (descriptions + curated resources)
//   2. a snapshot of real job postings from public Greenhouse / Lever job boards, matched to topics
//
// Usage: node scripts/build-data.mjs [path-to-sparse-clone-of-developer-roadmap]
// Content is attributed to roadmap.sh (https://roadmap.sh) in the app UI.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUT = path.join(ROOT, "src", "data");
const CLONE = process.argv[2] ?? "C:/wp-tmp/developer-roadmap";

const ROADMAPS = [
  { slug: "frontend", titles: /front[\s-]?end|\bui engineer|web engineer|react/i },
  { slug: "backend", titles: /back[\s-]?end|server|api engineer|platform engineer|distributed/i },
  { slug: "full-stack", titles: /full[\s-]?stack|product engineer|software engineer/i },
  { slug: "machine-learning", titles: /machine learning|\bml\b|applied scientist|research engineer|deep learning|computer vision/i },
  { slug: "ai-engineer", titles: /\bai\b|llm|gen(erative)?\s?ai|machine learning|applied ai/i },
  { slug: "data-analyst", titles: /data analyst|analytics|business intelligence|\bbi\b|insights/i },
  { slug: "devops", titles: /devops|site reliability|\bsre\b|infrastructure|platform engineer|cloud engineer/i },
  { slug: "cyber-security", titles: /security|detection|threat|incident response|appsec/i },
];

const GREENHOUSE = [
  "stripe", "airbnb", "figma", "discord", "robinhood", "coinbase", "databricks", "cloudflare", "dropbox",
  "pinterest", "reddit", "gitlab", "lyft", "instacart", "asana", "brex", "anthropic", "scaleai", "duolingo",
  "vercel", "twitch", "airtable", "gusto", "plaid", "affirm", "chime", "datadog", "mongodb", "elastic",
  "okta", "samsara", "roblox", "webflow", "faire", "nextdoor", "squarespace", "toast", "postman",
  "mercury", "retool", "notion", "rippling", "carta", "flexport", "grammarly", "hashicorp", "snowflake",
];
const LEVER = ["palantir", "spotify", "cred", "meesho", "zeta", "jumpcloud", "binance"];

// ---------- roadmap graph + content ----------

function ensureClone() {
  if (fs.existsSync(path.join(CLONE, "src", "data", "roadmaps")) || fs.existsSync(path.join(CLONE, "roadmaps"))) return;
  fs.mkdirSync(path.dirname(CLONE), { recursive: true });
  console.log("Cloning roadmap.sh content (sparse)...");
  execSync(`git clone --depth 1 --filter=blob:none --sparse https://github.com/kamranahmedse/developer-roadmap.git "${CLONE}"`, { stdio: "inherit" });
  execSync(`git -C "${CLONE}" sparse-checkout set ${ROADMAPS.map((r) => `roadmaps/${r.slug}/content`).join(" ")}`, { stdio: "inherit" });
}

function parseMarkdown(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  let title = "";
  const desc = [];
  const resources = [];
  let inResources = false;
  for (const line of lines) {
    if (!title && line.startsWith("# ")) { title = line.slice(2).trim(); continue; }
    const res = line.match(/^\s*-\s*\[@(\w+)@([^\]]+)\]\(([^)]+)\)/);
    if (res) { resources.push({ type: res[1], title: res[2].trim(), url: res[3].trim() }); inResources = true; continue; }
    if (/visit the following resources|learn more from the following/i.test(line)) { inResources = true; continue; }
    if (!inResources && line.trim()) desc.push(line.trim());
  }
  return { title, description: desc.join(" ").replace(/\s+/g, " ").trim(), resources: resources.slice(0, 6) };
}

function loadContent(slug) {
  const dir = path.join(CLONE, "roadmaps", slug, "content");
  const byId = new Map();
  if (!fs.existsSync(dir)) return byId;
  for (const file of fs.readdirSync(dir)) {
    const m = file.match(/@([^.]+)\.md$/);
    if (!m) continue;
    byId.set(m[1], parseMarkdown(fs.readFileSync(path.join(dir, file), "utf8")));
  }
  return byId;
}

async function getJson(url, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "waypoint-hackathon-dataset" } });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function buildRoadmap(slug) {
  const graph = await getJson(`https://roadmap.sh/${slug}.json`);
  const content = loadContent(slug);
  const contentFor = (n) => content.get(n.id) ?? content.get(n.data?.oldId) ?? null;

  const label = (n) => (n.data?.label ?? "").replace(/\s+/g, " ").trim();
  const topics = graph.nodes.filter((n) => n.type === "topic" && label(n)).sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const subs = graph.nodes.filter((n) => n.type === "subtopic" && label(n));
  const topicIds = new Set(topics.map((t) => t.id));
  const subIds = new Set(subs.map((s) => s.id));

  const parentOf = new Map();
  for (const e of graph.edges ?? []) {
    if (topicIds.has(e.source) && subIds.has(e.target) && !parentOf.has(e.target)) parentOf.set(e.target, e.source);
    if (topicIds.has(e.target) && subIds.has(e.source) && !parentOf.has(e.source)) parentOf.set(e.source, e.target);
  }
  for (const s of subs) {
    if (parentOf.has(s.id)) continue;
    let best = null;
    let bestD = Infinity;
    for (const t of topics) {
      const d = Math.abs(t.position.y - s.position.y) + Math.abs(t.position.x - s.position.x) * 0.15;
      if (d < bestD) { bestD = d; best = t; }
    }
    if (best) parentOf.set(s.id, best.id);
  }

  const toItem = (n) => {
    const c = contentFor(n);
    return {
      id: n.id,
      title: label(n),
      description: c?.description || "",
      resources: c?.resources ?? [],
    };
  };

  const result = topics.map((t) => ({
    ...toItem(t),
    children: subs
      .filter((s) => parentOf.get(s.id) === t.id)
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .map(toItem),
  }));

  return {
    slug,
    title: graph.title?.page ?? graph.title?.card ?? slug,
    shortTitle: graph.title?.card ?? slug,
    description: (graph.description ?? "").replace("@currentYear@", "2026"),
    topics: result,
  };
}

// ---------- jobs ----------

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const stripHtml = (s) => decode(decode(s)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const item = items[i++];
        try { out.push(...(await fn(item))); } catch (err) { console.log(`  skip ${item}: ${err.message}`); }
      }
    }),
  );
  return out;
}

async function fetchJobs() {
  const gh = await pool(GREENHOUSE, 6, async (token) => {
    const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, 45000);
    const company = token.charAt(0).toUpperCase() + token.slice(1);
    console.log(`  greenhouse ${token}: ${data.jobs?.length ?? 0}`);
    return (data.jobs ?? []).map((j) => ({
      company: data.meta?.name ?? company,
      title: j.title,
      location: j.location?.name ?? "",
      url: j.absolute_url,
      text: stripHtml(j.content ?? ""),
    }));
  });
  const lv = await pool(LEVER, 4, async (co) => {
    const data = await getJson(`https://api.lever.co/v0/postings/${co}?mode=json`, 45000);
    console.log(`  lever ${co}: ${data.length ?? 0}`);
    return (Array.isArray(data) ? data : []).map((j) => ({
      company: co.charAt(0).toUpperCase() + co.slice(1),
      title: j.text,
      location: j.categories?.location ?? "",
      url: j.hostedUrl,
      text: [j.descriptionPlain ?? "", ...(j.lists ?? []).map((l) => `${l.text} ${stripHtml(l.content ?? "")}`)].join(" "),
    }));
  });
  return [...gh, ...lv];
}

const GENERIC = new Set([
  "introduction", "basics", "learn the basics", "overview", "others", "other", "more", "fundamentals", "concepts",
  "best practices", "tools", "resources", "what is", "getting started", "basic", "advanced", "terminology",
  "skills", "cost", "latency", "applications", "internet", "tuning", "training", "context", "generation", "inference", "performance",
  "experience", "communication", "data", "models", "security", "monitoring", "deployment", "debugging", "documentation",
  "go", "r", "c", "d", "less", "dart", "solid", "rest", "tasks", "types", "patterns", "functions", "objects",
]);

function keywordsFor(title) {
  const t = title.replace(/[’']/g, "'");
  const out = new Set();
  const base = t.replace(/\(.*?\)/g, "").trim();
  if (base) out.add(base);
  for (const m of t.matchAll(/\(([^)]+)\)/g)) out.add(m[1].trim());
  if (base.includes("/")) base.split("/").forEach((p) => p.trim() && out.add(p.trim()));
  if (/^go$/i.test(base)) out.add("Golang");
  return [...out].filter((k) => k.length >= 2 && !GENERIC.has(k.toLowerCase()) && k.split(" ").length <= 4);
}

function matcherFor(keyword) {
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s-]+");
  const caseSensitive = keyword.length <= 3;
  return new RegExp(`(^|[^A-Za-z0-9+#])${esc}(?![A-Za-z0-9+#])`, caseSensitive ? "" : "i");
}

function matchJobs(roadmap, jobs, titleRe) {
  const nodes = [];
  for (const t of roadmap.topics) {
    nodes.push({ id: t.id, title: t.title });
    for (const c of t.children) nodes.push({ id: c.id, title: c.title });
  }
  const matchers = nodes
    .map((n) => ({ id: n.id, res: keywordsFor(n.title).map(matcherFor) }))
    .filter((m) => m.res.length);

  const relevant = jobs.filter((j) => titleRe.test(j.title) && j.text.length > 400);
  const seen = new Set();
  const postings = [];
  const demand = {};
  for (const j of relevant) {
    const key = `${j.company}|${j.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const skills = matchers.filter((m) => m.res.some((re) => re.test(j.text))).map((m) => m.id);
    if (skills.length < 3) continue;
    postings.push({ company: j.company, title: j.title, location: j.location, url: j.url, skills });
    for (const s of skills) demand[s] = (demand[s] ?? 0) + 1;
  }
  const total = postings.length || 1;
  for (const k of Object.keys(demand)) demand[k] = Math.round((demand[k] / total) * 1000) / 1000;
  return { scanned: relevant.length, postings: postings.slice(0, 400), demand };
}

// ---------- main ----------

async function main() {
  ensureClone();
  fs.mkdirSync(path.join(OUT, "roadmaps"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "jobs"), { recursive: true });

  console.log("Fetching job boards...");
  const cache = "C:/wp-tmp/jobs-cache.json";
  const jobs = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, "utf8")) : await fetchJobs();
  fs.writeFileSync(cache, JSON.stringify(jobs));
  console.log(`Total postings fetched: ${jobs.length}`);

  const index = [];
  for (const { slug, titles } of ROADMAPS) {
    try {
      const rm = await buildRoadmap(slug);
      const j = matchJobs(rm, jobs, titles);
      fs.writeFileSync(path.join(OUT, "roadmaps", `${slug}.json`), JSON.stringify(rm));
      fs.writeFileSync(path.join(OUT, "jobs", `${slug}.json`), JSON.stringify({ snapshot: new Date().toISOString().slice(0, 10), ...j }));
      const nTopics = rm.topics.length;
      const nAll = rm.topics.reduce((a, t) => a + 1 + t.children.length, 0);
      const withContent = rm.topics.reduce((a, t) => a + (t.description ? 1 : 0) + t.children.filter((c) => c.description).length, 0);
      index.push({ slug, title: rm.title, shortTitle: rm.shortTitle, description: rm.description, topics: nTopics, nodes: nAll, postings: j.postings.length, companies: new Set(j.postings.map((p) => p.company)).size });
      console.log(`${slug}: ${nTopics} topics / ${nAll} nodes (${withContent} with content), ${j.postings.length} matched postings of ${j.scanned}`);
    } catch (err) {
      console.log(`FAILED ${slug}: ${err.message}`);
    }
  }
  fs.writeFileSync(
    path.join(OUT, "index.json"),
    JSON.stringify({ snapshot: new Date().toISOString().slice(0, 10), totalPostings: jobs.length, companies: new Set(jobs.map((j) => j.company)).size, roadmaps: index }, null, 2),
  );
}

main();
