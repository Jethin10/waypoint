import { getJobs, getRoadmap } from "@/lib/data";

// Lightweight view of a roadmap for the calibration step.
export async function GET(_req: Request, ctx: RouteContext<"/api/roadmap/[slug]">) {
  const { slug } = await ctx.params;
  const rm = getRoadmap(slug);
  if (!rm) return Response.json({ error: "Unknown roadmap" }, { status: 404 });
  const demand = getJobs(slug)?.demand ?? {};
  return Response.json({
    slug: rm.slug,
    title: rm.title,
    topics: rm.topics.map((t) => ({
      id: t.id,
      title: t.title,
      blurb: t.description.split(/(?<=\.)\s/)[0]?.slice(0, 180) ?? "",
      children: t.children.length,
      demand: Math.max(demand[t.id] ?? 0, ...t.children.map((c) => demand[c.id] ?? 0), 0),
    })),
  });
}
