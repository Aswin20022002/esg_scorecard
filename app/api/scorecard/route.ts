import { NextResponse } from "next/server";
import { TOPICS } from "@/lib/topics";
import { generate, errorStatus } from "@/lib/server/llm";
import { bad, guard } from "@/lib/server/guard";
import { SC_SYSTEM, scUser } from "@/lib/server/prompts";
import { cleanText, parseProfile } from "@/lib/server/input";
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
  if (!profile) return bad("Missing company profile");
  const topics = (Array.isArray(b.topics) ? b.topics : [])
    .slice(0, 10)
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return { id: String(o.id ?? "").slice(0, 8 + 32), label: String(o.label ?? "").slice(0, 80), impact: Number(o.impact) || 0, financial: Number(o.financial) || 0, why: String(o.why ?? "").slice(0, 300) };
    })
    .filter((t) => t.id && t.label);
  if (topics.length === 0) return bad("No material topics to build from");
  const valid = new Set([...TOPICS.map((t) => t.id), ...topics.map((t) => t.id)]);

  try {
    const r = await generate<Record<string, unknown>>({ prefer: "gemini", system: SC_SYSTEM, user: scUser(profile, topics, cleanText(b.text, 40_000)), maxTokens: 16000, budgetMs: 56_000 });
    const clean = sanitizeObjectives(r.data.objectives, valid);
    if (clean.objectives.length < 4) return NextResponse.json({ error: "The model returned too few objectives. Try again." }, { status: 502 });
    return NextResponse.json({
      strategy: String(r.data.strategy_statement ?? "").slice(0, 400),
      summary: String(r.data.summary ?? "").slice(0, 700),
      objectives: clean.objectives,
      dropped: clean.dropped,
      provider: r.provider,
      model: r.model,
      fellBack: r.fellBack,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Model call failed" }, { status: errorStatus(e) });
  }
}
