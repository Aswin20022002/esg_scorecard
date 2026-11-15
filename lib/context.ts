const TERMS: Array<[string, number]> = [
  ["materiality", 4], ["material topic", 4], ["material issue", 4], ["stakeholder", 2], ["sustainability", 2], ["esg", 2], ["strategy", 2],
  ["risk", 1], ["opportunit", 1], ["climate", 3], ["scope 1", 3], ["scope 2", 3], ["scope 3", 3], ["emission", 2], ["net zero", 3], ["net-zero", 3],
  ["renewable", 2], ["energy", 1], ["water", 2], ["waste", 2], ["biodiversity", 2], ["supply chain", 2], ["supplier", 2], ["vendor", 1],
  ["safety", 2], ["injur", 2], ["employee", 1], ["diversity", 2], ["training", 1], ["human rights", 3], ["communit", 2], ["csr", 2],
  ["customer", 1], ["data privacy", 2], ["cyber", 2], ["ethic", 1], ["corruption", 2], ["governance", 1], ["board", 1], ["target", 2], ["by 2030", 3], ["by 2040", 3], ["by 2050", 3],
  ["principle 6", 3], ["brsr", 3], ["gri", 2], ["tcfd", 3], ["esrs", 3], ["cbam", 3], ["regulat", 1],
];

function score(page: string): number {
  const t = page.toLowerCase();
  let s = 0;
  for (const [term, w] of TERMS) {
    let i = t.indexOf(term);
    let n = 0;
    while (i !== -1 && n < 5) {
      n++;
      i = t.indexOf(term, i + term.length);
    }
    s += n * w;
  }
  return s;
}

export interface Context {
  text: string;
  pageNumbers: number[];
}

/** Picks the pages most likely to discuss sustainability strategy and performance, in page order. */
export function selectContext(pages: string[], maxChars: number, perPage = 2600): Context {
  const ranked = pages
    .map((p, i) => ({ i, s: p.length > 200 ? score(p) : 0 }))
    .filter((x) => x.s >= 6)
    .sort((a, b) => b.s - a.s);
  const chosen: number[] = [];
  let used = 0;
  for (const r of ranked) {
    const len = Math.min(pages[r.i].length, perPage) + 12;
    if (used + len > maxChars) continue;
    chosen.push(r.i);
    used += len;
    if (used >= maxChars) break;
  }
  chosen.sort((a, b) => a - b);
  return { text: chosen.map((i) => `[Page ${i + 1}]\n${pages[i].slice(0, perPage)}`).join("\n\n"), pageNumbers: chosen.map((i) => i + 1) };
}
