export type Group = "E" | "S" | "G";

export interface TopicDef {
  id: string;
  label: string;
  group: Group;
  /** Plain description shown to the AI and the user */
  about: string;
  brsr: string;
  esrs: string;
  gri: string;
}

/** The fixed topic list. It maps to the SEBI BRSR principles, ESRS topical standards and GRI standards. */
export const TOPICS: TopicDef[] = [
  { id: "climate_ghg", label: "Greenhouse gas emissions", group: "E", about: "Scope 1, 2 and 3 emissions and the transition to low carbon", brsr: "P6", esrs: "E1", gri: "GRI 305" },
  { id: "energy", label: "Energy use and renewables", group: "E", about: "Energy consumed, energy efficiency and share of renewable energy", brsr: "P6", esrs: "E1", gri: "GRI 302" },
  { id: "climate_risk", label: "Climate resilience and physical risk", group: "E", about: "Exposure of sites and supply chain to heat, flood, cyclone and drought", brsr: "P6", esrs: "E1", gri: "GRI 201-2" },
  { id: "air", label: "Air and other pollution", group: "E", about: "Emissions of NOx, SOx, particulate matter and substances of concern", brsr: "P6", esrs: "E2", gri: "GRI 305-7" },
  { id: "water", label: "Water use and discharge", group: "E", about: "Water withdrawal, consumption, discharge and water stress", brsr: "P6", esrs: "E3", gri: "GRI 303" },
  { id: "biodiversity", label: "Biodiversity and land use", group: "E", about: "Effects on habitats, land and ecosystems", brsr: "P6", esrs: "E4", gri: "GRI 304" },
  { id: "circular", label: "Resource use and circularity", group: "E", about: "Material inputs, recycled content, design for reuse and end of life", brsr: "P2", esrs: "E5", gri: "GRI 301" },
  { id: "waste", label: "Waste management", group: "E", about: "Waste generated, hazardous waste, landfill and recovery", brsr: "P6", esrs: "E5", gri: "GRI 306" },
  { id: "product", label: "Sustainable products and services", group: "E", about: "Environmental and social benefits of what the company sells over its life cycle", brsr: "P2", esrs: "E5", gri: "GRI 416" },
  { id: "safety", label: "Health and safety", group: "S", about: "Injuries, fatalities, occupational health and safety systems", brsr: "P3", esrs: "S1", gri: "GRI 403" },
  { id: "wellbeing", label: "Employee wellbeing and retention", group: "S", about: "Benefits, wages, working conditions, attrition and engagement", brsr: "P3", esrs: "S1", gri: "GRI 401" },
  { id: "diversity", label: "Diversity, equity and inclusion", group: "S", about: "Gender and other diversity, equal pay, harassment prevention", brsr: "P3", esrs: "S1", gri: "GRI 405" },
  { id: "talent", label: "Skills and talent development", group: "S", about: "Training, capability building and career growth", brsr: "P3", esrs: "S1", gri: "GRI 404" },
  { id: "human_rights", label: "Human rights and labour practices", group: "S", about: "Forced and child labour, freedom of association, fair wages", brsr: "P5", esrs: "S1", gri: "GRI 408" },
  { id: "supply_chain", label: "Responsible sourcing", group: "S", about: "Supplier standards, audits and workers in the value chain", brsr: "P5", esrs: "S2", gri: "GRI 414" },
  { id: "communities", label: "Communities and inclusive growth", group: "S", about: "Local impact, livelihoods, CSR and rehabilitation", brsr: "P8", esrs: "S3", gri: "GRI 413" },
  { id: "customers", label: "Customer safety and product quality", group: "S", about: "Product safety, quality, recalls and customer satisfaction", brsr: "P9", esrs: "S4", gri: "GRI 416" },
  { id: "privacy", label: "Data privacy and cybersecurity", group: "S", about: "Protection of customer and employee data and systems", brsr: "P9", esrs: "S4", gri: "GRI 418" },
  { id: "ethics", label: "Ethics and anti-corruption", group: "G", about: "Code of conduct, bribery, whistleblowing, fair competition", brsr: "P1", esrs: "G1", gri: "GRI 205" },
  { id: "governance", label: "Board oversight of sustainability", group: "G", about: "Board committees, pay linked to ESG, risk management", brsr: "P1", esrs: "GOV", gri: "GRI 2" },
  { id: "advocacy", label: "Responsible policy engagement", group: "G", about: "Lobbying, industry body positions and public policy influence", brsr: "P7", esrs: "G1", gri: "GRI 415" },
];

export const TOPIC_BY_ID: Record<string, TopicDef> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export const GROUP_NAME: Record<Group, string> = { E: "Environment", S: "Social", G: "Governance" };
export const GROUP_COLOR: Record<Group, string> = { E: "var(--g-e)", S: "var(--g-s)", G: "var(--g-g)" };

export const SECTORS = [
  "Automotive and auto components",
  "Banking and financial services",
  "Cement and building materials",
  "Chemicals and specialty chemicals",
  "Consumer goods and FMCG",
  "Energy, oil and gas",
  "Information technology and services",
  "Infrastructure and construction",
  "Metals and mining",
  "Pharmaceuticals and healthcare",
  "Power and utilities",
  "Real estate",
  "Retail and e-commerce",
  "Telecom",
  "Textiles and apparel",
  "Transport and logistics",
  "Other",
];
