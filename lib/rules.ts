import { derive, materialTopics } from "./materiality";
import { RANK, PERSPECTIVES } from "./perspectives";
import type { Objective, Topic } from "./types";

export type Status = "pass" | "warn" | "fail";
export interface Check {
  id: string;
  part: "coverage" | "linkage" | "measurability" | "balance";
  title: string;
  status: Status;
  detail: string;
}

export const PARTS = ["coverage", "linkage", "measurability", "balance"] as const;
export type Part = (typeof PARTS)[number];
export const PART_WEIGHT: Record<Part, number> = { coverage: 30, linkage: 20, measurability: 30, balance: 20 };
export const PART_LABEL: Record<Part, string> = { coverage: "Coverage", linkage: "Linkage", measurability: "Measurability", balance: "Balance" };
export const PART_HELP: Record<Part, string> = {
  coverage: "Do the objectives address the topics that matter most?",
  linkage: "Do objectives connect into a chain that ends in value?",
  measurability: "Does every KPI have a baseline, a target and a year?",
  balance: "Are all four views present, with early signals as well as results?",
};

export interface Quality {
  overall: number;
  /** True when a failed check held the score below the Strong band */
  capped: boolean;
  band: "Strong" | "Solid" | "Patchy" | "Weak";
  parts: Record<Part, number>;
  checks: Check[];
  uncovered: Topic[];
  counts: { objectives: number; kpis: number; leading: number; withBaseline: number; withNumericTarget: number; withYear: number; links: number };
}

const hasNumber = (s: string) => /\d/.test(s) || /\b(zero|net zero|double|halve|triple)\b/i.test(s);
const hasBaseline = (s: string) => !!s.trim() && !/^(n\/?a|tbd|unknown|not known|to be|none|-)/i.test(s.trim());
export const kpiHasTarget = (t: string) => !!t.trim() && hasNumber(t);

const st = (ratio: number, pass: number, warn: number): Status => (ratio >= pass ? "pass" : ratio >= warn ? "warn" : "fail");
const pct = (x: number) => `${Math.round(x * 100)}%`;
const bandFor = (n: number): Quality["band"] => (n >= 80 ? "Strong" : n >= 65 ? "Solid" : n >= 45 ? "Patchy" : "Weak");

export function assess(objectives: Objective[], topics: Topic[], threshold: number): Quality {
  const checks: Check[] = [];
  const kpis = objectives.flatMap((o) => o.kpis.map((k) => ({ o, k })));
  const must = materialTopics(topics, threshold);
  const covered = new Set(objectives.flatMap((o) => o.topicIds));
  const uncovered = must.filter((t) => !covered.has(t.id));

  // Coverage, weighted by priority so missing a top topic costs more
  const wTotal = must.reduce((s, t) => s + derive(t).priority, 0) || 1;
  const wCovered = must.filter((t) => covered.has(t.id)).reduce((s, t) => s + derive(t).priority, 0);
  const coverage = must.length ? wCovered / wTotal : 1;
  checks.push({
    id: "cov_material",
    part: "coverage",
    title: "Every material topic has an objective",
    status: must.length === 0 || uncovered.length === 0 ? "pass" : uncovered.some((t) => derive(t).priority >= 3.5) || uncovered.length > 1 ? "fail" : "warn",
    detail: must.length === 0 ? "No topic is above the materiality line." : uncovered.length === 0 ? `All ${must.length} top material topics are covered.` : `Not covered: ${uncovered.map((t) => t.label).join(", ")}.`,
  });
  const orphanTopics = objectives.filter((o) => o.topicIds.length === 0);
  checks.push({
    id: "cov_orphan",
    part: "coverage",
    title: "Every objective traces back to a topic",
    status: orphanTopics.length === 0 ? "pass" : "warn",
    detail: orphanTopics.length === 0 ? "Each objective names the material topics it answers." : `No topic named for: ${orphanTopics.map((o) => o.title).join(", ")}.`,
  });

  // Linkage
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const nonFin = objectives.filter((o) => o.perspective !== "financial");
  const linked = nonFin.filter((o) => o.drives.some((d) => byId.has(d) && RANK[byId.get(d)!.perspective] > RANK[o.perspective]));
  const linkShare = nonFin.length ? linked.length / nonFin.length : 1;
  const incoming = new Set(objectives.flatMap((o) => o.drives));
  const dangling = objectives.filter((o) => RANK[o.perspective] > 0 && !incoming.has(o.id) && o.perspective !== "financial");
  const finOnly = objectives.filter((o) => o.perspective === "financial");
  const finFed = finOnly.filter((o) => incoming.has(o.id));
  checks.push({
    id: "link_up",
    part: "linkage",
    title: "Each objective drives one in a higher view",
    status: st(linkShare, 0.999, 0.75),
    detail: nonFin.length === 0 ? "No operating objectives to link." : `${linked.length} of ${nonFin.length} objectives have an upward link (${pct(linkShare)}).`,
  });
  checks.push({
    id: "link_fin",
    part: "linkage",
    title: "Value objectives are fed by operating objectives",
    status: finOnly.length === 0 ? "fail" : finFed.length === finOnly.length ? "pass" : finFed.length > 0 ? "warn" : "fail",
    detail: finOnly.length === 0 ? "There is no financial and value objective, so the chain has no end point." : `${finFed.length} of ${finOnly.length} financial objectives receive at least one link.`,
  });
  checks.push({
    id: "link_chain",
    part: "linkage",
    title: "A full chain runs from capability to value",
    status: hasChain(objectives) ? "pass" : "fail",
    detail: hasChain(objectives) ? "At least one path runs from People and systems through to Financial." : "No path connects the bottom view to the financial view.",
  });
  void dangling;

  // Measurability
  const n = kpis.length || 1;
  const withBase = kpis.filter(({ k }) => hasBaseline(k.baseline)).length;
  const withNum = kpis.filter(({ k }) => kpiHasTarget(k.target)).length;
  const withYear = kpis.filter(({ k }) => k.targetYear !== null && k.targetYear >= 2026 && k.targetYear <= 2050).length;
  const measurability = kpis.length ? (withBase + withNum + withYear) / (3 * n) : 0;
  checks.push({ id: "m_num", part: "measurability", title: "KPIs have a numeric target", status: st(withNum / n, 0.95, 0.75), detail: `${withNum} of ${kpis.length} KPIs carry a number in the target.` });
  checks.push({ id: "m_year", part: "measurability", title: "KPIs have a target year", status: st(withYear / n, 0.95, 0.75), detail: `${withYear} of ${kpis.length} KPIs have a year between 2026 and 2050.` });
  checks.push({ id: "m_base", part: "measurability", title: "KPIs have a baseline", status: st(withBase / n, 0.8, 0.5), detail: `${withBase} of ${kpis.length} KPIs state a baseline. A target without a starting point cannot be tracked.` });
  const noKpi = objectives.filter((o) => o.kpis.length === 0);
  const tooMany = objectives.filter((o) => o.kpis.length > 3);
  checks.push({
    id: "m_each",
    part: "measurability",
    title: "Each objective has one to three KPIs",
    status: noKpi.length ? "fail" : tooMany.length ? "warn" : "pass",
    detail: noKpi.length ? `No KPI for: ${noKpi.map((o) => o.title).join(", ")}.` : tooMany.length ? `More than three KPIs for: ${tooMany.map((o) => o.title).join(", ")}.` : "Every objective has a focused set of KPIs.",
  });

  // Balance
  const present = PERSPECTIVES.filter((p) => objectives.some((o) => o.perspective === p.id));
  const leading = kpis.filter(({ k }) => k.type === "leading").length;
  const leadShare = kpis.length ? leading / kpis.length : 0;
  const names = new Set<string>();
  let dup = 0;
  for (const { k } of kpis) {
    const key = k.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (names.has(key)) dup++;
    names.add(key);
  }
  const countOk = kpis.length >= 10 && kpis.length <= 30;
  const balance = Math.min(1, present.length / 4) * 0.4 + Math.min(1, leadShare / 0.3) * 0.35 + (countOk ? 1 : kpis.length >= 6 && kpis.length <= 36 ? 0.5 : 0) * 0.15 + (dup === 0 ? 1 : 0) * 0.1;
  checks.push({
    id: "b_views",
    part: "balance",
    title: "All four views are present",
    status: present.length === 4 ? "pass" : present.length === 3 ? "warn" : "fail",
    detail: present.length === 4 ? "Financial, stakeholder, process and learning views all have objectives." : `Missing: ${PERSPECTIVES.filter((p) => !present.includes(p)).map((p) => p.name).join(", ")}.`,
  });
  checks.push({
    id: "b_lead",
    part: "balance",
    title: "At least 30% of KPIs are leading",
    status: st(leadShare, 0.3, 0.15),
    detail: `${leading} of ${kpis.length} KPIs are leading indicators (${pct(leadShare)}). Leading KPIs warn early, lagging ones confirm results.`,
  });
  checks.push({
    id: "b_count",
    part: "balance",
    title: "The scorecard stays focused",
    status: countOk ? "pass" : kpis.length >= 6 && kpis.length <= 36 ? "warn" : "fail",
    detail: `${kpis.length} KPIs in total. Between 10 and 30 is a scorecard people can actually manage.${dup ? ` ${dup} duplicate KPI name(s).` : ""}`,
  });

  const parts: Record<Part, number> = {
    coverage: Math.round(coverage * 100),
    linkage: Math.round((linkShare * 0.5 + (finOnly.length ? finFed.length / finOnly.length : 0) * 0.25 + (hasChain(objectives) ? 1 : 0) * 0.25) * 100),
    measurability: Math.round(measurability * 100),
    balance: Math.round(balance * 100),
  };
  const raw = Math.round(PARTS.reduce((s, p) => s + parts[p] * PART_WEIGHT[p], 0) / 100);
  // A failed check keeps the scorecard out of the top band, however well the rest scores.
  const capped = raw > 79 && checks.some((c) => c.status === "fail");
  const overall = capped ? 79 : raw;
  return {
    overall,
    capped,
    band: bandFor(overall),
    parts,
    checks,
    uncovered,
    counts: { objectives: objectives.length, kpis: kpis.length, leading, withBaseline: withBase, withNumericTarget: withNum, withYear, links: objectives.reduce((s, o) => s + o.drives.length, 0) },
  };
}

function hasChain(objectives: Objective[]): boolean {
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const memo = new Map<string, boolean>();
  const reachesFin = (id: string, seen = new Set<string>()): boolean => {
    if (memo.has(id)) return memo.get(id)!;
    const o = byId.get(id);
    if (!o || seen.has(id)) return false;
    seen.add(id);
    const ok = o.perspective === "financial" || o.drives.some((d) => reachesFin(d, seen));
    memo.set(id, ok);
    return ok;
  };
  const bottoms = objectives.filter((o) => o.perspective === "learning");
  return bottoms.some((o) => reachesFin(o.id));
}

export const bandColor = (band: string) => (band === "Strong" ? "var(--ok)" : band === "Solid" ? "var(--brand)" : band === "Patchy" ? "var(--warn)" : "var(--bad)");
