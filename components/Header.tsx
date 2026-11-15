"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Settings, X } from "lucide-react";
import { getHealth, type Health } from "@/lib/api";
import { getCode, setCode } from "@/lib/store";

const NAV = [
  { href: "/", label: "Build" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/method", label: "Method" },
];

export default function Header() {
  const path = usePathname();
  const dlg = useRef<HTMLDialogElement>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [code, setCodeState] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHealth().then(setHealth);
    setCodeState(getCode());
  }, []);

  const mode = !health ? "Checking" : health.gemini && health.grok ? "Two-model mode" : health.gemini || health.grok ? "Single model" : "No API keys";
  const dot = !health ? "bg-mute" : health.gemini && health.grok ? "bg-ok" : health.gemini || health.grok ? "bg-marigold" : "bg-bad";

  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
          </span>
          Scorecard Studio
        </Link>
        <nav aria-label="Main" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
          {NAV.map((n) => {
            const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${on ? "bg-tint text-brand-ink" : "text-mute hover:text-ink"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" className="btn btn-ghost ml-auto !min-h-[40px] text-sm" onClick={() => dlg.current?.showModal()}>
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
          {mode}
          <Settings size={16} aria-hidden />
          <span className="sr-only">Open settings</span>
        </button>
      </div>

      <dialog ref={dlg} className="w-[min(92vw,460px)] rounded-2xl border border-line p-0 text-ink" aria-labelledby="settings-title">
        <form method="dialog" className="p-6" onSubmit={() => { setCode(code.trim()); }}>
          <div className="flex items-start justify-between gap-4">
            <h2 id="settings-title" className="font-display text-2xl font-bold">Settings</h2>
            <button type="submit" formNoValidate className="rounded-lg p-2 hover:bg-paper" aria-label="Close settings"><X size={18} /></button>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between gap-3"><span>Gemini key on server</span><strong className={health?.gemini ? "text-ok" : "text-bad"}>{health ? (health.gemini ? "Found" : "Missing") : "Checking"}</strong></li>
            <li className="flex justify-between gap-3"><span>Grok key on server (or Groq)</span><strong className={health?.grok ? "text-ok" : "text-bad"}>{health ? (health.grok ? "Found" : "Missing") : "Checking"}</strong></li>
          </ul>
          <p className="mt-3 text-sm text-mute">
            Keys live in your Vercel environment variables, never in the browser. With both keys, Gemini and Grok rate materiality separately, Gemini builds the scorecard and the second model reviews it. With one key, that model does every step and the second opinion is skipped.
          </p>
          {health?.needsCode && (
            <div className="mt-4">
              <label htmlFor="code" className="text-sm font-semibold">Access code</label>
              <input id="code" type="password" className="field mt-1.5" value={code} onChange={(e) => { setCodeState(e.target.value); setSaved(false); }} autoComplete="off" />
              <p className="mt-1.5 text-xs text-mute">The site owner set a code to protect the API keys.</p>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="submit" className="btn btn-primary" onClick={() => setSaved(true)}>{saved ? "Saved" : "Save and close"}</button>
          </div>
        </form>
      </dialog>
    </header>
  );
}
