"use client";

import { useCallback, useEffect, useState } from "react";
import Landing from "@/components/Landing";
import Progress from "@/components/Progress";
import Results from "@/components/Results";
import { getHealth, type Health } from "@/lib/api";
import { readPdf } from "@/lib/pdf";
import { runStudy, STEP_DEFS, type StepState } from "@/lib/pipeline";
import { sampleStudy } from "@/lib/sample";
import { deleteStudy, loadStudies, saveStudy } from "@/lib/store";
import type { Profile, Study, Topic } from "@/lib/types";

type View = { kind: "home" } | { kind: "running"; company: string } | { kind: "results"; study: Study };

export default function Page() {
  const [view, setView] = useState<View>({ kind: "home" });
  const [health, setHealth] = useState<Health | null>(null);
  const [history, setHistory] = useState<Study[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [readInfo, setReadInfo] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    getHealth().then(setHealth);
    setHistory(loadStudies());
  }, []);

  const set = useCallback((id: string, state: StepState["state"], detail = "") => {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, state, detail } : x)));
  }, []);

  const build = async (profile: Profile, file: File | null) => {
    setError(null);
    setTopics([]);
    setReadInfo(null);
    setSteps(STEP_DEFS.map((s) => ({ ...s, state: "wait", detail: "" })));
    setView({ kind: "running", company: profile.company });
    window.scrollTo({ top: 0 });
    try {
      let pdf = null;
      if (file) {
        setReadInfo("Starting");
        pdf = await readPdf(file, (d, t) => setReadInfo(`Page ${d} of ${t}`));
        if (pdf.scanned) throw new Error("This PDF looks scanned (images, not text). Run OCR on it first, or build without a report.");
        setReadInfo(`Read ${pdf.numPages} pages`);
      }
      const study = await runStudy({ profile, pdf, health, set, onTopics: setTopics });
      setHistory(saveStudy(study));
      setView({ kind: "results", study });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setView({ kind: "home" });
    }
  };

  const open = (s: Study) => {
    setView({ kind: "results", study: s });
    window.scrollTo({ top: 0 });
  };

  if (view.kind === "running") return <Progress company={view.company} readInfo={readInfo} steps={steps} topics={topics} />;
  if (view.kind === "results") return <Results key={view.study.id} initial={view.study} health={health} autoReview={!view.study.demo} onNew={() => setView({ kind: "home" })} />;
  return (
    <>
      <Landing onBuild={build} onSample={() => open(sampleStudy())} onOpen={open} history={history} health={health} error={error} />
      {history.length > 0 && (
        <div className="mt-4">
          <button type="button" className="text-sm text-mute underline" onClick={() => { history.forEach((h) => deleteStudy(h.id)); setHistory([]); }}>Clear saved scorecards from this browser</button>
        </div>
      )}
    </>
  );
}
