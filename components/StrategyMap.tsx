"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Card, Pill } from "./ui";
import { PERSPECTIVES } from "@/lib/perspectives";
import type { Objective, Study } from "@/lib/types";

interface Line {
  from: string;
  to: string;
  d: string;
}

export default function StrategyMap({ study, onOpen }: { study: Study; onOpen: (id: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<Record<string, HTMLElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hot, setHot] = useState<string | null>(null);
  const objs = study.objectives;

  const measure = useCallback(() => {
    const c = wrap.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const out: Line[] = [];
    // Spread arrow ends along each card edge so several arrows do not stack on one point.
    const incoming: Record<string, string[]> = {};
    for (const o of objs) for (const d of o.drives) (incoming[d] ||= []).push(o.id);
    for (const o of objs) {
      o.drives.forEach((d, oi) => {
        const a = cards.current[o.id]?.getBoundingClientRect();
        const b = cards.current[d]?.getBoundingClientRect();
        if (!a || !b) return;
        const ti = (incoming[d] ?? []).indexOf(o.id);
        const sx = a.left - cr.left + (a.width * (oi + 1)) / (o.drives.length + 1);
        const sy = a.top - cr.top;
        const tx = b.left - cr.left + (b.width * (ti + 1)) / ((incoming[d] ?? []).length + 1);
        const ty = b.bottom - cr.top + 2;
        const my = (sy + ty) / 2;
        out.push({ from: o.id, to: d, d: `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}` });
      });
    }
    setLines(out);
    setSize({ w: cr.width, h: cr.height });
  }, [objs]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const byId = new Map(objs.map((o) => [o.id, o]));
  const related = (id: string) => {
    const o = byId.get(id);
    return new Set([id, ...(o?.drives ?? []), ...objs.filter((x) => x.drives.includes(id)).map((x) => x.id)]);
  };
  const rel = hot ? related(hot) : null;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">Strategy map</h2>
        <p className="text-sm text-mute">Arrows read upward: the lower objective helps the higher one succeed.</p>
      </div>
      {study.summary && <p className="mt-2 max-w-3xl text-sm">{study.summary}</p>}

      <div ref={wrap} className="relative mt-5 space-y-12">
        <svg className="pointer-events-none absolute left-0 top-0 hidden md:block" width={size.w} height={size.h} aria-hidden>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 z" fill="#0d6b55" />
            </marker>
          </defs>
          {lines.map((l) => {
            const on = !rel || (rel.has(l.from) && rel.has(l.to) && (l.from === hot || l.to === hot));
            return <path key={`${l.from}-${l.to}`} d={l.d} fill="none" stroke="#0d6b55" strokeWidth={on && hot ? 2.6 : 1.6} opacity={on ? (hot ? 0.95 : 0.5) : 0.08} markerEnd="url(#arr)" />;
          })}
        </svg>

        {PERSPECTIVES.map((p) => {
          const row = objs.filter((o) => o.perspective === p.id);
          return (
            <section key={p.id} aria-labelledby={`p-${p.id}`} className="relative">
              <div className="relative z-10 mb-2 inline-flex max-w-full flex-wrap items-baseline gap-x-3 rounded-lg bg-white px-2 py-0.5">
                <h3 id={`p-${p.id}`} className="font-display text-base font-bold">{p.name}</h3>
                <p className="text-xs text-mute">{p.question}</p>
              </div>
              {row.length === 0 ? (
                <p className="rounded-xl border border-dashed border-bad px-4 py-3 text-sm text-bad">No objective in this view yet. Ask for one in the Scorecard tab.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {row.map((o) => (
                    <li key={o.id}>
                      <ObjectiveCard o={o} dim={!!rel && !rel.has(o.id)} refFn={(el) => { cards.current[o.id] = el; }} onHot={setHot} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </Card>
  );
}

function ObjectiveCard({ o, dim, refFn, onHot, onOpen }: { o: Objective; dim: boolean; refFn: (el: HTMLElement | null) => void; onHot: (id: string | null) => void; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      ref={refFn}
      onMouseEnter={() => onHot(o.id)}
      onMouseLeave={() => onHot(null)}
      onFocus={() => onHot(o.id)}
      onBlur={() => onHot(null)}
      onClick={() => onOpen(o.id)}
      className={`h-full w-full rounded-xl border border-line bg-white p-3.5 text-left shadow-sm transition-opacity hover:border-brand ${dim ? "opacity-40" : ""}`}
    >
      <span className="flex items-center justify-between gap-2">
        <Pill tone="brand">{o.id}</Pill>
        <span className="text-xs text-mute">{o.kpis.length} KPI{o.kpis.length === 1 ? "" : "s"}</span>
      </span>
      <span className="mt-2 block font-display text-[1.02rem] font-bold leading-snug">{o.title}</span>
      {o.drives.length > 0 && <span className="mt-1.5 block text-xs text-mute">Drives {o.drives.join(", ")}</span>}
    </button>
  );
}
