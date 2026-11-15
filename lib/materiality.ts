import type { Rating, Topic } from "./types";

export const DEFAULT_THRESHOLD = 2.5;

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Impact materiality: how severe the company's effect on people and planet is, times how likely. Range 0.2 to 5. */
export function impactOf(r: Rating): number {
  const severity = avg([r.scale, r.scope, r.irremediability]);
  return severity * (r.impactLikelihood / 5);
}

/** Financial materiality: how large the effect on the company's finances could be, times how likely. Range 0.2 to 5. */
export function financialOf(r: Rating): number {
  return r.magnitude * (r.financialLikelihood / 5);
}

export type Quadrant = "double" | "impact" | "financial" | "none";

export interface Derived {
  impact: number;
  financial: number;
  impactRange: [number, number];
  financialRange: [number, number];
  /** True when the two models differ by one point or more on either axis */
  disagree: boolean;
  models: number;
  overridden: boolean;
  priority: number;
}

export function derive(t: Topic): Derived {
  const rs = [t.a, t.b].filter((x): x is Rating => !!x);
  const imps = rs.map(impactOf);
  const fins = rs.map(financialOf);
  const impact = imps.length ? avg(imps) : 0;
  const financial = fins.length ? avg(fins) : 0;
  const ov = t.override;
  const i = ov ? ov.impact : impact;
  const f = ov ? ov.financial : financial;
  const range = (xs: number[]): [number, number] => (xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 0]);
  const ir = range(imps);
  const fr = range(fins);
  return {
    impact: r1(i),
    financial: r1(f),
    impactRange: ir,
    financialRange: fr,
    disagree: rs.length === 2 && (ir[1] - ir[0] >= 1 || fr[1] - fr[0] >= 1),
    models: rs.length,
    overridden: !!ov,
    priority: Math.max(i, f) + 0.01 * (i + f),
  };
}

export function quadrant(d: Derived, threshold: number): Quadrant {
  const i = d.impact >= threshold;
  const f = d.financial >= threshold;
  return i && f ? "double" : i ? "impact" : f ? "financial" : "none";
}

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  double: "Material on both sides",
  impact: "Material for impact",
  financial: "Material for finances",
  none: "Below the line, monitor",
};

/** Material topics ranked by priority. The scorecard is built for the top of this list. */
export function materialTopics(topics: Topic[], threshold: number, cap = 8): Topic[] {
  return topics
    .map((t) => ({ t, d: derive(t) }))
    .filter((x) => quadrant(x.d, threshold) !== "none")
    .sort((x, y) => y.d.priority - x.d.priority)
    .slice(0, cap)
    .map((x) => x.t);
}

export function clamp15(n: unknown, fallback = 3): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(5, Math.max(1, Math.round(v)));
}

/** Topics sorted from most to least important. The rank is the number shown on the matrix. */
export function ranked(topics: Topic[]): { t: Topic; d: Derived; rank: number }[] {
  return topics
    .map((t) => ({ t, d: derive(t) }))
    .sort((x, y) => y.d.priority - x.d.priority)
    .map((x, i) => ({ ...x, rank: i + 1 }));
}
