import type { Objective, Profile } from "../types";

const s = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function parseProfile(x: unknown): Profile | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const company = s(o.company, 120);
  if (!company) return null;
  const h = Number(o.horizon);
  return {
    company,
    sector: s(o.sector, 80) || "Other",
    geography: s(o.geography, 160),
    size: s(o.size, 160),
    strategy: s(o.strategy, 1200),
    concerns: s(o.concerns, 800),
    horizon: Number.isFinite(h) && h >= 2027 && h <= 2050 ? Math.round(h) : 2030,
  };
}

/** Accepts objectives sent back from the browser and keeps only safe, known fields. */
export function parseObjectives(x: unknown): Objective[] {
  if (!Array.isArray(x)) return [];
  return x.slice(0, 16).map((raw, i) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const kp = Array.isArray(o.kpis) ? o.kpis.slice(0, 5) : [];
    return {
      id: s(o.id, 20) || `O${i + 1}`,
      perspective: (["financial", "stakeholder", "process", "learning"].includes(o.perspective as string) ? o.perspective : "process") as Objective["perspective"],
      title: s(o.title, 120),
      why: s(o.why, 320),
      topicIds: Array.isArray(o.topicIds) ? o.topicIds.map((t) => s(t, 40)).filter(Boolean).slice(0, 8) : [],
      drives: Array.isArray(o.drives) ? o.drives.map((t) => s(t, 20)).filter(Boolean).slice(0, 8) : [],
      kpis: kp.map((k, j) => {
        const q = (k ?? {}) as Record<string, unknown>;
        const yr = Number(q.targetYear);
        return {
          id: s(q.id, 20) || `K${i}_${j}`,
          name: s(q.name, 110),
          type: q.type === "leading" ? "leading" : "lagging",
          unit: s(q.unit, 40),
          baseline: s(q.baseline, 80),
          target: s(q.target, 100),
          targetYear: Number.isFinite(yr) && yr > 2000 ? Math.round(yr) : null,
          direction: q.direction === "up" ? "up" : "down",
          frequency: s(q.frequency, 30),
          owner: s(q.owner, 60),
          source: s(q.source, 80),
          framework: s(q.framework, 60),
        };
      }),
      initiatives: Array.isArray(o.initiatives)
        ? o.initiatives.slice(0, 3).map((n) => {
            const q = (n ?? {}) as Record<string, unknown>;
            return { name: s(q.name, 140), owner: s(q.owner, 60), timeline: s(q.timeline, 40) };
          })
        : [],
    };
  });
}

export const cleanText = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
