"use client";

import { CheckCircle2, CircleAlert, CircleX, Loader2, RefreshCw } from "lucide-react";
import { Card, Pill, SeverityPill } from "./ui";
import { PART_HELP, PART_LABEL, PART_WEIGHT, PARTS, bandColor, type Quality, type Status } from "@/lib/rules";
import type { Study } from "@/lib/types";

function Ring({ value, band }: { value: number; band: string }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[148px] w-[148px] flex-none" role="img" aria-label={`Scorecard quality ${value} out of 100, ${band}`}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="13" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={bandColor(band)} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-5xl font-bold leading-none tnum">{value}</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: bandColor(band) }}>{band}</div>
        </div>
      </div>
    </div>
  );
}

const icon = (s: Status) =>
  s === "pass" ? <CheckCircle2 size={20} className="mt-0.5 flex-none text-ok" aria-label="Passed" /> : s === "warn" ? <CircleAlert size={20} className="mt-0.5 flex-none text-warn" aria-label="Needs attention" /> : <CircleX size={20} className="mt-0.5 flex-none text-bad" aria-label="Failed" />;

export default function ReviewTab({ study, quality, stale, busy, error, onRerun, canRun }: { study: Study; quality: Quality; stale: boolean; busy: boolean; error: string | null; onRerun: () => void; canRun: boolean }) {
  const c = study.critique;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-5">
            <Ring value={quality.overall} band={quality.band} />
            <div>
              <h2 className="font-display text-xl font-bold">Scorecard quality</h2>
              <p className="mt-1 text-sm text-mute">Out of 100. Plain rules check whether this is a scorecard a company could run. It does not judge how good the company is.</p>
              {quality.capped && <p className="mt-2 text-sm font-semibold text-warn">A failed check holds the score below Strong.</p>}
            </div>
          </div>
          <ul className="mt-5 space-y-3.5">
            {PARTS.map((p) => (
              <li key={p}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{PART_LABEL[p]} <span className="font-normal text-mute">weight {PART_WEIGHT[p]}%</span></span>
                  <span className="tnum text-sm font-bold">{quality.parts[p]}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${quality.parts[p]}%`, background: quality.parts[p] >= 65 ? "var(--ok)" : quality.parts[p] >= 40 ? "var(--warn)" : "var(--bad)" }} />
                </div>
                <p className="mt-1 text-xs text-mute">{PART_HELP[p]}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Rule checks</h2>
          <p className="mt-1 text-sm text-mute">These are code, not AI, so the same scorecard always gets the same result. They update when you edit values.</p>
          <ul className="mt-3 space-y-3">
            {quality.checks.map((k) => (
              <li key={k.id} className="flex gap-2.5 text-sm">
                {icon(k.status)}
                <div><p className="font-semibold">{k.title}</p><p className="text-mute">{k.detail}</p></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Independent review</h2>
            {c && <Pill tone="brand">{study.models.critique ?? c.model}</Pill>}
          </div>
          {stale && c && <p className="mt-2 rounded-lg bg-[#fbeed6] px-3 py-2 text-sm text-warn">The scorecard changed after this review. Run the review again to refresh it.</p>}
          {error && <p role="alert" className="mt-2 text-sm font-medium text-bad">{error}</p>}
          {!c ? (
            <p className="mt-2 text-sm text-mute" role="status">{busy ? "The independent review is running and usually takes under a minute. This page will update by itself." : "No review yet. A second AI model reads the scorecard cold and looks for gaps, weak KPIs and illogical links."}</p>
          ) : (
            <>
              <p className="mt-2 text-sm">{c.verdict}</p>
              {c.strengths.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {c.strengths.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 flex-none text-ok" aria-hidden />{s}</li>)}
                </ul>
              )}
            </>
          )}
          <button type="button" className="btn btn-ghost mt-4 !min-h-[38px] text-sm" onClick={onRerun} disabled={busy || !canRun}>
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <RefreshCw size={15} aria-hidden />} {c ? "Run the review again" : "Run the review"}
          </button>
        </Card>

        {c && c.issues.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">What to fix, by risk</h2>
            <ul className="mt-3 space-y-3.5">
              {c.issues.map((i) => (
                <li key={i.title} className="rounded-xl border border-line p-3.5">
                  <div className="flex flex-wrap items-center gap-2"><SeverityPill severity={i.severity} /><p className="font-semibold">{i.title}</p></div>
                  <p className="mt-1 text-sm text-mute">{i.detail}</p>
                  {i.objectiveIds.length > 0 && <p className="mt-1 text-xs text-mute">Objectives: {i.objectiveIds.join(", ")}</p>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {c && c.fixes.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">Suggested next moves</h2>
            <ol className="mt-3 space-y-3">
              {c.fixes.map((f, n) => (
                <li key={f.action} className="flex gap-3 text-sm">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-brand text-xs font-bold text-white" aria-hidden>{n + 1}</span>
                  <div><p className="font-semibold">{f.action}</p><p className="text-mute">{f.why} <span className="whitespace-nowrap">Impact: {f.impact}.</span></p></div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-mute">Use the box on the Scorecard tab to ask for any of these.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
