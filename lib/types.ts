import type { Group } from "./topics";

export type Evidence = "verified" | "partial" | "unverified" | "none";
export type Perspective = "financial" | "stakeholder" | "process" | "learning";
export type Severity = "high" | "medium" | "low";

export interface Profile {
  company: string;
  sector: string;
  geography: string;
  size: string;
  strategy: string;
  concerns: string;
  horizon: number;
}

/** One model's raw 1 to 5 sub-scores for one topic. */
export interface Rating {
  scale: number;
  scope: number;
  irremediability: number;
  impactLikelihood: number;
  magnitude: number;
  financialLikelihood: number;
  impactReason: string;
  financialReason: string;
  horizon: "short" | "medium" | "long";
  stakeholders: string[];
  quote: string | null;
  page: number | null;
  evidence: Evidence;
}

export interface Topic {
  id: string;
  label: string;
  group: Group;
  custom: boolean;
  /** Reference codes. Empty for custom topics. */
  brsr: string;
  esrs: string;
  gri: string;
  a: Rating | null; // first model
  b: Rating | null; // second model
  /** User override of the combined result */
  override?: { impact: number; financial: number };
}

export interface Kpi {
  id: string;
  name: string;
  type: "leading" | "lagging";
  unit: string;
  baseline: string;
  target: string;
  targetYear: number | null;
  direction: "up" | "down";
  frequency: string;
  owner: string;
  source: string;
  framework: string;
}

export interface Initiative {
  name: string;
  owner: string;
  timeline: string;
}

export interface Objective {
  id: string;
  perspective: Perspective;
  title: string;
  why: string;
  topicIds: string[];
  drives: string[];
  kpis: Kpi[];
  initiatives: Initiative[];
}

export interface CritiqueIssue {
  severity: Severity;
  title: string;
  detail: string;
  objectiveIds: string[];
}

export interface Critique {
  verdict: string;
  strengths: string[];
  issues: CritiqueIssue[];
  kpiNotes: { kpiId: string; rating: "strong" | "ok" | "weak"; note: string; better: string | null }[];
  fixes: { action: string; why: string; impact: "low" | "medium" | "high" }[];
  model: string;
}

export interface Study {
  id: string;
  createdAt: string;
  demo: boolean;
  profile: Profile;
  report: { fileName: string; numPages: number; usedPages: number } | null;
  models: { a: string; b: string | null; build: string; critique: string | null };
  summary: string;
  topics: Topic[];
  objectives: Objective[];
  critique: Critique | null;
  warnings: string[];
}
