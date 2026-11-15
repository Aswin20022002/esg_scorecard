"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Card } from "./ui";
import Matrix from "./Matrix";
import type { StepState } from "@/lib/pipeline";
import type { Topic } from "@/lib/types";

export default function Progress({ company, readInfo, steps, topics }: { company: string; readInfo: string | null; steps: StepState[]; topics: Topic[] }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pt-4">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Building the scorecard for {company}</h1>
      <p className="mt-1 text-sm font-semibold text-brand-ink tnum" aria-hidden>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")} elapsed</p>
      <p className="mt-2 max-w-2xl text-mute">Usually about a minute. The matrix appears as soon as both models have rated the topics, and the independent review finishes after the results are shown. You can leave this tab open.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <Card className="p-5">
          <ol className="space-y-3.5" aria-live="polite">
            {readInfo && (
              <li className="flex items-start gap-3">
                {readInfo.startsWith("Read") ? <CheckCircle2 className="mt-0.5 text-ok" size={20} aria-hidden /> : <Loader2 className="mt-0.5 animate-spin text-brand" size={20} aria-hidden />}
                <div><div className="font-semibold">Reading the PDF in your browser</div><div className="text-sm text-mute">{readInfo}</div></div>
              </li>
            )}
            {steps.map((s) => (
              <li key={s.id} className="flex items-start gap-3">
                {s.state === "done" ? <CheckCircle2 className="mt-0.5 flex-none text-ok" size={20} aria-hidden /> : s.state === "error" ? <XCircle className="mt-0.5 flex-none text-bad" size={20} aria-hidden /> : s.state === "run" ? <Loader2 className="mt-0.5 flex-none animate-spin text-brand" size={20} aria-hidden /> : <Circle className="mt-0.5 flex-none text-line" size={20} aria-hidden />}
                <div>
                  <div className={`font-semibold ${s.state === "wait" ? "text-mute" : ""}`}>{s.label}</div>
                  {s.detail && <div className={`text-sm ${s.state === "error" ? "text-bad" : "text-mute"}`}>{s.detail}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Materiality matrix</h2>
          {topics.length === 0 ? (
            <p className="mt-2 text-sm text-mute">Waiting for the models to finish rating the topics.</p>
          ) : (
            <div className="mt-3"><Matrix topics={topics} threshold={2.5} selected={null} onSelect={() => {}} /></div>
          )}
        </Card>
      </div>
    </div>
  );
}
