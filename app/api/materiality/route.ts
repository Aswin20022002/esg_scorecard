import { NextResponse } from "next/server";
import { TOPICS } from "@/lib/topics";
import { generate, errorStatus, type Provider } from "@/lib/server/llm";
import { bad, guard } from "@/lib/server/guard";
import { MAT_SYSTEM, matUser } from "@/lib/server/prompts";
import { cleanText, parseProfile } from "@/lib/server/input";
import { sanitizeGroup, sanitizeRating } from "@/lib/sanitize";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** One model rates all topics on the impact side and the financial side. Called once per model. */
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
  if (!profile) return bad("Enter the company name first");
  const prefer: Provider = b.prefer === "grok" ? "grok" : "gemini";
  const text = cleanText(b.text, 90_000);
  const extra = (Array.isArray(b.extra) ? b.extra : [])
    .slice(0, 2)
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return { id: String(o.id ?? "").slice(0, 8), label: String(o.label ?? "").slice(0, 60), about: String(o.about ?? "").slice(0, 160) };
    })
    .filter((x) => x.id && x.label);

  try {
    const r = await generate<Record<string, unknown>>({ prefer, system: MAT_SYSTEM, user: matUser(profile, text, extra), maxTokens: 12000, budgetMs: 55_000 });
    const known = new Set([...TOPICS.map((t) => t.id), ...extra.map((e) => e.id)]);
    const ratings: Record<string, unknown> = {};
    for (const x of Array.isArray(r.data.ratings) ? r.data.ratings : []) {
      const id = typeof x?.id === "string" ? x.id : "";
      const rt = known.has(id) ? sanitizeRating(x) : null;
      if (rt) ratings[id] = rt;
    }
    // Extra topics are only taken from a call that was not itself given extras.
    const extras =
      extra.length === 0
        ? (Array.isArray(r.data.extra_topics) ? r.data.extra_topics : [])
            .slice(0, 2)
            .map((x: Record<string, unknown>, i: number) => ({
              id: `x${i + 1}`,
              label: String(x?.label ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
              group: sanitizeGroup(x?.group),
              about: String(x?.about ?? "").slice(0, 160),
              rating: sanitizeRating(x),
            }))
            .filter((x: { label: string; rating: unknown }) => x.label && x.rating)
        : [];
    if (Object.keys(ratings).length < 10) return NextResponse.json({ error: "The model returned too few topic ratings. Try again." }, { status: 502 });
    return NextResponse.json({ summary: String(r.data.company_summary ?? "").slice(0, 500), ratings, extras, provider: r.provider, model: r.model, fellBack: r.fellBack });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Model call failed" }, { status: errorStatus(e) });
  }
}
