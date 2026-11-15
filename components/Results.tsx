"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Printer, Grid3x3, Network, ListChecks, ShieldCheck } from "lucide-react";
import MaterialityTab from "./MaterialityTab";
import StrategyMap from "./StrategyMap";
import ScorecardTab from "./ScorecardTab";
import ReviewTab from "./ReviewTab";
import { Card, Pill } from "./ui";
import { DEFAULT_THRESHOLD } from "@/lib/materiality";
import { assess, bandColor } from "@/lib/rules";
import { downloadJson, downloadMatrixCsv, downloadScorecardCsv } from "@/lib/export";
import { materialTopics, derive } from "@/lib/materiality";
import { postJson, type Health } from "@/lib/api";
import { saveStudy } from "@/lib/store";
import { modelName, topicsWhy } from "@/lib/pipeline";
import type { Critique, Objective, Study } from "@/lib/types";

const TABS = [
  { id: "matrix", label: "Materiality", icon: Grid3x3 },
  { id: "map", label: "Strategy map", icon: Network },
  { id: "card", label: "Scorecard", icon: ListChecks },
  { id: "review", label: "Review", icon: ShieldCheck },
] as const;
type TabId = (typeof TABS)[number]["id"];

const TKEY = "esg-scorecard:threshold";

export default function Results({ initial, health, onNew, autoReview = false }: { initial: Study; health: Health | null; onNew: () => void; autoReview?: boolean }) {
  const [study, setStudy] = useState<Study>(initial);
  const [tab, setTab] = useState<TabId>("matrix");
  const [threshold, setThresholdState] = useState(DEFAULT_THRESHOLD);
  const [focus, setFocus] = useState<string | null>(null);
  const [history, setHistory] = useState<Objective[][]>([]);
  const [stale, setStale] = useState(false);
  const [revBusy, setRevBusy] = useState(false);
  const [revErr, setRevErr] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(TKEY));
      if (v >= 1.5 && v <= 4) setThresholdState(v);
    } catch {
      /* storage can be blocked */
    }
  }, []);

  const setThreshold = (n: number) => {
    setThresholdState(n);
    try {
      localStorage.setItem(TKEY, String(n));
    } catch {
      /* ignore */
    }
  };

  const update = useCallback((next: Study) => {
    setStudy(next);
    if (!next.demo) saveStudy(next);
  }, []);

  const quality = useMemo(() => assess(study.objectives, study.topics, threshold), [study.objectives, study.topics, threshold]);

  const onOverride = (id: string, ov: { impact: number; financial: number } | null) => {
    update({ ...study, topics: study.topics.map((t) => (t.id === id ? { ...t, override: ov ?? undefined } : t)) });
  };

  const onKpi = (kpiId: string, patch: Partial<{ baseline: string; target: string; targetYear: number | null; owner: string }>) => {
    update({ ...study, objectives: study.objectives.map((o) => ({ ...o, kpis: o.kpis.map((k) => (k.id === kpiId ? { ...k, ...patch } : k)) })) });
  };

  const refine = async (instruction: string) => {
    const r = await postJson<{ objectives: Objective[]; note: string }>("/api/refine", {
      profile: study.profile,
      instruction,
      objectives: study.objectives,
      extraIds: study.topics.filter((t) => t.custom).map((t) => t.id),
    });
    return r;
  };

  const onApplyRefine = (objs: Objective[], note: string) => {
    setHistory((h) => [...h, study.objectives]);
    setStale(true);
    update({ ...study, objectives: objs, critique: study.critique, warnings: study.warnings });
    void note;
  };

  const onUndo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    update({ ...study, objectives: prev });
  };

  const rerunReview = async () => {
    setRevBusy(true);
    setRevErr(null);
    try {
      const top = materialTopics(study.topics, threshold);
      const r = await postJson<{ critique: Critique; provider: string }>("/api/critique", {
        profile: study.profile,
        topics: top.map((t) => {
          const d = derive(t);
          return { id: t.id, label: t.label, impact: d.impact, financial: d.financial, why: topicsWhy(t) };
        }),
        objectives: study.objectives,
      });
      setStudy((prev) => {
        const next = { ...prev, critique: r.critique, models: { ...prev.models, critique: modelName(r.provider, r.critique.model) } };
        if (!next.demo) saveStudy(next);
        return next;
      });
      setStale(false);
    } catch (e) {
      setRevErr(e instanceof Error ? e.message : "The review failed.");
    } finally {
      setRevBusy(false);
    }
  };

  const started = useRef(false);
  useEffect(() => {
    if (autoReview && !started.current && !initial.critique) {
      started.current = true;
      void rerunReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openObjective = (id: string) => {
    setTab("card");
    setFocus(id);
    setTimeout(() => document.getElementById(`obj-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    setTimeout(() => setFocus(null), 2200);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[n].id);
    tabRefs.current[TABS[n].id]?.focus();
  };

  const canRun = !health || health.gemini || health.grok;

  return (
    <div className="pt-2">
      <Card className="print-break p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {study.demo && <Pill tone="viol">Sample</Pill>}
              <Pill tone="mute">{study.profile.sector}</Pill>
              <Pill tone="mute">Plan to {study.profile.horizon}</Pill>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{study.profile.company}</h1>
            <p className="mt-1.5 max-w-3xl text-mute">{study.summary}</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3">
            <div className="font-display text-4xl font-bold tnum" style={{ color: bandColor(quality.band) }}>{quality.overall}</div>
            <div className="text-sm"><p className="font-semibold">Scorecard quality</p><p style={{ color: bandColor(quality.band) }} className="font-semibold">{quality.band}</p></div>
          </div>
        </div>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary !min-h-[40px] text-sm" onClick={() => downloadScorecardCsv(study)}><FileSpreadsheet size={16} aria-hidden /> Scorecard for Excel</button>
          <button type="button" className="btn btn-ghost !min-h-[40px] text-sm" onClick={() => downloadMatrixCsv(study, threshold)}><Download size={16} aria-hidden /> Matrix for Excel</button>
          <button type="button" className="btn btn-ghost !min-h-[40px] text-sm" onClick={() => window.print()}><Printer size={16} aria-hidden /> Print or save as PDF</button>
          <button type="button" className="btn btn-ghost !min-h-[40px] text-sm" onClick={() => downloadJson(study)}><FileJson size={16} aria-hidden /> JSON</button>
          <button type="button" className="btn btn-ghost !min-h-[40px] text-sm ml-auto" onClick={onNew}>New scorecard</button>
        </div>
        <p className="mt-3 text-xs text-mute">
          Ratings: {study.models.a}{study.models.b ? ` and ${study.models.b}, rated separately` : ", single model"}. Built by {study.models.build}. {study.models.critique ? `Reviewed by ${study.models.critique}.` : "Not yet reviewed."}
          {study.report && ` Report: ${study.report.fileName}, ${study.report.usedPages} of ${study.report.numPages} pages used.`}
        </p>
        {study.warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5" aria-label="Notes about this result">
            {study.warnings.map((w) => <li key={w} className="rounded-lg bg-[#fbeed6] px-3 py-2 text-sm text-warn">{w}</li>)}
          </ul>
        )}
      </Card>

      <div role="tablist" aria-label="Sections" className="no-print mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[t.id] = el; }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-[3px] px-4 py-3 text-sm font-semibold ${tab === t.id ? "border-brand text-brand-ink" : "border-transparent text-mute hover:text-ink"}`}
          >
            <t.icon size={17} aria-hidden /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div role="tabpanel" id="panel-matrix" aria-labelledby="tab-matrix" hidden={tab !== "matrix"} className="panel">
          <MaterialityTab study={study} threshold={threshold} setThreshold={setThreshold} onOverride={onOverride} />
        </div>
        <div role="tabpanel" id="panel-map" aria-labelledby="tab-map" hidden={tab !== "map"} className="panel">
          <StrategyMap study={study} onOpen={openObjective} />
        </div>
        <div role="tabpanel" id="panel-card" aria-labelledby="tab-card" hidden={tab !== "card"} className="panel">
          <ScorecardTab study={study} focus={focus} onKpi={onKpi} onApplyRefine={onApplyRefine} onUndo={onUndo} canUndo={history.length > 0} refine={refine} health={health} showNotes={!stale} />
        </div>
        <div role="tabpanel" id="panel-review" aria-labelledby="tab-review" hidden={tab !== "review"} className="panel">
          <ReviewTab study={study} quality={quality} stale={stale} busy={revBusy} error={revErr} onRerun={rerunReview} canRun={!!canRun} />
        </div>
      </div>
    </div>
  );
}
