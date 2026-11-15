import { NextResponse } from "next/server";
import { generate, errorStatus } from "@/lib/server/llm";
import { bad, guard } from "@/lib/server/guard";
import { CRIT_SYSTEM, critUser } from "@/lib/server/prompts";
import { parseObjectives, parseProfile } from "@/lib/server/input";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const sev = (x: unknown) => (x === "high" || x === "low" ? x : "medium");
const t = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Independent review. Prefers Grok so the reviewer is a different model from the one that built the scorecard. */
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
  if (!profile || objectives.length === 0) return bad("Nothing to review");
  const topics = (Array.isArray(b.topics) ? b.topics : []).slice(0, 10).map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return { id: t(o.id, 40), label: t(o.label, 80), impact: Number(o.impact) || 0, financial: Number(o.financial) || 0 };
  });
  const objIds = new Set(objectives.map((o) => o.id));
  const kpiIds = new Set(objectives.flatMap((o) => o.kpis.map((k) => k.id)));

  try {
    const r = await generate<Record<string, unknown>>({ prefer: "grok", system: CRIT_SYSTEM, user: critUser(profile, topics, objectives), maxTokens: 6000, budgetMs: 55_000 });
    const d = r.data;
    const arr = (x: unknown) => (Array.isArray(x) ? (x as Record<string, unknown>[]) : []);
    return NextResponse.json({
      critique: {
        verdict: t(d.verdict, 500),
        strengths: (Array.isArray(d.strengths) ? d.strengths : []).map((s) => t(s, 200)).filter(Boolean).slice(0, 4),
        issues: arr(d.issues)
          .slice(0, 6)
          .map((i) => ({ severity: sev(i.severity), title: t(i.title, 120), detail: t(i.detail, 400), objectiveIds: (Array.isArray(i.objective_ids) ? i.objective_ids : []).map((x) => t(x, 20)).filter((x) => objIds.has(x)) }))
          .filter((i) => i.title),
        kpiNotes: arr(d.kpi_notes)
          .slice(0, 8)
          .map((n) => ({ kpiId: t(n.kpi_id, 20), rating: n.rating === "strong" || n.rating === "weak" ? n.rating : "ok", note: t(n.note, 260), better: t(n.better, 200) || null }))
          .filter((n) => kpiIds.has(n.kpiId) && n.note),
        fixes: arr(d.fixes)
          .slice(0, 5)
          .map((f) => ({ action: t(f.action, 200), why: t(f.why, 260), impact: f.impact === "high" || f.impact === "low" ? f.impact : "medium" }))
          .filter((f) => f.action),
        model: r.model,
      },
      provider: r.provider,
      fellBack: r.fellBack,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Model call failed" }, { status: errorStatus(e) });
  }
}
