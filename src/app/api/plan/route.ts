import { z } from "zod/v4";
import { aiEnabled, narratePlan } from "@/lib/ai";
import { getJobs, getRoadmap } from "@/lib/data";
import { buildPlan } from "@/lib/engine";
import type { Profile } from "@/lib/types";

const Body = z.object({
  slug: z.string(),
  goal: z.string().max(400).default(""),
  hoursPerDay: z.number().min(0.25).max(12),
  weeks: z.number().min(1).max(104),
  ratings: z.record(z.string(), z.union([z.literal(0), z.literal(1), z.literal(2)])),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const profile: Profile = parsed.data;
  const roadmap = getRoadmap(profile.slug);
  if (!roadmap) return Response.json({ error: "Unknown roadmap" }, { status: 404 });

  const plan = buildPlan(roadmap, getJobs(profile.slug), profile);
  if (!aiEnabled()) return Response.json({ plan, warning: null });
  try {
    return Response.json({ plan: await narratePlan(plan, profile), warning: null });
  } catch (err) {
    console.error("narratePlan failed", err);
    return Response.json({ plan, warning: "Claude was unreachable, so your route was plotted by the offline engine." });
  }
}
