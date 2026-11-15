import type { Study } from "./types";

const KEY = "esg-scorecard:studies:v1";
const CODE = "esg-scorecard:code";

export function loadStudies(): Study[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Study[]) : [];
  } catch {
    return [];
  }
}

export function saveStudy(s: Study): Study[] {
  try {
    const rest = loadStudies().filter((x) => x.id !== s.id);
    const next = [s, ...rest].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [s];
  }
}

export function deleteStudy(id: string): Study[] {
  try {
    const next = loadStudies().filter((x) => x.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function getCode(): string {
  try {
    return localStorage.getItem(CODE) ?? "";
  } catch {
    return "";
  }
}

export function setCode(v: string) {
  try {
    if (v) localStorage.setItem(CODE, v);
    else localStorage.removeItem(CODE);
  } catch {
    /* storage can be blocked, the app still works */
  }
}
