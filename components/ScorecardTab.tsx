"use client";

import { useState } from "react";
import { Loader2, Pencil, Undo2, Wand2 } from "lucide-react";
import { Card, Pill } from "./ui";
import { P_NAME } from "@/lib/perspectives";
import { TOPIC_BY_ID } from "@/lib/topics";
import { kpiHasTarget } from "@/lib/rules";
import type { Kpi, Objective, Study } from "@/lib/types";

const EXAMPLES = ["Add an objective on product safety and quality", "Add a Scope 3 KPI for suppliers", "Make the targets more ambitious", "Cut the scorecard to the 15 most important KPIs"];

type KpiEdit = Partial<Pick<Kpi, "baseline" | "target" | "targetYear" | "owner">>;

function Field({ label, value, edit, onChange, wide = false, num = false }: { label: string; value: string; edit: boolean; onChange: (v: string) => void; wide?: boolean; num?: boolean }) {
  return (
    <div className={wide ? "md:col-span-1" : ""}>
      <dt className="text-xs text-mute md:sr-only">{label}</dt>
      <dd>
        {edit ? (
          <input aria-label={label} className="field !min-h-[36px] w-full px-2 text-sm" value={value} inputMode={num ? "numeric" : undefined} onChange={(e) => onChange(e.target.value)} />
        ) : value ? (
          <span className="text-sm">{value}</span>
        ) : (
          <span className="text-sm font-medium text-bad">Not set</span>
        )}
      </dd>
    </div>
  );
}

export default function ScorecardTab({
  study,
  focus,
  onKpi,
  onApplyRefine,
  onUndo,
  canUndo,
  refine,
  health,
  showNotes,
}: {
  study: Study;
  focus: string | null;
  onKpi: (kpiId: string, patch: KpiEdit) => void;
  onApplyRefine: (objs: Objective[], note: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  refine: (instruction: string) => Promise<{ objectives: Objective[]; note: string }>;
  health: { gemini: boolean; grok: boolean } | null;
  showNotes: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const notes = new Map((showNotes ? study.critique?.kpiNotes ?? [] : []).map((n) => [n.kpiId, n]));
  const noKeys = health && !health.gemini && !health.grok;

  const apply = async () => {
    if (text.trim().length < 5 || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await refine(text.trim());
      onApplyRefine(r.objectives, r.note);
      setMsg({ ok: true, text: r.note || "Scorecard updated." });
      setText("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "The change failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="no-print p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Change it by asking</h2>
        <p className="mt-1 text-sm text-mute">Describe a change in plain words. Everything you did not mention stays as it is, and you can undo.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example changes">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-brand" onClick={() => setText(x)}>{x}</button>
          ))}
        </div>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); apply(); }}>
          <label htmlFor="refine" className="sr-only">Describe the change</label>
          <input id="refine" className="field flex-1" maxLength={500} placeholder="For example: add an objective on data privacy" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={busy || text.trim().length < 5 || !!noKeys}>
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Wand2 size={16} aria-hidden />} {busy ? "Changing" : "Apply change"}
          </button>
          {canUndo && <button type="button" className="btn btn-ghost" onClick={() => { onUndo(); setMsg({ ok: true, text: "Change undone." }); }}><Undo2 size={16} aria-hidden /> Undo</button>}
        </form>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm font-medium ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</p>}
        {study.demo && <p className="mt-2 text-xs text-mute">This is the sample, so changes need API keys on the server.</p>}
      </Card>

      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-mute">Baselines, targets, years and owners are proposals. Edit them to match what the business will commit to.</p>
        <button type="button" aria-pressed={edit} className={`btn !min-h-[38px] text-sm ${edit ? "btn-primary" : "btn-ghost"}`} onClick={() => setEdit(!edit)}>
          <Pencil size={15} aria-hidden /> {edit ? "Done editing" : "Edit values"}
        </button>
      </div>

      {study.objectives.map((o) => (
        <Card key={o.id} className={`print-break p-4 sm:p-5 ${focus === o.id ? "flash" : ""}`}>
          <div id={`obj-${o.id}`} className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">{o.id}</Pill>
              <span className="text-sm text-mute">{P_NAME[o.perspective]}</span>
            </div>
            <h3 className="mt-1.5 font-display text-lg font-bold">{o.title}</h3>
            {o.why && <p className="mt-1 max-w-3xl text-sm text-mute">{o.why}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {o.topicIds.map((t) => <Pill key={t} tone="mute">{TOPIC_BY_ID[t]?.label ?? study.topics.find((x) => x.id === t)?.label ?? t}</Pill>)}
              {o.drives.length > 0 && <Pill tone="ok">Drives {o.drives.join(", ")}</Pill>}
            </div>
          </div>

          <div className="mt-4 hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] gap-3 border-b border-line pb-1.5 text-xs font-semibold text-mute md:grid">
            <span>KPI</span><span>Baseline</span><span>Target</span><span>Year</span><span>Owner and data source</span>
          </div>
          <ul className="divide-y divide-line">
            {o.kpis.length === 0 && <li className="py-3 text-sm font-medium text-bad">No KPI yet. Ask for one above.</li>}
            {o.kpis.map((k) => {
              const n = notes.get(k.id);
              return (
                <li key={k.id} className="py-3">
                  <dl className="grid gap-x-3 gap-y-2 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.4fr)]">
                    <div>
                      <dt className="sr-only">KPI</dt>
                      <dd>
                        <span className="text-sm font-semibold">{k.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-mute">
                          <Pill tone={k.type === "leading" ? "viol" : "mute"}>{k.type === "leading" ? "Leading" : "Lagging"}</Pill>
                          {k.unit} {k.direction === "up" ? "(higher is better)" : "(lower is better)"}{k.framework && <> , {k.framework}</>}
                        </span>
                      </dd>
                    </div>
                    <Field label="Baseline" value={k.baseline} edit={edit} onChange={(v) => onKpi(k.id, { baseline: v })} />
                    <Field label="Target" value={k.target} edit={edit} onChange={(v) => onKpi(k.id, { target: v })} />
                    <Field label="Year" value={k.targetYear ? String(k.targetYear) : ""} edit={edit} num onChange={(v) => onKpi(k.id, { targetYear: Number(v.replace(/\D/g, "").slice(0, 4)) || null })} />
                    <div>
                      <dt className="text-xs text-mute md:sr-only">Owner and data source</dt>
                      <dd className="text-sm">
                        {edit ? <input aria-label="Owner" className="field !min-h-[36px] w-full px-2 text-sm" value={k.owner} onChange={(e) => onKpi(k.id, { owner: e.target.value })} /> : k.owner || <span className="font-medium text-bad">No owner</span>}
                        {!edit && k.source && <span className="block text-xs text-mute">{k.source}</span>}
                      </dd>
                    </div>
                  </dl>
                  {!kpiHasTarget(k.target) && k.target.trim() && <p className="mt-1 text-xs text-warn">This target has no number, so it cannot be measured.</p>}
                  {n && (
                    <p className="mt-1.5 text-sm">
                      <Pill tone={n.rating === "strong" ? "ok" : n.rating === "weak" ? "bad" : "warn"}>Reviewer: {n.rating}</Pill> <span className="text-mute">{n.note}</span>
                      {n.better && <span className="block text-mute">Better version: {n.better}</span>}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {o.initiatives.length > 0 && (
            <div className="mt-2 rounded-xl bg-paper p-3">
              <p className="text-sm font-semibold">Initiatives</p>
              <ul className="mt-1 space-y-0.5 text-sm text-mute">
                {o.initiatives.map((i) => <li key={i.name}>{i.name}{i.owner && `, ${i.owner}`}{i.timeline && `, ${i.timeline}`}</li>)}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
