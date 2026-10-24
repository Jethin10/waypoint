// Offline explain-back grader. Used when no Claude key is configured or the API
// call fails, so the demo never dead-ends. It checks which key concepts of the
// topic show up in the learner's explanation.

import type { GradeResult } from "./types";

const STOP = new Set(
  "about above after again against allows among another because before being below between both called cannot could different during each either every first following found further having however important including instead into itself known large later learn learning makes making many might more most much must often other others otherwise over own part people provide provides rather really same several should since small some something specific still such than that their them then there these they thing things this those through thus together under understand understanding until used useful uses using various very what when where whether which while within without would your also helps help based like just only well work works world".split(" "),
);

function stem(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9+#]/g, "").replace(/(ing|ed|es|s)$/, "");
}

function keyTerms(title: string, description: string, subtopics: string[]) {
  const concepts = new Map<string, string>();
  for (const s of subtopics) {
    const clean = s.replace(/\(.*?\)/g, "").trim();
    if (clean) concepts.set(clean, clean);
  }
  const counts = new Map<string, { word: string; n: number }>();
  for (const raw of description.split(/[^A-Za-z0-9+#-]+/)) {
    if (raw.length < 5) continue;
    const s = stem(raw);
    if (STOP.has(raw.toLowerCase()) || s.length < 4) continue;
    if (title.toLowerCase().includes(raw.toLowerCase())) continue;
    const prev = counts.get(s);
    counts.set(s, { word: prev?.word ?? raw.toLowerCase(), n: (prev?.n ?? 0) + 1 });
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  for (const t of top) if (concepts.size < 8) concepts.set(t.word, t.word);
  return [...concepts.keys()].slice(0, 8);
}

function mentions(text: string, concept: string) {
  const words = concept.split(/\s+/).map(stem).filter((w) => w.length >= 3);
  if (!words.length) return false;
  const bag = new Set(text.split(/[^A-Za-z0-9+#]+/).map(stem));
  const hits = words.filter((w) => bag.has(w) || [...bag].some((b) => b.length >= 5 && (b.startsWith(w) || w.startsWith(b)))).length;
  return hits / words.length >= 0.5;
}

export function gradeOffline(input: { title: string; description: string; subtopics: string[]; explanation: string }): GradeResult {
  const text = input.explanation.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const concepts = keyTerms(input.title, input.description, input.subtopics);
  const hit = concepts.filter((c) => mentions(text, c));
  const miss = concepts.filter((c) => !hit.includes(c));
  const coverage = concepts.length ? hit.length / Math.min(concepts.length, 5) : 0.5;
  const length = Math.min(1, words / 70);
  let score = Math.round(18 + 57 * Math.min(1, coverage) + 25 * length);
  if (words < 12) score = Math.min(score, 32);
  score = Math.max(5, Math.min(96, score));

  const verdict = score >= 85 ? "You could teach this." : score >= 70 ? "Solid. You've got it." : score >= 45 ? "Getting there." : "Not yet — and that's fine.";
  const feedback =
    score >= 70
      ? `You explained ${input.title} clearly${hit.length ? `, especially ${hit.slice(0, 2).join(" and ")}` : ""}.`
      : words < 12
        ? `That's a start, but too short to show understanding. Try walking through how ${input.title} actually works.`
        : `You have the outline of ${input.title}, but key pieces are missing${miss.length ? `: ${miss.slice(0, 2).join(", ")}` : ""}.`;

  return {
    score,
    verdict,
    feedback,
    strengths: hit.slice(0, 3),
    gaps: miss.slice(0, 3),
    followUp: miss[0] ? `How does ${miss[0]} fit into ${input.title}?` : `Where would you use ${input.title} in a real project?`,
    engine: "offline",
  };
}
