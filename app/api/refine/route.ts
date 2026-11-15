import { NextResponse } from "next/server";
import { TOPICS } from "@/lib/topics";
import { generate, errorStatus } from "@/lib/server/llm";
import { bad, guard } from "@/lib/server/guard";
import { REFINE_SYSTEM, refineUser } from "@/lib/server/prompts";
import { parseObjectives, parseProfile } from "@/lib/server/input";
import { sanitizeObjectives } from "@/lib/sanitize";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return bad("Invalid request body");
  }
  const profile = parseProfile(b.profile);
  const objectives = parseObjectives(b.objectives);
  const instruction = typeof b.instruction === "string" ? b.instruction.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  if (!profile || objectives.length === 0) return bad("Nothing to change");
  if (instruction.length < 5) return bad("Describe the change you want");
  const extraIds = (Array.isArray(b.extraIds) ? b.extraIds : []).map((x) => String(x).slice(0, 8)).slice(0, 2);
  const topicIds = [...TOPICS.map((t) => t.id), ...extraIds];

  try {
    const r = await generate<Record<string, unknown>>({ prefer: "gemini", system: REFINE_SYSTEM, user: refineUser(profile, instruction, objectives, topicIds), maxTokens: 16000, budgetMs: 56_000 });
    const clean = sanitizeObjectives(r.data.objectives, new Set(topicIds));
    if (clean.objectives.length < 4) return NextResponse.json({ error: "The change produced an unusable scorecard, so nothing was changed. Try rewording it." }, { status: 502 });
    return NextResponse.json({ objectives: clean.objectives, note: String(r.data.change_note ?? "").slice(0, 300), dropped: clean.dropped, provider: r.provider, model: r.model });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Model call failed" }, { status: errorStatus(e) });
  }
}
