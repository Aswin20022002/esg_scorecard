import type { Evidence } from "./types";

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export interface Verifier {
  check(quote: string | null, page: number | null, value?: string | null): { evidence: Evidence; page: number | null };
}

/**
 * Grounding check. The AI must quote the report. We confirm the quote really
 * exists in the PDF text (and that the reported number appears on that page).
 * This catches invented evidence, which is the main trust problem with AI audits.
 */
export function makeVerifier(pages: string[]): Verifier {
  const flat = pages.map(squash);

  const overlap = (q: string, hay: string): number => {
    if (q.length < 12) return hay.includes(q) ? 1 : 0;
    const size = 12;
    const step = 5;
    let total = 0;
    let found = 0;
    for (let i = 0; i + size <= q.length; i += step) {
      total++;
      if (hay.includes(q.slice(i, i + size))) found++;
    }
    return total ? found / total : 0;
  };

  return {
    check(quote, page, value) {
      if (!quote || quote.trim().length < 6) return { evidence: "none", page };
      const q = squash(quote);
      if (!q) return { evidence: "none", page };

      let bestPage = page;
      let best = 0;
      const tryPage = (p: number) => {
        const idx = p - 1;
        if (idx < 0 || idx >= flat.length) return 0;
        return flat[idx].includes(q) ? 1 : overlap(q, flat[idx]);
      };

      if (page) best = tryPage(page);
      if (best < 1) {
        // The model may have cited the wrong page. Search everywhere.
        for (let i = 0; i < flat.length; i++) {
          if (page && i === page - 1) continue;
          const sc = flat[i].includes(q) ? 1 : 0;
          if (sc > best) {
            best = sc;
            bestPage = i + 1;
            if (sc === 1) break;
          }
        }
      }

      let valueOk = true;
      if (value && bestPage) {
        const v = squash(value);
        if (v.length >= 2 && /\d/.test(v)) valueOk = flat[bestPage - 1]?.includes(v) ?? false;
      }

      if (best >= 0.999 && valueOk) return { evidence: "verified", page: bestPage };
      if (best >= 0.6 || (best >= 0.999 && !valueOk)) return { evidence: "partial", page: bestPage };
      return { evidence: "unverified", page };
    },
  };
}
