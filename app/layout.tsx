import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/public-sans";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Scorecard Studio: turn material ESG topics into a strategy and KPIs",
  description: "Describe a company, get a two-model double materiality matrix, a sustainability strategy map and a balanced scorecard with KPIs, targets and an independent review.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d6b55" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
          Skip to content
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="no-print border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-mute sm:px-6">
            <p className="max-w-3xl">
              Scorecard Studio gives a first draft for a strategy workshop. Ratings, targets and baselines come from AI plus the report you supply, so treat them as proposals to confirm with the business. Built for a course project on AI in ESG. Not investment or assurance advice.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
