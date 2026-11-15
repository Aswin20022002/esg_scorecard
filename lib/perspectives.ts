import type { Perspective } from "./types";

export const PERSPECTIVES: { id: Perspective; name: string; question: string; rank: number }[] = [
  { id: "financial", name: "Financial and value", question: "What must be true for investors and the business?", rank: 3 },
  { id: "stakeholder", name: "Customers, community and regulators", question: "What must stakeholders see and trust?", rank: 2 },
  { id: "process", name: "Operations and value chain", question: "Which processes must we excel at?", rank: 1 },
  { id: "learning", name: "People, culture and systems", question: "What capability and data make that possible?", rank: 0 },
];

export const RANK: Record<Perspective, number> = { financial: 3, stakeholder: 2, process: 1, learning: 0 };
export const P_NAME: Record<Perspective, string> = Object.fromEntries(PERSPECTIVES.map((p) => [p.id, p.name])) as Record<Perspective, string>;
