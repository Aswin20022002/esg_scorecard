import { TOPICS } from "../topics";
import type { Objective, Profile } from "../types";

const topicLines = (extra: { id: string; label: string; about: string }[] = []) =>
  [...TOPICS.map((t) => ({ id: t.id, label: t.label, about: t.about })), ...extra].map((t) => `- ${t.id} | ${t.label} | ${t.about}`).join("\n");

export const profileBlock = (p: Profile) =>
  [
    `Company: ${p.company}`,
    `Sector: ${p.sector}`,
    p.geography && `Where it operates: ${p.geography}`,
    p.size && `Size: ${p.size}`,
    p.strategy && `Business strategy and ambitions: ${p.strategy}`,
    p.concerns && `Known stakeholder concerns: ${p.concerns}`,
    `Planning horizon: year ${p.horizon}`,
  ]
    .filter(Boolean)
    .join("\n");

export const MAT_SYSTEM = `You are a senior sustainability strategist running a double materiality assessment in the style of ESRS and GRI.
You rate how much each ESG topic matters to ONE company, on two separate sides:
IMPACT side (inside out): the company's effect on people and the environment.
- scale: 1 minor to 5 severe or very large benefit
- scope: 1 few people or a small area to 5 widespread
- irremediability: 1 easily reversed to 5 cannot be put right
- impact_likelihood: 1 remote to 5 already happening (actual impacts are 5)
FINANCIAL side (outside in): effect of the topic on the company's cash flow, cost of capital or access to markets within the planning horizon.
- magnitude: 1 negligible, 3 noticeable (about 2 to 5 percent of annual profit), 5 severe (over 10 percent of profit or threatens licence to operate)
- financial_likelihood: 1 under 10 percent chance to 5 certain or already happening

Rules:
- Rate every topic in the list. Use whole numbers 1 to 5.
- Be specific to this company and sector. Do not give every topic the same score. Use the full range, and treat a score of 4 or 5 as rare.
- Give a reason of at most 15 words for each side, naming the real mechanism (for example a customer requirement, a regulation, a plant process).
- If report text is supplied, use it. Put one short verbatim quote (under 30 words) from the report that supports your rating in "quote" with its page number in "page", or null when the report has nothing on the topic. Never invent a quote. Without report text, set quote and page to null.
- stakeholders: up to 3 of: investors, customers, employees, communities, regulators, suppliers.
- horizon: when the topic hits hardest: short (under 2 years), medium (2 to 5), long (over 5).
- You may propose up to 2 extra topics that are important for this company but missing from the list, with ids x1 and x2, a short label, a group (E, S or G), and a one line "about". Propose none if the list is enough.
- Also write "company_summary": two plain sentences on what the company does and where its sustainability pressure comes from.
Reply with one JSON object only:
{"company_summary":"","ratings":[{"id":"","scale":0,"scope":0,"irremediability":0,"impact_likelihood":0,"impact_reason":"","magnitude":0,"financial_likelihood":0,"financial_reason":"","horizon":"medium","stakeholders":[],"quote":null,"page":null}],"extra_topics":[{"id":"x1","label":"","group":"E","about":"","scale":0,"scope":0,"irremediability":0,"impact_likelihood":0,"impact_reason":"","magnitude":0,"financial_likelihood":0,"financial_reason":"","horizon":"medium","stakeholders":[],"quote":null,"page":null}]}`;

export function matUser(p: Profile, text: string, extra: { id: string; label: string; about: string }[]) {
  return `${profileBlock(p)}

Topics to rate (id | label | what it covers):
${topicLines(extra)}

${text ? `Report text (pages are marked [Page N]):\n${text}` : "No report text was supplied. Rate from the profile and your knowledge of the sector."}`;
}

export const SC_SYSTEM = `You design Sustainability Balanced Scorecards (Kaplan and Norton, extended by Figge, Hahn, Schaltegger and Wagner) for company management.
Build a strategy map and scorecard that turns the material topics into a few clear objectives.

Four perspectives, from top to bottom:
- financial: value, cost, revenue, access to capital, risk
- stakeholder: customers, communities, regulators, investors' trust
- process: operations and value chain processes
- learning: people, skills, culture, data and governance systems

Rules:
- Write 9 to 12 objectives, at least one per perspective and at least two in process. Every objective begins with a verb and is at most 12 words.
- Every material topic given must be named in the topic_ids of at least one objective. Use only the topic ids provided.
- "drives" lists the objective ids this objective causes progress in. Links must go UP only: learning to process, stakeholder or financial; process to stakeholder or financial; stakeholder to financial. Never link within the same perspective. Give each non-financial objective at least one link, and make sure there is a chain from a learning objective to a financial one.
- 1 to 3 KPIs per objective, 14 to 26 in total. At least 30 percent must be "leading" (measures activity or capability that predicts results, such as supplier assessments completed, training hours, share of capex approved with a carbon test). The others are "lagging" (results).
- Every KPI needs: name, type, unit, baseline, target (a number with unit), target_year (a year up to the planning horizon), direction (up or down), frequency, owner (a job role), source (system or document where the data lives), framework (a code such as GRI 305-1, BRSR Core, ESRS E1-6, or empty).
- baseline: use a figure from the report text when it is there. Otherwise write "" (empty). Never invent a baseline.
- Targets must be realistic for the sector and company size, and consistent with the stated ambitions. Prefer absolute or intensity targets with a clear unit.
- Add 0 to 2 initiatives per objective (action, owner role, timeline).
- Write "strategy_statement" (one sentence: how sustainability supports the business strategy) and "summary" (three short sentences a CEO could read aloud).
Reply with one JSON object only:
{"strategy_statement":"","summary":"","objectives":[{"id":"O1","perspective":"financial","title":"","why":"","topic_ids":[],"drives":[],"kpis":[{"name":"","type":"leading","unit":"","baseline":"","target":"","target_year":2030,"direction":"down","frequency":"Annual","owner":"","source":"","framework":""}],"initiatives":[{"name":"","owner":"","timeline":""}]}]}`;

export function scUser(p: Profile, topics: { id: string; label: string; impact: number; financial: number; why: string }[], text: string) {
  return `${profileBlock(p)}

Material topics, most important first (id | label | impact score | financial score | why it matters), scores out of 5:
${topics.map((t) => `- ${t.id} | ${t.label} | ${t.impact} | ${t.financial} | ${t.why}`).join("\n")}

${text ? `Report text for baselines (pages are marked [Page N]):\n${text}` : "No report text was supplied, so leave baselines empty."}`;
}

const compact = (objs: Objective[]) =>
  JSON.stringify(
    objs.map((o) => ({ id: o.id, perspective: o.perspective, title: o.title, topic_ids: o.topicIds, drives: o.drives, kpis: o.kpis.map((k) => ({ id: k.id, name: k.name, type: k.type, unit: k.unit, baseline: k.baseline, target: k.target, target_year: k.targetYear })) })),
  );

export const CRIT_SYSTEM = `You are an independent reviewer of Sustainability Balanced Scorecards. You did not write this one. Your job is to find what is weak, vague, missing or illogical, and to say what is good.
Check:
- Does each objective really follow from a material topic and from the company's strategy?
- Are cause and effect links believable? Does the chain make a story a board could follow?
- Are KPIs measurable, specific, time bound and plausible for this sector and size? Flag targets that look too easy, too hard, or have no baseline.
- Are KPIs mostly outcomes with too few early signals, or the reverse?
- What important risk or opportunity for this company has no objective?
Rules:
- Be concrete and brief. Cite objective ids (O1) and KPI ids (K1) exactly as given. Never use an id that was not given.
- At most 6 issues, 8 kpi_notes, 5 fixes, 4 strengths. Rank issues by severity.
- For a weak KPI, give a better version in "better" (one line), else null.
Reply with one JSON object only:
{"verdict":"two sentences","strengths":[""],"issues":[{"severity":"high","title":"","detail":"","objective_ids":["O1"]}],"kpi_notes":[{"kpi_id":"K1","rating":"weak","note":"","better":null}],"fixes":[{"action":"","why":"","impact":"high"}]}`;

export function critUser(p: Profile, topics: { id: string; label: string; impact: number; financial: number }[], objs: Objective[]) {
  return `${profileBlock(p)}

Material topics (id | label | impact | financial), out of 5:
${topics.map((t) => `- ${t.id} | ${t.label} | ${t.impact} | ${t.financial}`).join("\n")}

Scorecard to review:
${compact(objs)}`;
}

export const REFINE_SYSTEM = `You edit an existing Sustainability Balanced Scorecard on request.
Rules:
- Apply the instruction exactly and change as little else as possible. Keep every objective and KPI the person did not mention, with its values and ids.
- Keep the same JSON shape. New objectives use ids N1, N2 and so on. Links in "drives" must go UP only (learning to process, stakeholder or financial; process to stakeholder or financial; stakeholder to financial).
- Use only topic ids from the list. Never invent a baseline: leave it empty if unknown.
- Keep a sensible total of 14 to 26 KPIs, at least 30 percent leading.
- Add "change_note": one sentence saying what you changed.
Reply with one JSON object only: {"change_note":"","objectives":[{"id":"","perspective":"","title":"","why":"","topic_ids":[],"drives":[],"kpis":[{"name":"","type":"leading","unit":"","baseline":"","target":"","target_year":2030,"direction":"down","frequency":"Annual","owner":"","source":"","framework":""}],"initiatives":[{"name":"","owner":"","timeline":""}]}]}`;

export function refineUser(p: Profile, instruction: string, objs: Objective[], topicIds: string[]) {
  const full = JSON.stringify(
    objs.map((o) => ({ id: o.id, perspective: o.perspective, title: o.title, why: o.why, topic_ids: o.topicIds, drives: o.drives, kpis: o.kpis.map((k) => ({ name: k.name, type: k.type, unit: k.unit, baseline: k.baseline, target: k.target, target_year: k.targetYear, direction: k.direction, frequency: k.frequency, owner: k.owner, source: k.source, framework: k.framework })), initiatives: o.initiatives })),
  );
  return `${profileBlock(p)}

Allowed topic ids: ${topicIds.join(", ")}

Current scorecard:
${full}

Instruction: ${instruction}`;
}
