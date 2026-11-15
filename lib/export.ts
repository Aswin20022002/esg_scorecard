import { derive, quadrant, QUADRANT_LABEL } from "./materiality";
import { P_NAME } from "./perspectives";
import { assess } from "./rules";
import type { Study } from "./types";

function save(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: Study) => s.profile.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "scorecard";

export function downloadJson(s: Study) {
  save(`scorecard-${slug(s)}.json`, "application/json", JSON.stringify(s, null, 2));
}

const esc = (v: unknown) => {
  const x = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
};

/** Opens cleanly in Excel. The byte order mark keeps rupee signs and accents intact. */
export function downloadScorecardCsv(s: Study) {
  const head = ["perspective", "objective_id", "objective", "topics", "kpi_id", "kpi", "type", "unit", "baseline", "target", "target_year", "direction", "frequency", "owner", "data_source", "framework", "drives"];
  const rows: string[] = [];
  for (const o of s.objectives) {
    const topics = o.topicIds.map((t) => s.topics.find((x) => x.id === t)?.label ?? t).join("; ");
    const base = [P_NAME[o.perspective], o.id, o.title, topics];
    if (o.kpis.length === 0) rows.push([...base, "", "", "", "", "", "", "", "", "", "", "", "", o.drives.join(" ")].map(esc).join(","));
    for (const k of o.kpis) rows.push([...base, k.id, k.name, k.type, k.unit, k.baseline, k.target, k.targetYear, k.direction, k.frequency, k.owner, k.source, k.framework, o.drives.join(" ")].map(esc).join(","));
  }
  save(`scorecard-${slug(s)}.csv`, "text/csv;charset=utf-8", "﻿" + [head.join(","), ...rows].join("\n"));
}

export function downloadMatrixCsv(s: Study, threshold: number) {
  const head = ["topic", "group", "impact_score", "financial_score", "impact_low", "impact_high", "financial_low", "financial_high", "models_disagree", "result", "brsr", "esrs", "gri", "overridden"];
  const rows = s.topics.map((t) => {
    const d = derive(t);
    return [t.label, t.group, d.impact, d.financial, d.impactRange[0].toFixed(1), d.impactRange[1].toFixed(1), d.financialRange[0].toFixed(1), d.financialRange[1].toFixed(1), d.disagree ? "yes" : "no", QUADRANT_LABEL[quadrant(d, threshold)], t.brsr, t.esrs, t.gri, d.overridden ? "yes" : "no"].map(esc).join(",");
  });
  save(`materiality-${slug(s)}.csv`, "text/csv;charset=utf-8", "﻿" + [head.join(","), ...rows].join("\n"));
}

export function qualityLine(s: Study, threshold: number) {
  const q = assess(s.objectives, s.topics, threshold);
  return `${q.overall} (${q.band})`;
}
