import { PART_HELP, PART_LABEL, PART_WEIGHT, PARTS } from "@/lib/rules";
import { TOPICS } from "@/lib/topics";

export const metadata = { title: "Method: how Scorecard Studio works" };

const STEPS = [
  ["Describe", "You enter the company, sector, strategy and what stakeholders ask for. An optional report PDF is read in your browser, and only the pages that look relevant are sent."],
  ["Rate (two models)", "Gemini and Grok each rate all 21 topics on six sub-scores. Grok never sees Gemini's scores. Gemini may add up to two company-specific topics, which Grok then rates too."],
  ["Combine", "Scores are averaged per topic. If the two models differ by one point or more on either side, the topic is flagged. You can move the materiality line and override any topic."],
  ["Build", "Gemini drafts 9 to 12 objectives across four views, links them, and gives each 1 to 3 KPIs with baseline, target, year, owner and data source. Baselines come only from the report."],
  ["Review", "Grok reads the scorecard cold and lists weak spots, weak KPIs and missing risks. A separate set of code rules checks coverage, linkage, measurability and balance."],
  ["Refine", "You edit values by hand or ask for a change in words. Rule checks update at once, and the AI review is marked stale until you rerun it."],
];

export default function Method() {
  return (
    <div className="pt-4">
      <h1 className="max-w-3xl font-display text-4xl font-extrabold sm:text-5xl">How it works, and how far to trust it</h1>
      <p className="mt-4 max-w-2xl text-lg text-mute">Every score has a stated rule. Nothing here is a black box, and the AI parts are fenced by checks that are plain code.</p>

      <section className="mt-10" aria-labelledby="pipe">
        <h2 id="pipe" className="font-display text-2xl font-bold">The six steps</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand font-display font-bold text-white" aria-hidden>{i + 1}</span>
              <div><h3 className="font-display text-lg font-bold">{t}</h3><p className="mt-0.5 text-sm text-mute">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12" aria-labelledby="mat">
        <h2 id="mat" className="font-display text-2xl font-bold">How materiality is scored</h2>
        <p className="mt-2 max-w-3xl text-mute">The method follows the double materiality idea used in ESRS: a topic matters if it has a big effect on people and the planet, or on the company&apos;s finances, or both.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4">
            <h3 className="font-display text-lg font-bold">Impact side</h3>
            <p className="mt-1 text-sm text-mute">Severity is the average of scale, scope and irreversibility, each 1 to 5. The score is severity times likelihood divided by 5, so a remote impact counts for less and an actual impact counts in full.</p>
            <p className="mt-2 rounded-lg bg-paper px-3 py-2 font-mono text-sm">impact = average(scale, scope, irreversibility) x likelihood / 5</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <h3 className="font-display text-lg font-bold">Financial side</h3>
            <p className="mt-1 text-sm text-mute">Size of the effect on profit, cost of capital or market access (1 to 5), times how likely it is within the planning horizon.</p>
            <p className="mt-2 rounded-lg bg-paper px-3 py-2 font-mono text-sm">financial = size x likelihood / 5</p>
          </div>
        </div>
        <ul className="mt-4 max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-mute">
          <li>The default materiality line is 2.5 out of 5. It is a convention, not a rule, so it is a slider.</li>
          <li>A topic is material when it is above the line on either side. That is the &ldquo;either&rdquo; logic of double materiality.</li>
          <li>The final score is the average of the two models. A red flag appears when they differ by one point or more.</li>
          <li>Your override replaces the average for that topic and is marked as yours.</li>
          <li>The scorecard is built for the eight highest ranked material topics. Ranking uses the larger of the two scores.</li>
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="sc">
        <h2 id="sc" className="font-display text-2xl font-bold">Scorecard design</h2>
        <p className="mt-2 max-w-3xl text-mute">
          The scorecard uses the four Balanced Scorecard views of Kaplan and Norton, renamed for sustainability work: financial and value, customers, community and regulators, operations and value chain, and people, culture and systems. Arrows only point upward, from capability to process to stakeholder trust to value. Links that point the wrong way are dropped and reported.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="q">
        <h2 id="q" className="font-display text-2xl font-bold">Scorecard quality score</h2>
        <p className="mt-2 max-w-3xl text-mute">The score is plain code, so the same scorecard always gets the same number. It checks whether the scorecard could be run, not whether the company is good. The AI review is shown beside it and does not change the number.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-line bg-paper"><th className="px-4 py-3 font-display">Part</th><th className="px-4 py-3 font-display">Weight</th><th className="px-4 py-3 font-display">Question</th></tr></thead>
            <tbody>
              {PARTS.map((p) => (
                <tr key={p} className="border-b border-line last:border-0"><th scope="row" className="px-4 py-3 font-semibold">{PART_LABEL[p]}</th><td className="px-4 py-3 tnum">{PART_WEIGHT[p]}%</td><td className="px-4 py-3 text-mute">{PART_HELP[p]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-mute">
          <li>Coverage is weighted by priority, so missing the top topic costs more than missing the eighth.</li>
          <li>Measurability gives a third of the credit each for a baseline, a numeric target and a target year.</li>
          <li>Balance expects all four views, at least 30 percent leading KPIs, and 10 to 30 KPIs in total.</li>
          <li>A failed rule check caps the score at 79, so a scorecard cannot reach Strong while a top material topic has no objective or another check fails outright.</li>
          <li>The weights are a reasoned judgment, not fitted to data. Bands: Strong 80 and above, Solid 65, Patchy 45, Weak below.</li>
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="topics">
        <h2 id="topics" className="font-display text-2xl font-bold">The 21 topics and their framework codes</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-line bg-paper"><th className="px-4 py-3 font-display">Topic</th><th className="px-3 py-3 font-display">BRSR</th><th className="px-3 py-3 font-display">ESRS</th><th className="px-3 py-3 font-display">GRI</th></tr></thead>
            <tbody>
              {TOPICS.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0"><th scope="row" className="px-4 py-2.5 font-medium">{t.label}</th><td className="px-3 py-2.5">{t.brsr}</td><td className="px-3 py-2.5">{t.esrs}</td><td className="px-3 py-2.5">{t.gri}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-mute">The mapping is at topic level and is a working guide. Confirm exact disclosure codes against the standards before filing anything.</p>
      </section>

      <section className="mt-12" aria-labelledby="lim">
        <h2 id="lim" className="font-display text-2xl font-bold">Limits to know</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-1.5 pl-5 text-sm text-mute">
          <li>Without a report, ratings come from your description and the models&apos; sector knowledge. They are a starting point for a workshop, not a finished assessment.</li>
          <li>Real double materiality involves interviews with stakeholders. This tool replaces the blank page, not the conversation.</li>
          <li>Targets are proposals. Check them against the company&apos;s real capacity and any science-based pathway before committing.</li>
          <li>Two models agreeing does not make an answer right, since they can share the same blind spots.</li>
          <li>Saved scorecards stay in your browser only. Clearing site data removes them, so export what you want to keep.</li>
        </ul>
      </section>
    </div>
  );
}
