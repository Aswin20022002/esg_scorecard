import { getCode } from "./store";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const code = getCode();
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json", ...(code ? { "x-access-code": code } : {}) },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(j?.error || `Request failed (${res.status})`, res.status);
      return j as T;
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError) throw e; // server answered, do not repeat
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new ApiError(lastErr instanceof Error ? lastErr.message : "Network error", 0);
}

export interface Health {
  gemini: boolean;
  grok: boolean;
  needsCode: boolean;
}

export async function getHealth(): Promise<Health | null> {
  try {
    const r = await fetch("/api/health", { cache: "no-store" });
    return r.ok ? ((await r.json()) as Health) : null;
  } catch {
    return null;
  }
}
