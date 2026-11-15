import { postJson } from "./api";
import { selectContext } from "./context";
import { DEFAULT_THRESHOLD, derive, materialTopics } from "./materiality";
import { makeVerifier } from "./verify";
import { TOPICS } from "./topics";
import type { Critique, Evidence, Objective, Profile, Rating, Study, Topic } from "./types";
import type { Group } from "./topics";
import type { Health } from "./api";
import type { PdfDoc } from "./pdf";

export interface StepState {
  id: string;
  label: string;
  detail: string;
  state: "wait" | "run" | "done" | "error";
}

export const STEP_DEFS: { id: string; label: string }[] = [
  { id: "rate_a", label: "First model rates every topic on impact and on finances" },
  { id: "rate_b", label: "Second model rates the same topics at the same time" },
  { id: "build", label: "Building objectives, links and KPIs" },
  { id: "review", label: "Independent review (finishes after the results appear)" },
  { id: "check", label: "Checking quotes and scoring the scorecard" },
];

interface MatResp {
  summary: string;
  ratings: Record<string, Rating>;
  extras: { id: string; label: string; group: Group; about: string; rating: Rating }[];
  provider: string;
  model: string;
  fellBack: boolean;
}
interface ScResp {
  strategy: string;
  summary: string;
  objectives: Objective[];
  dropped: number;
  provider: string;
  model: string;
}

export const modelName = (provider: string, model: string) => `${provider === "gemini" ? "Gemini" : /^grok/i.test(model) ? "Grok" : "Groq"} (${model})`;

export function topicsWhy(t: Topic): string {
  const d = derive(t);
  const r = (d.impact >= d.financial ? t.a ?? t.b : t.b ?? t.a) ?? t.a ?? t.b;
  if (!r) return "";
  return d.impact >= d.financial ? r.impactReason : r.financialReason;
}

export async function runStudy(args: {
  profile: Profile;
  pdf: PdfDoc | null;
  health: Health | null;
  set: (id: string, state: StepState["state"], detail?: string) => void;
  onTopics: (t: Topic[]) => void;
}): Promise<Study> {
  const { profile, pdf, health, set, onTopics } = args;
  const warnings: string[] = [];
  const both = !health || (health.gemini && health.grok);

  const matCtx = pdf ? selectContext(pdf.pages, 85_000) : { text: "", pageNumbers: [] as number[] };
  const baseCtx = pdf ? selectContext(pdf.pages, 30_000, 2200) : { text: "", pageNumbers: [] as number[] };
  const verifier = pdf ? makeVerifier(pdf.pages) : null;
  if (pdf && matCtx.pageNumbers.length === 0) warnings.push("No page in the PDF looked like sustainability content, so the ratings rest on your profile and sector knowledge.");

  // 1 and 2. both models rate at the same time. The second never sees the first one's scores.
  set("rate_a", "run");
  if (both) set("rate_b", "run");
  else {
    set("rate_b", "done", "Skipped, only one API key is set");
    warnings.push("Only one AI key is set, so the materiality ratings come from a single model and no disagreement can be shown.");
  }
  const [ra, rb] = await Promise.allSettled([
    postJson<MatResp>("/api/materiality", { profile, text: matCtx.text, prefer: "gemini" }),
    both ? postJson<MatResp>("/api/materiality", { profile, text: matCtx.text, prefer: "grok" }) : Promise.reject(new Error("skipped")),
  ]);
  const a: MatResp | null = ra.status === "fulfilled" ? ra.value : null;
  const b: MatResp | null = rb.status === "fulfilled" ? rb.value : null;
  if (a) set("rate_a", "done", `${modelName(a.provider, a.model)}, ${Object.keys(a.ratings).length} topics rated`);
  else set("rate_a", "error", ra.status === "rejected" && ra.reason instanceof Error ? ra.reason.message : "Failed");
  if (both) {
    if (b) set("rate_b", "done", `${modelName(b.provider, b.model)}, ${Object.keys(b.ratings).length} topics rated`);
    else set("rate_b", "error", rb.status === "rejected" && rb.reason instanceof Error ? rb.reason.message : "Failed");
  }

  if (!a && !b) throw new Error("Neither model could rate the topics. Check the API keys and try again.");
  if (!a || !b) {
    if (both) warnings.push(`One of the two models failed, so materiality rests on ${a ? "the first" : "the second"} model alone.`);
  }
  const first = a ?? b!;
  const second = a && b ? b : null;
  if (second && first.provider === second.provider) warnings.push("Both ratings came from the same model because one provider was unavailable, so they are not independent.");

  const verify = (r: Rating | undefined | null): Rating | null => {
    if (!r) return null;
    if (!verifier || !r.quote) return { ...r, evidence: "none" as Evidence, quote: pdf ? r.quote : null, page: pdf ? r.page : null };
    const v = verifier.check(r.quote, r.page);
    return { ...r, evidence: v.evidence, page: v.page };
  };

  const extras = (first.extras ?? []).slice(0, 2);
  const topics: Topic[] = [
    ...TOPICS.map((t) => ({ id: t.id, label: t.label, group: t.group, custom: false, brsr: t.brsr, esrs: t.esrs, gri: t.gri })),
    ...extras.map((x) => ({ id: x.id, label: x.label, group: x.group, custom: true, brsr: "", esrs: "", gri: "" })),
  ].map((t) => ({
    ...t,
    a: verify(first.ratings[t.id] ?? null),
    b: verify(second?.ratings[t.id] ?? null),
  }));
  const rated = topics.filter((t) => t.a || t.b);
  if (rated.length < 10) throw new Error("Too few topics were rated to continue.");
  onTopics(rated);

  // 3. scorecard
  set("build", "run");
  let top = materialTopics(rated, DEFAULT_THRESHOLD);
  if (top.length === 0) {
    top = [...rated].sort((x, y) => derive(y).priority - derive(x).priority).slice(0, 5);
    warnings.push("No topic passed the materiality line, so the scorecard uses the five highest ranked topics.");
  }
  let sc: ScResp;
  try {
    sc = await postJson<ScResp>("/api/scorecard", {
      profile,
      text: baseCtx.text,
      topics: top.map((t) => {
        const d = derive(t);
        return { id: t.id, label: t.label, impact: d.impact, financial: d.financial, why: topicsWhy(t) };
      }),
    });
    set("build", "done", `${modelName(sc.provider, sc.model)}, ${sc.objectives.length} objectives, ${sc.objectives.reduce((s, o) => s + o.kpis.length, 0)} KPIs`);
    if (sc.dropped > 0) warnings.push(`${sc.dropped} link(s) from the model pointed the wrong way or to nothing and were removed.`);
  } catch (e) {
    set("build", "error", e instanceof Error ? e.message : "Failed");
    throw new Error("The scorecard could not be built. " + (e instanceof Error ? e.message : ""));
  }

  // The independent review runs after the results are shown, so the wait is shorter.
  set("review", "done", "Runs next, while you read the results");
  const critique: Critique | null = null;
  const criticModel: string | null = null;

  set("check", "done", pdf ? `${rated.filter((t) => (t.a?.evidence ?? t.b?.evidence) === "verified").length} topic quotes confirmed in the PDF` : "Rule checks ready");

  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    demo: false,
    profile,
    report: pdf ? { fileName: pdf.fileName, numPages: pdf.numPages, usedPages: matCtx.pageNumbers.length } : null,
    models: { a: modelName(first.provider, first.model), b: second ? modelName(second.provider, second.model) : null, build: modelName(sc.provider, sc.model), critique: criticModel },
    summary: [sc.strategy, sc.summary].filter(Boolean).join(" "),
    topics: rated,
    objectives: sc.objectives,
    critique,
    warnings,
  };
}
