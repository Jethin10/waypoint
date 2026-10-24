import { z } from "zod/v4";
import { aiEnabled, gradeWithClaude } from "@/lib/ai";
import { gradeOffline } from "@/lib/grader";

const Body = z.object({
  title: z.string().max(200),
  description: z.string().max(4000),
  subtopics: z.array(z.string().max(200)).max(40),
  explanation: z.string().min(1).max(6000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Write or say a little more first." }, { status: 400 });
  const input = parsed.data;
  if (aiEnabled()) {
    try {
      const result = await gradeWithClaude(input);
      if (result) return Response.json({ result, warning: null });
    } catch (err) {
      console.error("gradeWithClaude failed", err);
      return Response.json({ result: gradeOffline(input), warning: "Claude was unreachable, so the offline grader scored this one." });
    }
  }
  return Response.json({ result: gradeOffline(input), warning: null });
}
