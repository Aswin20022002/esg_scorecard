"use client";

import { useMemo } from "react";
import { QUADRANT_LABEL, quadrant, ranked } from "@/lib/materiality";
import { GROUP_COLOR, GROUP_NAME, type Group } from "@/lib/topics";
import type { Topic } from "@/lib/types";

const W = 580;
const H = 520;
const M = { l: 58, r: 14, t: 14, b: 54 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;
const X = (v: number) => M.l + (v / 5) * PW;
const Y = (v: number) => M.t + PH - (v / 5) * PH;

function Shape({ group, r, fill, stroke, sw }: { group: Group; r: number; fill: string; stroke: string; sw: number }) {
  if (group === "S") return <rect x={-r} y={-r} width={2 * r} height={2 * r} rx={4} fill={fill} stroke={stroke} strokeWidth={sw} />;
  if (group === "G") return <polygon points={`0,${-r - 3} ${r + 3},0 0,${r + 3} ${-r - 3},0`} fill={fill} stroke={stroke} strokeWidth={sw} />;
  return <circle r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
}

export default function Matrix({ topics, threshold, selected, onSelect }: { topics: Topic[]; threshold: number; selected: string | null; onSelect: (id: string) => void }) {
  const items = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    return ranked(topics).map((it) => {
      let x = X(it.d.financial);
      let y = Y(it.d.impact);
      // Nudge a dot sideways when it would sit on top of another one.
      for (let k = 0; k < 40 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < 25); k++) {
        const ang = k * 2.4;
        const rad = 12 + k * 1.6;
        x = X(it.d.financial) + Math.cos(ang) * rad;
        y = Y(it.d.impact) + Math.sin(ang) * rad;
      }
      x = Math.min(W - M.r - 8, Math.max(M.l + 8, x));
      y = Math.min(M.t + PH - 8, Math.max(M.t + 8, y));
      placed.push({ x, y });
      return { ...it, x, y };
    });
  }, [topics]);

  const tx = X(threshold);
  const ty = Y(threshold);
  const ticks = [0, 1, 2, 3, 4, 5];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="group" aria-label="Double materiality matrix. Horizontal axis is financial materiality, vertical axis is impact materiality. Use the topic list for the same information as text.">
        <rect x={M.l} y={M.t} width={tx - M.l} height={ty - M.t} fill="#e7f0fb" />
        <rect x={tx} y={M.t} width={M.l + PW - tx} height={ty - M.t} fill="#dcf1e6" />
        <rect x={M.l} y={ty} width={tx - M.l} height={M.t + PH - ty} fill="#f4f7f5" />
        <rect x={tx} y={ty} width={M.l + PW - tx} height={M.t + PH - ty} fill="#f6efdc" />
        <text x={M.l + 8} y={M.t + 18} fontSize="12" fontWeight="600" fill="#2c5cc5">{QUADRANT_LABEL.impact}</text>
        <text x={M.l + PW - 8} y={M.t + 18} fontSize="12" fontWeight="600" fill="#0b7a4f" textAnchor="end">{QUADRANT_LABEL.double}</text>
        <text x={M.l + 8} y={M.t + PH - 10} fontSize="12" fontWeight="600" fill="#4f655c">{QUADRANT_LABEL.none}</text>
        <text x={M.l + PW - 8} y={M.t + PH - 10} fontSize="12" fontWeight="600" fill="#92560a" textAnchor="end">{QUADRANT_LABEL.financial}</text>

        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.l} x2={M.l + PW} y1={Y(v)} y2={Y(v)} stroke="#d6e2db" strokeWidth="1" opacity="0.7" />
            <line x1={X(v)} x2={X(v)} y1={M.t} y2={M.t + PH} stroke="#d6e2db" strokeWidth="1" opacity="0.7" />
            <text x={M.l - 10} y={Y(v) + 4} fontSize="12" textAnchor="end" fill="#4f655c">{v}</text>
            <text x={X(v)} y={M.t + PH + 20} fontSize="12" textAnchor="middle" fill="#4f655c">{v}</text>
          </g>
        ))}
        <line x1={tx} x2={tx} y1={M.t} y2={M.t + PH} stroke="#12261f" strokeWidth="1.6" strokeDasharray="6 4" />
        <line x1={M.l} x2={M.l + PW} y1={ty} y2={ty} stroke="#12261f" strokeWidth="1.6" strokeDasharray="6 4" />
        <text x={M.l + PW / 2} y={H - 10} fontSize="13" fontWeight="600" textAnchor="middle" fill="#12261f">Financial materiality (effect on the company)</text>
        <text transform={`translate(15 ${M.t + PH / 2}) rotate(-90)`} fontSize="13" fontWeight="600" textAnchor="middle" fill="#12261f">Impact materiality (effect on people and planet)</text>

        {items.map(({ t, d, x, y, rank }) => {
          const sx = PW / 5;
          const showRange = d.models === 2 && !d.overridden;
          const mf = (d.financialRange[0] + d.financialRange[1]) / 2;
          const mi = (d.impactRange[0] + d.impactRange[1]) / 2;
          const col = d.disagree ? "#b23a28" : GROUP_COLOR[t.group];
          return (
            <g key={t.id}>
              {showRange && (
                <g stroke={col} strokeWidth="2" opacity="0.55" strokeDasharray={d.disagree ? "4 3" : undefined} aria-hidden>
                  <line x1={x - (mf - d.financialRange[0]) * sx} x2={x + (d.financialRange[1] - mf) * sx} y1={y} y2={y} />
                  <line x1={x} x2={x} y1={y + (mi - d.impactRange[0]) * (PH / 5)} y2={y - (d.impactRange[1] - mi) * (PH / 5)} />
                </g>
              )}
              <g
                className="dot"
                transform={`translate(${x} ${y})`}
                tabIndex={0}
                role="button"
                aria-label={`${rank}. ${t.label}. Impact ${d.impact}, financial ${d.financial}. ${QUADRANT_LABEL[quadrant(d, threshold)]}.${d.disagree ? " The two models disagree." : ""}`}
                aria-pressed={selected === t.id}
                onClick={() => onSelect(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(t.id);
                  }
                }}
              >
                {selected === t.id && <circle r={21} fill="none" stroke="#f5b31a" strokeWidth="4" />}
                <Shape group={t.group} r={13} fill={GROUP_COLOR[t.group]} stroke="#fff" sw={2} />
                <text textAnchor="middle" dy="4.5" fontSize="12" fontWeight="700" fill="#fff" pointerEvents="none">{rank}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-mute" aria-label="Legend">
        {(["E", "S", "G"] as Group[]).map((g) => (
          <li key={g} className="inline-flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="-10 -10 20 20" aria-hidden><Shape group={g} r={7} fill={GROUP_COLOR[g]} stroke="#fff" sw={1} /></svg>
            {GROUP_NAME[g]}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-bad" aria-hidden />Red whisker means the two models differ by one point or more</li>
      </ul>
    </div>
  );
}
