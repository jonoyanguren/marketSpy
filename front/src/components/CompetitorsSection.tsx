import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../api";
import type { Competitor } from "../api/competitors";
import { previewCrawl, type CrawlSummary } from "../api/crawling";

type CompetitorsSectionProps = {
  competitors: Competitor[];
  selectedCompetitorId: string;
  onCompetitorSelected: (competitorId: string) => void;
};

export function CompetitorsSection({
  competitors,
  selectedCompetitorId,
  onCompetitorSelected,
}: CompetitorsSectionProps) {
  const [summary, setSummary] = useState<CrawlSummary | null>(null);
  const [error, setError] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  const domainToUrl = (d: string): string =>
    /^https?:\/\//i.test(d) ? d : `https://${d}`;

  const handleCrawl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const competitor = competitors.find((c) => c.id === selectedCompetitorId);
    if (!competitor) {
      setError("Selecciona un competitor antes de lanzar el crawl.");
      setSummary(null);
      return;
    }

    setIsCrawling(true);
    setError("");
    setSummary(null);

    try {
      const { summary: s } = await previewCrawl({
        url: domainToUrl(competitor.domain),
        competitorId: selectedCompetitorId,
      });
      setSummary(s);
    } catch (requestError) {
      setSummary(null);
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to reach the backend.",
      );
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">Crawl</h2>
        <p className="mt-2 text-sm text-slate-400">
          Selecciona un competitor y lanza el crawl de su dominio.{" "}
          <Link
            to="/competitors"
            className="text-cyan-400 hover:underline"
          >
            Gestionar competitors
          </Link>
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">
            Competitor seleccionado
          </span>
          <select
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            value={selectedCompetitorId}
            onChange={(event) => {
              onCompetitorSelected(event.target.value);
              setSummary(null);
            }}
          >
            <option value="">Selecciona un competitor</option>
            {competitors.map((competitor) => (
              <option key={competitor.id} value={competitor.id}>
                {competitor.name} ({competitor.domain})
              </option>
            ))}
          </select>
        </label>

        {competitors.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
            Todavia no hay competitors creados.
          </div>
        ) : selectedCompetitorId ? (
          <form className="mt-3" onSubmit={handleCrawl}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCrawling}
            >
              {isCrawling ? "Haciendo crawling..." : "Lanzar crawling"}
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div
          className={`mt-6 rounded-2xl border p-5 text-sm ${
            summary.type === "baseline"
              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
              : summary.type === "changes"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-slate-600 bg-slate-800/50 text-slate-300"
          }`}
        >
          <p className="font-semibold">{summary.headline}</p>
          <ul className="mt-3 space-y-1">
            {summary.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ) : selectedCompetitorId ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Todavia no se ha lanzado ningun crawling para este competitor.
        </div>
      ) : null}
    </section>
  );
}
