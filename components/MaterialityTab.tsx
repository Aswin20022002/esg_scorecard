"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import Matrix from "./Matrix";
import { Card, EvidencePill, ModelsPill, Pill } from "./ui";
import { DEFAULT_THRESHOLD, QUADRANT_LABEL, quadrant, ranked, type Quadrant } from "@/lib/materiality";
import { GROUP_COLOR, GROUP_NAME } from "@/lib/topics";
import type { Rating, Study } from "@/lib/types";

const qTone: Record<Quadrant, "ok" | "brand" | "warn" | "mute"> = { double: "ok", impact: "brand", financial: "warn", none: "mute" };

function ModelView({ name, r }: { name: string; r: Rating }) {
  return (
    <div className="rounded-xl bg-paper p-3.5 text-sm">
      <p className="font-semibold">{name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-mute">Impact</dt>
        <dd>{r.impactReason || "No reason given."} <span className="tnum text-mute">(scale {r.scale}, scope {r.scope}, irreversibility {r.irremediability}, likelihood {r.impactLikelihood})</span></dd>
        <dt className="text-mute">Finances</dt>
        <dd>{r.financialReason || "No reason given."} <span className="tnum text-mute">(size {r.magnitude}, likelihood {r.financialLikelihood})</span></dd>
      </dl>
      {r.quote && (
        <blockquote className="mt-2.5 border-l-4 border-line pl-3 text-mute">
          &ldquo;{r.quote}&rdquo;{r.page ? <span className="ml-1 whitespace-nowrap">PDF page {r.page}</span> : null}
          <div className="mt-1"><EvidencePill evidence={r.evidence} /></div>
        </blockquote>
      )}
    </div>
  );
}

export default function MaterialityTab({
  study,
  threshold,
  setThreshold,
  onOverride,
}: {
  study: Study;
  threshold: number;
  setThreshold: (n: number) => void;
  onOverride: (id: string, ov: { impact: number; financial: number } | null) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const list = ranked(study.topics);
  const material = list.filter((x) => quadrant(x.d, threshold) !== "none").length;
  const cur = list.find((x) => x.t.id === sel);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="thr" className="flex justify-between text-sm font-semibold">
              <span>Materiality line</span>
              <span className="tnum text-brand-ink">{threshold.toFixed(1)} of 5, {material} of {list.length} topics above it</span>
            </label>
            <input id="thr" type="range" min={1.5} max={4} step={0.1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--brand)]" />
          </div>
          <button type="button" className="btn btn-ghost !min-h-[38px] text-sm" onClick={() => setThreshold(DEFAULT_THRESHOLD)} disabled={threshold === DEFAULT_THRESHOLD}>
            <RotateCcw size={15} aria-hidden /> Reset to 2.5
          </button>
        </div>
        <p className="mt-1 text-xs text-mute">There is no official cut-off, so the line is yours to set. A topic is material if it is above the line on either side.</p>
        <div className="mt-3">
          <Matrix topics={study.topics} threshold={threshold} selected={sel} onSelect={setSel} />
        </div>
      </Card>

      <div className="space-y-6">
        {cur ? (
          <Card className="p-5" >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: GROUP_COLOR[cur.t.group] }}>{GROUP_NAME[cur.t.group]}{cur.t.custom ? ", added by the AI for this company" : ""}</p>
                <h3 className="font-display text-xl font-bold">{cur.rank}. {cur.t.label}</h3>
              </div>
              <Pill tone={qTone[quadrant(cur.d, threshold)]}>{QUADRANT_LABEL[quadrant(cur.d, threshold)]}</Pill>
            </div>
            <p className="mt-2 text-sm">
              Impact <strong className="tnum">{cur.d.impact}</strong> and financial <strong className="tnum">{cur.d.financial}</strong>
              {cur.d.models === 2 && <span className="ml-2 inline-block"><ModelsPill disagree={cur.d.disagree} /></span>}
              {cur.d.overridden && <span className="ml-2 inline-block"><Pill tone="viol">Your override</Pill></span>}
            </p>
            {(cur.t.brsr || cur.t.gri) && <p className="mt-1 text-xs text-mute">Maps to BRSR {cur.t.brsr}, ESRS {cur.t.esrs}, {cur.t.gri}.</p>}
            <div className="mt-3 space-y-2.5">
              {cur.t.a && <ModelView name={study.models.a} r={cur.t.a} />}
              {cur.t.b && study.models.b && <ModelView name={study.models.b} r={cur.t.b} />}
            </div>
            <fieldset className="mt-4 rounded-xl border border-line p-3.5">
              <legend className="px-1 text-sm font-semibold">Your own call</legend>
              <p className="text-xs text-mute">Disagree with the models? Set your scores. This replaces the average and flows into the scorecard checks.</p>
              {(["impact", "financial"] as const).map((k) => (
                <div key={k} className="mt-2">
                  <label htmlFor={`ov-${k}`} className="flex justify-between text-sm"><span>{k === "impact" ? "Impact" : "Financial"}</span><span className="tnum">{cur.d[k].toFixed(1)}</span></label>
                  <input id={`ov-${k}`} type="range" min={0.5} max={5} step={0.1} value={cur.d[k]} className="w-full accent-[var(--brand)]" onChange={(e) => onOverride(cur.t.id, { impact: k === "impact" ? Number(e.target.value) : cur.d.impact, financial: k === "financial" ? Number(e.target.value) : cur.d.financial })} />
                </div>
              ))}
              {cur.d.overridden && <button type="button" className="btn btn-ghost mt-2 !min-h-[36px] text-sm" onClick={() => onOverride(cur.t.id, null)}><RotateCcw size={14} aria-hidden /> Back to the models</button>}
            </fieldset>
          </Card>
        ) : (
          <Card className="p-5">
            <h3 className="font-display text-lg font-bold">Select a topic</h3>
            <p className="mt-1 text-sm text-mute">Pick a dot on the matrix or a row below to see why both models scored it that way, and to set your own score.</p>
          </Card>
        )}

        <Card className="p-2 sm:p-3">
          <h3 className="px-2 pb-1 pt-2 font-display text-lg font-bold">Topics ranked by priority</h3>
          <ol className="max-h-[430px] overflow-y-auto">
            {list.map(({ t, d, rank }) => (
              <li key={t.id}>
                <button type="button" onClick={() => setSel(t.id)} aria-current={sel === t.id} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-paper ${sel === t.id ? "bg-tint" : ""}`}>
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold text-white" style={{ background: GROUP_COLOR[t.group] }} aria-hidden>{rank}</span>
                  <span className="flex-1 font-medium">{t.label}{d.disagree && <span className="ml-1.5 text-bad" title="Models disagree">(models differ)</span>}</span>
                  <span className="tnum text-mute">{d.impact} / {d.financial}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${quadrant(d, threshold) === "none" ? "bg-line" : "bg-brand"}`} aria-label={quadrant(d, threshold) === "none" ? "Below the line" : "Material"} />
                </button>
              </li>
            ))}
          </ol>
          <p className="px-2.5 pb-2 pt-1 text-xs text-mute">Scores show impact / financial, out of 5.</p>
        </Card>
      </div>
    </div>
  );
}
