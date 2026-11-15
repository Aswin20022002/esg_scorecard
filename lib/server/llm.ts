export type Provider = "gemini" | "grok";

export interface LlmResult<T> {
  data: T;
  provider: Provider;
  model: string;
  fellBack: boolean;
}

const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const xaiKey = () => process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
const groqKey = () => process.env.GROQ_API_KEY || "";
/** The second-model slot uses xAI Grok when its key is set, and falls back to Groq (a different company) if only that key exists. */
const useGroq = () => !xaiKey() && !!groqKey();
const grokKey = () => (useGroq() ? groqKey() : xaiKey());

export function keysAvailable() {
  return { gemini: !!geminiKey(), grok: !!grokKey() };
}

const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x && x.trim().length > 0))];

const geminiModels = () => uniq([process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"]);
const grokModels = () =>
  useGroq()
    ? uniq([process.env.GROQ_MODEL, "llama-3.3-70b-versatile", "openai/gpt-oss-120b"])
    : uniq([process.env.XAI_MODEL, "grok-4-fast-non-reasoning", "grok-4.5", "grok-4"]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class ProviderError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) {
    super(message);
  }
}

interface CallOpts {
  system: string;
  user: string;
  json: boolean;
  maxTokens: number;
  deadline: number; // epoch ms
}

async function callGemini(model: string, o: CallOpts): Promise<string> {
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  const budget = Math.max(5_000, o.deadline - Date.now());
  const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": geminiKey() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: o.system }] },
      contents: [{ role: "user", parts: [{ text: o.user }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: o.maxTokens,
        ...(o.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    signal: AbortSignal.timeout(Math.min(budget, 55_000)),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ProviderError(`Gemini ${res.status}: ${t.slice(0, 200)}`, res.status, res.status === 429 || res.status >= 500);
  }
  const j = await res.json();
  const text = (j?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new ProviderError("Gemini returned no text", 502, true);
  return text;
}

async function callGrok(model: string, o: CallOpts, useJsonMode = true): Promise<string> {
  const groq = useGroq();
  const base = groq ? process.env.GROQ_BASE_URL || "https://api.groq.com/openai" : process.env.XAI_BASE_URL || "https://api.x.ai";
  const budget = Math.max(5_000, o.deadline - Date.now());
  const effort = groq ? undefined : process.env.XAI_REASONING_EFFORT;
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${grokKey()}` },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: o.system },
        { role: "user", content: o.user },
      ],
      ...(o.json && useJsonMode ? { response_format: { type: "json_object" } } : {}),
      ...(effort ? { reasoning_effort: effort } : {}),
    }),
    signal: AbortSignal.timeout(Math.min(budget, 55_000)),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 400 && useJsonMode && o.json) return callGrok(model, o, false);
    throw new ProviderError(`Grok ${res.status}: ${t.slice(0, 200)}`, res.status, res.status === 429 || res.status >= 500);
  }
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError("Grok returned no text", 502, true);
  return text as string;
}

export function parseJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a === -1 || b === -1) throw new Error("No JSON object in model output");
  s = s.slice(a, b + 1);
  try {
    return JSON.parse(s);
  } catch {
    // remove trailing commas and retry
    return JSON.parse(s.replace(/,\s*([}\]])/g, "$1"));
  }
}

// Remember which model names work or are missing, so later calls skip the dead ones.
const lastGood: Partial<Record<Provider, string>> = {};
const deadUntil = new Map<string, number>();
const DEAD_MS = 30 * 60 * 1000;

function orderedModels(p: Provider): string[] {
  const all = p === "gemini" ? geminiModels() : grokModels();
  const now = Date.now();
  const alive = all.filter((m) => (deadUntil.get(`${p}:${m}`) ?? 0) < now);
  const list = alive.length ? alive : all;
  const good = lastGood[p];
  return good && list.includes(good) ? [good, ...list.filter((m) => m !== good)] : list;
}

async function runProvider(p: Provider, o: CallOpts): Promise<{ text: string; model: string }> {
  const models = orderedModels(p);
  let lastErr: unknown = null;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() > o.deadline - 4_000) throw lastErr ?? new Error("Out of time");
      try {
        const text = p === "gemini" ? await callGemini(model, o) : await callGrok(model, o);
        lastGood[p] = model;
        return { text, model };
      } catch (e) {
        lastErr = e;
        const pe = e instanceof ProviderError ? e : null;
        if (pe && (pe.status === 404 || (pe.status === 400 && /model/i.test(pe.message)))) deadUntil.set(`${p}:${model}`, Date.now() + DEAD_MS);
        const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
        if (pe && pe.status === 401) throw new ProviderError(`${p === "gemini" ? "Gemini" : "Grok"} rejected the API key`, 401, false);
        if (pe?.status === 429 && attempt === 0) {
          await sleep(1800);
          continue;
        }
        if (pe?.retryable && attempt === 0) {
          await sleep(900);
          continue;
        }
        if (timedOut) break;
        break; // try next model name (404, 400, repeated 429 and so on)
      }
    }
  }
  throw lastErr ?? new Error("No model available");
}

export async function generate<T = unknown>(args: {
  prefer: Provider;
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
  budgetMs?: number;
}): Promise<LlmResult<T>> {
  const keys = keysAvailable();
  const order: Provider[] = [args.prefer, args.prefer === "gemini" ? "grok" : "gemini"];
  const usable = order.filter((p) => (p === "gemini" ? keys.gemini : keys.grok));
  if (usable.length === 0) throw new ProviderError("No API key is configured on the server", 503, false);

  const deadline = Date.now() + (args.budgetMs ?? 56_000);
  let lastErr: unknown = null;
  for (const p of usable) {
    const opts: CallOpts = { system: args.system, user: args.user, json: args.json ?? true, maxTokens: args.maxTokens ?? 8192, deadline };
    try {
      let { text, model } = await runProvider(p, opts);
      let data: unknown;
      if (args.json ?? true) {
        try {
          data = parseJson(text);
        } catch {
          // One more try, telling the model its last reply was not valid JSON.
          const again = await runProvider(p, { ...opts, user: `${opts.user}\n\nYour previous reply was not valid JSON. Reply again with one valid JSON object only.` });
          text = again.text;
          model = again.model;
          data = parseJson(text);
        }
      } else {
        data = text;
      }
      return { data: data as T, provider: p, model, fellBack: p !== args.prefer };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Model call failed");
}

export function errorStatus(e: unknown): number {
  if (e instanceof ProviderError) return e.status === 401 ? 502 : e.status === 429 ? 429 : e.status >= 400 && e.status < 600 ? (e.status === 503 ? 503 : 502) : 502;
  return 502;
}
