import { TOPICS } from "./topics";
import type { Critique, Kpi, Objective, Perspective, Rating, Study } from "./types";

// [scale, scope, irremediability, impact likelihood, magnitude, financial likelihood]
type T6 = [number, number, number, number, number, number];

const R: Record<string, { a: T6; b: T6; imp: string; fin: string; h: Rating["horizon"]; who: string[] }> = {
  climate_ghg: { a: [4, 4, 4, 5, 5, 5], b: [4, 4, 3, 5, 4, 5], imp: "Foundries and heat treatment burn gas and coal power, so plant emissions are large.", fin: "EU carbon border rules and OEM targets put export orders at risk.", h: "medium", who: ["customers", "regulators", "investors"] },
  energy: { a: [3, 3, 3, 5, 4, 5], b: [3, 3, 2, 5, 4, 4], imp: "Energy hungry forging and machining add to grid demand.", fin: "Power is a large cost and tariffs keep rising.", h: "short", who: ["investors", "regulators"] },
  climate_risk: { a: [2, 3, 3, 3, 3, 3], b: [3, 3, 3, 3, 3, 4], imp: "Plants add little to local flood or heat risk.", fin: "Chennai and Pune sites face flood and heat disruption.", h: "long", who: ["investors"] },
  air: { a: [2, 2, 2, 5, 2, 3], b: [2, 2, 2, 4, 2, 3], imp: "Furnace stacks emit particulates within permit limits.", fin: "Limited cost unless permits tighten.", h: "medium", who: ["regulators", "communities"] },
  water: { a: [3, 3, 3, 4, 3, 3], b: [3, 4, 3, 4, 2, 3], imp: "Cooling and washing draw on stressed groundwater near two plants.", fin: "Water shortage could pause output at one site.", h: "medium", who: ["communities", "regulators"] },
  biodiversity: { a: [1, 2, 2, 2, 1, 2], b: [1, 2, 2, 2, 1, 2], imp: "Plants sit on existing industrial land.", fin: "No clear financial route.", h: "long", who: [] },
  circular: { a: [3, 3, 3, 4, 3, 4], b: [3, 3, 3, 5, 3, 4], imp: "Steel and aluminium use is high, and scrap recovery decides the footprint.", fin: "Metal price swings and recycled content asks from OEMs.", h: "medium", who: ["customers"] },
  waste: { a: [3, 3, 3, 5, 2, 4], b: [3, 3, 3, 5, 2, 3], imp: "Machining sludge and used oil are hazardous waste streams.", fin: "Disposal costs are modest.", h: "short", who: ["regulators", "communities"] },
  product: { a: [4, 4, 3, 4, 5, 4], b: [4, 4, 3, 4, 5, 5], imp: "Lighter and EV drivetrain parts cut vehicle emissions over their life.", fin: "Revenue is shifting to EV parts, so product mix decides growth.", h: "medium", who: ["customers", "investors"] },
  safety: { a: [4, 2, 4, 5, 3, 4], b: [4, 2, 4, 5, 3, 3], imp: "Presses, forging and heavy lifting carry serious injury risk.", fin: "Stoppages and OEM audit findings follow accidents.", h: "short", who: ["employees", "regulators"] },
  wellbeing: { a: [3, 3, 3, 5, 3, 4], b: [3, 3, 2, 5, 3, 4], imp: "Shift work and contract labour shape working conditions.", fin: "Attrition of skilled operators raises cost and quality risk.", h: "short", who: ["employees"] },
  diversity: { a: [2, 3, 2, 5, 2, 3], b: [2, 3, 3, 5, 2, 2], imp: "Women are a small share of shop floor roles.", fin: "Some OEMs ask for diversity data.", h: "medium", who: ["employees", "customers"] },
  talent: { a: [2, 3, 2, 5, 3, 4], b: [2, 3, 2, 5, 3, 4], imp: "Workers need new skills as products change.", fin: "EV engineering talent is scarce.", h: "medium", who: ["employees"] },
  human_rights: { a: [3, 3, 4, 3, 3, 3], b: [3, 3, 3, 4, 3, 3], imp: "Contract and migrant labour in the supply base carries risk.", fin: "Due diligence laws can block sales to EU buyers.", h: "medium", who: ["customers", "regulators"] },
  supply_chain: { a: [3, 4, 4, 4, 4, 4], b: [3, 4, 3, 4, 4, 5], imp: "Casting and forging suppliers are small units with weak controls.", fin: "OEMs now audit sub-tier suppliers and can drop non-compliant ones.", h: "short", who: ["customers", "suppliers"] },
  communities: { a: [3, 3, 3, 4, 2, 3], b: [3, 3, 3, 4, 2, 2], imp: "Plants employ locally and compete for water and roads.", fin: "Local opposition is a modest risk.", h: "medium", who: ["communities"] },
  customers: { a: [3, 3, 3, 3, 4, 4], b: [3, 3, 3, 3, 5, 4], imp: "Brake and steering part failures could harm road users.", fin: "A recall can cost a large part of annual profit and the customer.", h: "short", who: ["customers", "investors"] },
  privacy: { a: [3, 3, 3, 3, 3, 3], b: [3, 3, 3, 3, 4, 3], imp: "Holds OEM design data and employee records.", fin: "A breach could cost designs and orders.", h: "medium", who: ["customers"] },
  ethics: { a: [3, 3, 3, 3, 3, 3], b: [3, 3, 3, 3, 3, 3], imp: "Standard exposure through dealings with agents and officials.", fin: "Penalties are possible but not large.", h: "medium", who: ["regulators"] },
  governance: { a: [2, 2, 2, 5, 3, 4], b: [2, 2, 2, 5, 3, 3], imp: "Board attention shapes how fast action happens.", fin: "Investors and OEMs ask who owns ESG targets.", h: "medium", who: ["investors"] },
  advocacy: { a: [1, 2, 1, 2, 1, 2], b: [1, 2, 1, 2, 1, 2], imp: "Little public policy activity.", fin: "No clear financial route.", h: "long", who: [] },
};

const rating = (t: T6, x: (typeof R)[string]): Rating => ({
  scale: t[0],
  scope: t[1],
  irremediability: t[2],
  impactLikelihood: t[3],
  magnitude: t[4],
  financialLikelihood: t[5],
  impactReason: x.imp,
  financialReason: x.fin,
  horizon: x.h,
  stakeholders: x.who,
  quote: null,
  page: null,
  evidence: "none",
});

let kn = 0;
const k = (name: string, type: Kpi["type"], unit: string, baseline: string, target: string, targetYear: number, direction: Kpi["direction"], owner: string, source: string, framework: string, frequency = "Annual"): Kpi => ({
  id: `K${++kn}`, name, type, unit, baseline, target, targetYear, direction, frequency, owner, source, framework,
});

const o = (n: number, perspective: Perspective, title: string, why: string, topicIds: string[], drives: string[], kpis: Kpi[], initiatives: Objective["initiatives"]): Objective => ({
  id: `O${n}`, perspective, title, why, topicIds, drives, kpis, initiatives,
});

const objectives = (): Objective[] => {
  kn = 0;
  return [
    o(1, "financial", "Grow revenue from EV and low-carbon products", "Product mix is the biggest financial lever, and EV programmes are where OEMs are placing new work.", ["product", "climate_ghg"], [], [
      k("Revenue from EV and low-carbon components", "lagging", "% of revenue", "14", "35% of revenue", 2030, "up", "Chief Financial Officer", "Finance system", "ESRS E1"),
      k("Signed EV programme order book", "leading", "Rs crore", "2,100", "Rs 6,000 crore", 2029, "up", "Head of Business Development", "Sales pipeline", ""),
    ], [{ name: "Dedicated EV business unit with its own targets", owner: "Managing Director", timeline: "FY27" }]),
    o(2, "financial", "Protect margins from energy and carbon costs", "Power and carbon border costs hit the margin directly.", ["energy", "climate_ghg"], [], [
      k("Energy cost as share of sales", "lagging", "% of sales", "6.8", "5.0% of sales", 2030, "down", "Chief Financial Officer", "Finance system", "GRI 302-1"),
      k("Carbon border cost exposure on EU exports", "lagging", "Rs crore", "", "Below Rs 20 crore a year", 2028, "down", "Head of Exports", "EU export declarations", "ESRS E1"),
    ], []),
    o(3, "stakeholder", "Win and keep EU and US OEM customers on ESG scorecards", "OEMs now score suppliers on ESG and shift volume to the best performers.", ["supply_chain", "product"], ["O1"], [
      k("OEM ESG rating (EcoVadis score)", "lagging", "points", "62", "75 points", 2028, "up", "Head of Sustainability", "EcoVadis scorecard", ""),
      k("Customer ESG audits passed first time", "leading", "% of audits", "70", "95% of audits", 2027, "up", "Head of Quality", "Audit log", ""),
    ], [{ name: "Single ESG evidence pack shared with all OEMs", owner: "Head of Sustainability", timeline: "FY27" }]),
    o(4, "stakeholder", "Keep local communities and regulators supportive", "Water and permits decide whether plants can grow.", ["communities", "water"], ["O2"], [
      k("Households reached by water and skills programmes", "leading", "households", "12,000", "50,000 households", 2030, "up", "CSR Head", "CSR reports", "GRI 413-1"),
      k("Regulatory notices received", "lagging", "count", "3", "Zero notices", 2027, "down", "Head of EHS", "Compliance register", ""),
    ], []),
    o(5, "process", "Cut Scope 1 and 2 emissions at all plants", "Plant energy is the largest share of the company's own emissions and the cost OEMs look at first.", ["climate_ghg", "energy"], ["O2", "O3"], [
      k("Scope 1 and 2 emissions intensity", "lagging", "tCO2e per Rs crore", "28.4", "17 tCO2e per Rs crore", 2030, "down", "Head of Manufacturing", "Energy and fuel records", "GRI 305-4"),
      k("Renewable share of electricity", "leading", "% of kWh", "22", "60% of electricity", 2030, "up", "Head of Utilities", "Power purchase records", "BRSR Core"),
      k("Capex approvals that include a carbon price test", "leading", "% of approvals", "", "100% of approvals", 2027, "up", "Chief Financial Officer", "Capex committee papers", ""),
    ], [{ name: "Rooftop solar and open access wind at four plants", owner: "Head of Utilities", timeline: "FY27 to FY29" }, { name: "Switch furnace fuel from coal to gas and electric", owner: "Head of Manufacturing", timeline: "FY28" }]),
    o(6, "process", "Reach zero harm in every plant", "Injuries hurt people first, and OEM audits treat safety as a gate.", ["safety", "wellbeing"], ["O3"], [
      k("Lost time injury frequency rate", "lagging", "per million hours", "0.52", "Below 0.2", 2028, "down", "Head of EHS", "Safety incident system", "BRSR Core"),
      k("Near-miss reports per 100 workers", "leading", "reports", "4.1", "12 reports per 100 workers", 2027, "up", "Head of EHS", "Safety incident system", ""),
    ], [{ name: "Machine guarding upgrade on all presses", owner: "Head of Manufacturing", timeline: "FY27" }]),
    o(7, "process", "Recover more scrap and use less water", "Metal and water are the two inputs where small gains add up.", ["waste", "water", "circular"], ["O2", "O4"], [
      k("Scrap metal recovered and recycled", "lagging", "% of scrap", "81", "95% of scrap", 2029, "up", "Head of Manufacturing", "Weighbridge records", "GRI 306-4"),
      k("Water withdrawal intensity", "lagging", "kl per Rs crore", "310", "220 kl per Rs crore", 2030, "down", "Head of EHS", "Plant water meters", "BRSR Core"),
    ], []),
    o(8, "process", "Hold suppliers to our ESG standards", "Most of the footprint and most of the OEM audit risk sits in the supply base.", ["supply_chain", "human_rights"], ["O3"], [
      k("Tier-1 suppliers assessed on ESG", "leading", "% of spend", "38", "90% of spend", 2027, "up", "Head of Procurement", "Supplier portal", "GRI 308-1"),
      k("Supplier corrective plans closed on time", "leading", "% of plans", "", "85% of plans", 2028, "up", "Head of Procurement", "Supplier portal", ""),
    ], [{ name: "Supplier code of conduct written into all purchase terms", owner: "Head of Procurement", timeline: "FY27" }]),
    o(9, "learning", "Build EV and energy engineering skills", "New products and plant upgrades need skills the workforce does not yet have.", ["talent", "product"], ["O1", "O5"], [
      k("Training hours per engineer on EV and energy management", "leading", "hours", "6", "24 hours per engineer", 2027, "up", "Head of HR", "Learning system", "GRI 404-1"),
    ], []),
    o(10, "learning", "Make ESG data reliable and owned by the board", "Customers and investors trust numbers that are assured and governed.", ["governance", "ethics", "privacy"], ["O3", "O8"], [
      k("BRSR Core KPIs under reasonable assurance", "leading", "% of KPIs", "0", "100% of KPIs", 2028, "up", "Chief Financial Officer", "Assurance report", "BRSR Core"),
      k("Board ESG committee reviews per year", "leading", "count", "2", "4 reviews a year", 2027, "up", "Company Secretary", "Board minutes", "GRI 2-12"),
    ], []),
  ];
};

const critique = (): Critique => ({
  verdict: "A clear chain from skills and data up to EV revenue and margin. Customer safety and quality, a top financial risk, has no objective, and three KPIs have no baseline.",
  strengths: ["The map reads as a story: skills and data lead to emissions and supplier action, then to OEM trust, then to revenue.", "Emission and safety KPIs have baselines, numbers and years.", "Over half of the KPIs are leading, so the board gets early warning."],
  issues: [
    { severity: "high", title: "No objective for product safety and quality", detail: "A recall in brake or steering parts could cost far more than most KPIs here protect, yet the topic ranks high on the financial side and no objective answers it.", objectiveIds: ["O3"] },
    { severity: "medium", title: "Three KPIs have no baseline", detail: "Carbon border cost, capex carbon test and supplier corrective plans cannot be tracked until a starting value is set.", objectiveIds: ["O2", "O5", "O8"] },
    { severity: "medium", title: "Link from regulators to margin is thin", detail: "Objective O4 drives O2 but the story for how community goodwill lowers costs is not stated.", objectiveIds: ["O4", "O2"] },
    { severity: "low", title: "Scope 3 is not on the scorecard", detail: "OEMs ask for supply chain emissions, and only supplier assessment coverage is tracked.", objectiveIds: ["O8"] },
  ],
  kpiNotes: [
    { kpiId: "K4", rating: "weak", note: "No baseline, and an absolute rupee ceiling is hard to judge without export volume.", better: "Carbon border cost as % of EU export revenue, baseline from the first filed declarations." },
    { kpiId: "K9", rating: "strong", note: "Intensity metric with a baseline, number, year and a standard reference.", better: null },
    { kpiId: "K13", rating: "ok", note: "Good leading KPI. Say clearly that a rise is good, since reporting more near misses means a healthier safety culture.", better: null },
  ],
  fixes: [
    { action: "Add an objective on product safety and quality with a recall rate or customer PPM KPI.", why: "It is a top financial risk with no owner.", impact: "high" },
    { action: "Set baselines for the three blank KPIs before the first review.", why: "Targets without starting values cannot be tracked.", impact: "medium" },
    { action: "Add a Scope 3 KPI such as supplier emissions data coverage.", why: "OEM scorecards ask for it.", impact: "medium" },
  ],
  model: "sample",
});

export function sampleStudy(): Study {
  const topics = TOPICS.map((t) => ({
    id: t.id, label: t.label, group: t.group, custom: false, brsr: t.brsr, esrs: t.esrs, gri: t.gri,
    a: rating(R[t.id].a, R[t.id]),
    b: rating(R[t.id].b, R[t.id]),
  }));
  return {
    id: "sample-auto",
    createdAt: new Date("2026-11-01T09:00:00Z").toISOString(),
    demo: true,
    profile: {
      company: "Sample Auto Components Ltd (illustrative)",
      sector: "Automotive and auto components",
      geography: "Six plants in Pune, Chennai and Gurugram. About 40 percent of sales go to EU and US OEMs.",
      size: "About Rs 4,200 crore revenue and 9,000 employees",
      strategy: "Shift from engine parts to EV drivetrain components and keep export customers as carbon rules tighten.",
      concerns: "OEM ESG audits, EU carbon border costs, plant safety and groundwater near two plants.",
      horizon: 2030,
    },
    report: null,
    models: { a: "Gemini (sample)", b: "Grok (sample)", build: "Gemini (sample)", critique: "Grok (sample)" },
    summary: "Sustainability protects export revenue and margin while the company moves to EV parts. Plant emissions, supplier standards and safety are the proof points OEMs check. Skills and assured data make it repeatable.",
    topics,
    objectives: objectives(),
    critique: critique(),
    warnings: ["This is a fictional sample with made-up numbers, so it works without an upload or API keys."],
  };
}
