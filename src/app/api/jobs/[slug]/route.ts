import { getJobs } from "@/lib/data";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[slug]">) {
  const { slug } = await ctx.params;
  const jobs = getJobs(slug);
  if (!jobs) return Response.json({ error: "Unknown roadmap" }, { status: 404 });
  return Response.json(jobs);
}
