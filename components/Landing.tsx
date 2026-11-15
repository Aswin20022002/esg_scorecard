"use client";

import { useRef, useState } from "react";
import { FileUp, Grid3x3, Network, ListChecks, X } from "lucide-react";
import { Card } from "./ui";
import { SECTORS } from "@/lib/topics";
import type { Profile, Study } from "@/lib/types";
import type { Health } from "@/lib/api";

export default function Landing({
  onBuild,
  onSample,
  onOpen,
  history,
  health,
  error,
}: {
  onBuild: (p: Profile, file: File | null) => void;
  onSample: () => void;
  onOpen: (s: Study) => void;
  history: Study[];
  health: Health | null;
  error: string | null;
}) {
  const [p, setP] = useState<Profile>({ company: "", sector: SECTORS[0], geography: "", size: "", strategy: "", concerns: "", horizon: 2030 });
  const [file, setFile] = useState<File | null>(null);
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const noKeys = health && !health.gemini && !health.grok;
  const oneKey = health && health.gemini !== health.grok;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const missing = !p.company.trim();

  return (
    <div>
      <div className="grid items-start gap-8 pt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12 lg:pt-8">
        <div>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl lg:text-[3.2rem]">From material ESG topics to a strategy you can track.</h1>
          <p className="mt-5 max-w-xl text-lg text-mute">
            Describe a company. Two AI models rate which topics matter, then you get a strategy map and a balanced scorecard with KPIs, targets and owners, reviewed by a model that did not write it.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Grid3x3, t: "Materiality matrix", d: "Impact and financial scores from two models." },
              { icon: Network, t: "Strategy map", d: "Objectives linked from skills up to value." },
              { icon: ListChecks, t: "Scorecard", d: "KPIs with baseline, target, year and owner." },
            ].map((x) => (
              <li key={x.t} className="rounded-xl border border-line bg-surface p-3.5">
                <x.icon size={20} className="text-brand" aria-hidden />
                <p className="mt-2 font-display text-base font-bold">{x.t}</p>
                <p className="text-sm text-mute">{x.d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-ghost" onClick={onSample}>Try a sample first</button>
            <span className="text-sm text-mute">Fictional auto components company. No keys needed.</span>
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
              if (!missing) onBuild({ ...p, company: p.company.trim() }, file);
            }}
          >
            <h2 className="font-display text-xl font-bold">Describe the company</h2>
            <p className="mt-1 text-sm text-mute">Only the name is required. More detail gives a sharper result.</p>

            <div className="mt-4">
              <label htmlFor="company" className="text-sm font-semibold">Company name</label>
              <input id="company" className="field mt-1.5" value={p.company} onChange={(e) => set("company", e.target.value)} aria-invalid={tried && missing} aria-describedby={tried && missing ? "company-err" : undefined} autoComplete="off" />
              {tried && missing && <p id="company-err" role="alert" className="mt-1 text-sm font-medium text-bad">Enter the company name to continue.</p>}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div>
                <label htmlFor="sector" className="text-sm font-semibold">Sector</label>
                <select id="sector" className="field mt-1.5" value={p.sector} onChange={(e) => set("sector", e.target.value)}>
                  {SECTORS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="horizon" className="text-sm font-semibold">Plan up to year</label>
                <select id="horizon" className="field mt-1.5" value={p.horizon} onChange={(e) => set("horizon", Number(e.target.value))}>
                  {[2028, 2030, 2035, 2040, 2050].map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="geo" className="text-sm font-semibold">Where it operates</label>
                <input id="geo" className="field mt-1.5" placeholder="For example plants in Gujarat and Tamil Nadu" value={p.geography} onChange={(e) => set("geography", e.target.value)} />
              </div>
              <div>
                <label htmlFor="size" className="text-sm font-semibold">Size</label>
                <input id="size" className="field mt-1.5" placeholder="Revenue, employees" value={p.size} onChange={(e) => set("size", e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="strategy" className="text-sm font-semibold">Business strategy and ambitions</label>
              <textarea id="strategy" rows={3} className="field mt-1.5 py-2.5" placeholder="Where is the business heading in the next five years?" value={p.strategy} onChange={(e) => set("strategy", e.target.value)} />
            </div>
            <div className="mt-4">
              <label htmlFor="concerns" className="text-sm font-semibold">What stakeholders are asking for</label>
              <textarea id="concerns" rows={2} className="field mt-1.5 py-2.5" placeholder="Customer audits, investor questions, regulation, local issues" value={p.concerns} onChange={(e) => set("concerns", e.target.value)} />
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold">Sustainability or annual report <span className="font-normal text-mute">(optional)</span></p>
              <p className="text-sm text-mute">Adds quotes with page numbers and real baselines. The PDF is read in your browser and only relevant pages are sent.</p>
              <input ref={input} id="pdf" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-tint px-3.5 py-2.5 text-sm font-medium">
                  <span className="truncate">{file.name}</span>
                  <button type="button" className="rounded-lg p-1.5 hover:bg-white" aria-label="Remove file" onClick={() => { setFile(null); if (input.current) input.current.value = ""; }}><X size={16} /></button>
                </div>
              ) : (
                <label htmlFor="pdf" className="btn btn-ghost mt-2 cursor-pointer text-sm focus-within:outline"><FileUp size={16} aria-hidden /> Choose a PDF</label>
              )}
            </div>

            {error && <p role="alert" className="mt-4 rounded-xl bg-[#f9e3df] p-3 text-sm font-medium text-bad">{error}</p>}
            {noKeys && <p className="mt-4 rounded-xl bg-[#fbeed6] p-3 text-sm text-warn">No API keys were found on this server. Add GEMINI_API_KEY and XAI_API_KEY in Vercel to build your own. The sample still works.</p>}
            {oneKey && <p className="mt-4 rounded-xl bg-[#e6ede9] p-3 text-sm text-mute">Only one AI key is set, so one model does every step and the second opinion is skipped. Add the other key for the cross-check.</p>}

            <button type="submit" className="btn btn-primary mt-5 w-full sm:w-auto" disabled={!!noKeys}>Build the scorecard</button>
          </form>
        </Card>
      </div>

      {history.length > 0 && (
        <section className="mt-12" aria-labelledby="recent">
          <h2 id="recent" className="font-display text-2xl font-bold">Your recent scorecards</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 6).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onOpen(s)} className="w-full rounded-xl border border-line bg-surface p-4 text-left hover:border-brand">
                  <span className="block font-semibold">{s.profile.company}</span>
                  <span className="mt-0.5 block text-sm text-mute">{s.profile.sector}, {s.objectives.length} objectives</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
