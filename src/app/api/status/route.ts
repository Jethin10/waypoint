import { connection } from "next/server";
import { aiEnabled } from "@/lib/ai";

// connection() opts this handler out of prerendering so a key added later is picked up.
export async function GET() {
  await connection();
  return Response.json({ ai: aiEnabled() });
}
