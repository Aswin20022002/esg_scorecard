# Scorecard Studio

AI builder for a Sustainability Balanced Scorecard. Describe a company (and optionally upload its report). Two AI models rate which ESG topics are material, then you get a strategy map and a scorecard with KPIs, baselines, targets, years and owners, reviewed by a model that did not write it.

Product 2 of the AI for ESG course project. Product 1 is BRSR Auditor.

## Deploy on Vercel
1. Push this folder to a Git repo (it is a Next.js app, nothing to configure).
2. Import the repo in Vercel.
3. Add environment variables: `GEMINI_API_KEY` (free key from Google AI Studio) and `XAI_API_KEY` (Grok).
4. Optional: `ACCESS_CODE` to protect your keys on a public URL, and `GEMINI_MODEL` or `XAI_MODEL` to pin model names.
5. Deploy. The Build page shows "Two-model mode" when both keys are found.

Run locally: `npm install`, copy `.env.example` to `.env.local`, then `npm run dev`.

## What it does
1. **Materiality matrix.** Gemini and Grok each rate 21 ESG topics (mapped to BRSR, ESRS and GRI) on six sub-scores, without seeing each other. Impact and financial scores are shown on a double materiality matrix. A red whisker marks topics where the models differ by a point or more. The materiality line is a slider, and you can override any topic.
2. **Strategy map.** Gemini drafts 9 to 12 objectives across four views (financial and value, stakeholders, processes, people and systems) with upward cause and effect links.
3. **Scorecard.** 14 to 26 KPIs with leading or lagging type, baseline, target, year, owner, data source and framework code. Edit values inline.
4. **Review.** Twelve rule checks (plain code) give a quality score out of 100. Grok then reviews the scorecard independently. Ask for changes in plain English, with undo.
5. **Export.** Excel friendly CSV for the scorecard and matrix, print to PDF, JSON.

## Where AI is used
Materiality ratings (two models), company specific extra topics, scorecard design, independent critique, plain English refine. Quotes from a supplied report are verified against the PDF text. Baselines are only taken from the report and are otherwise left blank.

## Class demo script
1. Open Benchmark: three tool groups, eight gaps.
2. Click "Try a sample first". Show the matrix, drag the materiality line, open a topic with a red whisker and read both models' reasons.
3. Strategy map: hover an objective to see its links.
4. Review: the sample has a deliberate gap (customer safety and quality has no objective) so the rule check fails and the score is held below Strong. Show the independent review agreeing.
5. Build your own company live, ask for "add an objective on product safety", then show the score rise.

## Honest limits
- Not tested with real API keys or real reports from this build environment. Test mocks were used for every AI call. Run one real company before presenting.
- Scorecard quality weights (30/20/30/20) are a reasoned judgment, not calibrated on data.
- Without a report, ratings rest on your description and model knowledge. Real materiality needs stakeholder input.
- Targets are proposals to confirm with the business.
- Framework mapping is at topic level, confirm exact codes before filing.
