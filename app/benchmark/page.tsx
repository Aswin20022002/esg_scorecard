import { CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";

export const metadata = { title: "Benchmark: how Scorecard Studio compares with existing tools" };

type V = "yes" | "partly" | "none";

const COLS = ["Materiality platforms", "Balanced scorecard software", "ESG reporting and data platforms", "General AI chatbots", "Scorecard Studio"];

const ROWS: { cap: string; v: V[] }[] = [
  { cap: "Scores impact and financial materiality separately", v: ["yes", "none", "partly", "partly", "yes"] },
  { cap: "Two independent AI models rate it and disagreements are shown", v: ["none", "none", "none", "none", "yes"] },
  { cap: "Materiality result flows straight into objectives and KPIs", v: ["none", "none", "partly", "partly", "yes"] },
  { cap: "Strategy map with cause and effect links", v: ["none", "yes", "none", "partly", "yes"] },
  { cap: "Topics mapped to BRSR, ESRS and GRI", v: ["partly", "none", "yes", "partly", "yes"] },
  { cap: "Rule based quality check of the scorecard", v: ["none", "partly", "none", "none", "yes"] },
  { cap: "Independent review by a different AI model", v: ["none", "none", "none", "none", "yes"] },
  { cap: "Evidence quotes checked against the company's own report", v: ["partly", "none", "partly", "none", "yes"] },
  { cap: "Adjustable materiality line and your own override", v: ["partly", "none", "none", "none", "yes"] },
  { cap: "Ask for changes in plain English, with undo", v: ["none", "none", "none", "partly", "yes"] },
  { cap: "Free to try with no setup or account", v: ["none", "none", "none", "yes", "yes"] },
];

const GAPS: { gap: string; why: string; fix: string }[] = [
  {
    gap: "Materiality ends at a chart",
    why: "The Datamaran article on its DMA Evaluate tool describes keeping the assessment current and documented. It does not mention a link to KPIs, targets or scorecards, so the team still has to turn priorities into a plan by hand.",
    fix: "The top material topics feed directly into objectives, KPIs, targets and owners, and every objective names the topics it answers.",
  },
  {
    gap: "Scorecard software starts from a blank page and has no ESG content",
    why: "The Spider Impact page describes strategy maps, KPI dashboards, initiatives and AI insights on your data. It does not mention ESG, sustainability or materiality, so the user must already know what to put in.",
    fix: "The strategy map and scorecard are drafted for you from the materiality result, using the four Balanced Scorecard views and a fixed ESG topic list mapped to BRSR, ESRS and GRI.",
  },
  {
    gap: "Sustainability is bolted on, not tied to strategy",
    why: "Figge, Hahn, Schaltegger and Wagner argue that the Balanced Scorecard is a promising way to link environmental and social management to business strategy. Most ESG tools still run on a separate track from the strategy.",
    fix: "The company's own strategy goes in at the start, and the map ends in a financial and value view, so each objective shows how it helps the business.",
  },
  {
    gap: "One AI opinion, taken on trust",
    why: "A single chatbot rating of what is material cannot show how sure it is. Different runs and models can give different answers.",
    fix: "Gemini and Grok rate every topic separately, and the matrix shows both. Where they differ by a point or more, a red whisker and a flag appear so the team knows where to discuss.",
  },
  {
    gap: "Scores hide how they were made",
    why: "A materiality score with no breakdown cannot be challenged in a workshop.",
    fix: "Each score comes from six visible sub-scores (scale, scope, irreversibility, impact likelihood, financial size, financial likelihood). You can open any topic, read both reasons, and set your own score.",
  },
  {
    gap: "The materiality cut-off is arbitrary",
    why: "There is no official threshold, and moving it quietly changes what counts as material.",
    fix: "The line is a slider you control. The count of material topics and the scorecard checks update at once, so the effect of the choice is visible.",
  },
  {
    gap: "AI drafts are never checked for quality",
    why: "A scorecard can look complete and still miss a material topic, lack baselines, or have no leading indicators.",
    fix: "Twelve rule checks run as plain code for coverage, linkage, measurability and balance, and a second model reviews the scorecard cold. The rules re-run as you edit.",
  },
  {
    gap: "Made-up numbers",
    why: "Language models fill gaps with confident figures, and a scorecard with invented baselines is worse than one with blanks.",
    fix: "Baselines come only from the report you supply, and are left empty otherwise. Empty baselines are flagged and lower the Measurability score. Report quotes are searched for in the PDF.",
  },
];

const SOURCES: [string, string][] = [
  ["ESG Today, Datamaran launches double materiality assessment solution", "https://www.esgtoday.com/datamaran-launches-double-materiality-assessment-solution/"],
  ["Spider Strategies, best balanced scorecard software", "https://www.spiderstrategies.com/blog/best-balanced-scorecard-software/"],
  ["Figge, Hahn, Schaltegger and Wagner (2002), The Sustainability Balanced Scorecard, Business Strategy and the Environment", "https://econpapers.repec.org/RePEc:bla:bstrat:v:11:y:2002:i:5:p:269-284"],
];

function Mark({ v }: { v: V }) {
  if (v === "yes") return <span className="inline-flex items-center gap-1.5 font-semibold text-ok"><CheckCircle2 size={18} aria-hidden /> Yes</span>;
  if (v === "partly") return <span className="inline-flex items-center gap-1.5 font-semibold text-warn"><MinusCircle size={18} aria-hidden /> Partly</span>;
  return <span className="inline-flex items-center gap-1.5 text-mute"><CircleDashed size={18} aria-hidden /> Not evident</span>;
}

export default function Benchmark() {
  return (
    <div className="pt-4">
      <h1 className="max-w-3xl font-display text-4xl font-extrabold sm:text-5xl">How existing tools compare, and the gaps we closed</h1>
      <p className="mt-4 max-w-2xl text-lg text-mute">
        Turning ESG priorities into a managed strategy takes three jobs: deciding what is material, designing the strategy and scorecard, and checking that it holds together. Existing tools each do about one of them.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-mute">
        This is a desk review of public product pages and papers, kept short for a class project. Read &ldquo;Not evident&rdquo; as &ldquo;not found in public material&rdquo;, which is not proof that it is absent. Ratings describe each group in general, and individual products vary. Reviewed in November 2026.
      </p>

      <section className="mt-10" aria-labelledby="matrix">
        <h2 id="matrix" className="font-display text-2xl font-bold">Capability comparison</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface shadow-lift">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <caption className="sr-only">Capabilities by group of tools</caption>
            <thead>
              <tr className="border-b border-line bg-paper">
                <th scope="col" className="w-[30%] px-4 py-3 font-display text-base">Capability</th>
                {COLS.map((c, i) => (
                  <th key={c} scope="col" className={`px-3 py-3 font-display text-base ${i === COLS.length - 1 ? "bg-tint text-brand-ink" : ""}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.cap} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium">{r.cap}</th>
                  {r.v.map((v, i) => (
                    <td key={i} className={`px-3 py-3 ${i === r.v.length - 1 ? "bg-[#f0f8f4]" : ""}`}><Mark v={v} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="who">
        <h2 id="who" className="font-display text-2xl font-bold">Who is in each group</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["Materiality platforms", "Datamaran and similar tools. They help companies run and keep up to date a double materiality assessment, often with AI scanning external signals, and keep an audit trail."],
            ["Balanced scorecard software", "Spider Impact, ClearPoint Strategy, Cascade and similar. They manage strategy maps, KPIs, initiatives and dashboards for any kind of strategy."],
            ["ESG reporting and data platforms", "BRSR, CSRD and carbon reporting suites. They collect data inside a company and produce the filing. They are strong on data and weak on strategy design."],
            ["General AI chatbots", "Can draft a scorecard when asked, but give one unchecked opinion and no structure, scoring rules or review unless the user builds them."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface p-4">
              <dt className="font-display text-lg font-bold">{t}</dt>
              <dd className="mt-1 text-sm text-mute">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="gaps">
        <h2 id="gaps" className="font-display text-2xl font-bold">Gaps found and how Scorecard Studio closes each one</h2>
        <ul className="mt-4 space-y-3">
          {GAPS.map((g) => (
            <li key={g.gap} className="grid gap-4 rounded-2xl border border-line bg-surface p-5 md:grid-cols-2">
              <div>
                <h3 className="font-display text-lg font-bold">{g.gap}</h3>
                <p className="mt-1.5 text-sm text-mute">{g.why}</p>
              </div>
              <div className="rounded-xl bg-[#e0f3e9] p-4">
                <p className="text-sm font-bold text-ok">How it is closed</p>
                <p className="mt-1 text-sm">{g.fix}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="src">
        <h2 id="src" className="font-display text-2xl font-bold">Sources</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {SOURCES.map(([t, u]) => (
            <li key={u}><a className="font-medium text-brand underline" href={u} target="_blank" rel="noreferrer">{t}</a></li>
          ))}
        </ul>
        <p className="mt-3 max-w-3xl text-sm text-mute">Descriptions of ClearPoint Strategy, Cascade, ESG reporting suites and chatbots are general and were not tested hands-on for this review.</p>
      </section>
    </div>
  );
}
