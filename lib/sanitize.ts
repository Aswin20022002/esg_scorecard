import { clamp15 } from "./materiality";
import { RANK } from "./perspectives";
import type { Group } from "./topics";
import type { Initiative, Kpi, Objective, Perspective, Rating } from "./types";

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown, max: number): string => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
const strOrNull = (x: unknown, max: number): string | null => {
  const s = str(x, max);
  return s ? s : null;
};
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

export function sanitizeRating(raw: unknown): Rating | null {
  if (!isObj(raw)) return null;
  const horizon = raw.horizon === "short" || raw.horizon === "long" ? raw.horizon : "medium";
  const page = typeof raw.page === "number" && Number.isFinite(raw.page) && raw.page >= 1 ? Math.round(raw.page) : null;
  return {
    scale: clamp15(raw.scale),
    scope: clamp15(raw.scope),
    irremediability: clamp15(raw.irremediability),
    impactLikelihood: clamp15(raw.impact_likelihood),
    magnitude: clamp15(raw.magnitude),
    financialLikelihood: clamp15(raw.financial_likelihood),
    impactReason: str(raw.impact_reason, 300),
    financialReason: str(raw.financial_reason, 300),
    horizon,
    stakeholders: arr(raw.stakeholders).map((s) => str(s, 40)).filter(Boolean).slice(0, 4),
    quote: strOrNull(raw.quote, 400),
    page,
    evidence: "none",
  };
}

export function sanitizeGroup(x: unknown): Group {
  return x === "S" || x === "G" ? x : "E";
}

export interface CleanObjectives {
  objectives: Objective[];
  dropped: number;
}

const PERSP: Perspective[] = ["financial", "stakeholder", "process", "learning"];

/** Turns model output into safe, renumbered objectives. Links that point the wrong way or to nothing are dropped and counted. */
export function sanitizeObjectives(raw: unknown, validTopicIds: Set<string>): CleanObjectives {
  const list = arr(raw).filter(isObj).slice(0, 16);
  const idMap = new Map<string, string>();
  list.forEach((o, i) => {
    const orig = str(o.id, 20) || `O${i + 1}`;
    if (!idMap.has(orig)) idMap.set(orig, `O${i + 1}`);
  });
  let dropped = 0;
  let kn = 0;
  const objectives: Objective[] = list.map((o, i) => {
    const id = `O${i + 1}`;
    const perspective: Perspective = PERSP.includes(o.perspective as Perspective) ? (o.perspective as Perspective) : "process";
    const kpis: Kpi[] = arr(o.kpis)
      .filter(isObj)
      .slice(0, 4)
      .map((k) => {
        const yr = typeof k.target_year === "number" ? Math.round(k.target_year) : Number(String(k.target_year ?? "").replace(/\D/g, "")) || null;
        return {
          id: `K${++kn}`,
          name: str(k.name, 110),
          type: k.type === "leading" ? "leading" : "lagging",
          unit: str(k.unit, 40),
          baseline: str(k.baseline, 80),
          target: str(k.target, 100),
          targetYear: yr && yr >= 2000 && yr <= 2100 ? yr : null,
          direction: k.direction === "up" ? "up" : "down",
          frequency: str(k.frequency, 30) || "Annual",
          owner: str(k.owner, 60),
          source: str(k.source, 80),
          framework: str(k.framework, 60),
        } satisfies Kpi;
      })
      .filter((k) => k.name);
    const initiatives: Initiative[] = arr(o.initiatives)
      .filter(isObj)
      .slice(0, 3)
      .map((x) => ({ name: str(x.name, 140), owner: str(x.owner, 60), timeline: str(x.timeline, 40) }))
      .filter((x) => x.name);
    return {
      id,
      perspective,
      title: str(o.title, 120) || `Objective ${i + 1}`,
      why: str(o.why, 320),
      topicIds: [...new Set(arr(o.topic_ids).map((t) => str(t, 40)))].filter((t) => validTopicIds.has(t)),
      drives: [],
      kpis,
      initiatives,
    };
  });
  const byId = new Map(objectives.map((o) => [o.id, o]));
  list.forEach((o, i) => {
    const me = objectives[i];
    const out = new Set<string>();
    for (const d of arr(o.drives)) {
      const target = idMap.get(str(d, 20));
      const t = target ? byId.get(target) : undefined;
      if (!t || t.id === me.id || RANK[t.perspective] <= RANK[me.perspective]) {
        dropped++;
        continue;
      }
      out.add(t.id);
    }
    me.drives = [...out];
  });
  return { objectives, dropped };
}
