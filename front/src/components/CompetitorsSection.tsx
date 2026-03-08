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
  const [selectedUrl, setSelectedUrl] = useState("");
  const [error, setError] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  const domainToUrl = (d: string): string =>
    /^https?:\/\//i.test(d) ? d : `https://${d}`;

  const competitor = competitors.find((c) => c.id === selectedCompetitorId);
  const baseUrl = competitor ? domainToUrl(competitor.domain) : "";
  const crawlOptions: { value: string; label: string }[] = competitor
    ? (() => {
        const seen = new Set<string>();
        const opts: { value: string; label: string }[] = [];
        const root = { value: baseUrl, label: `/${competitor.domain}` };
        if (!seen.has(root.value)) {
          seen.add(root.value);
          opts.push(root);
        }
        for (const u of competitor.urls ?? []) {
          const val = u.startsWith("/") ? baseUrl + u : u;
          if (!seen.has(val)) {
            seen.add(val);
            opts.push({ value: val, label: u });
          }
        }
        return opts;
      })()
    : [];

  const runCrawl = async (url: string) => {
    const { summary: s } = await previewCrawl({
      url,
      competitorId: selectedCompetitorId!,
    });
    return s;
  };

  const handleCrawl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!competitor) {
      setError("Selecciona un competitor antes de lanzar el crawl.");
      setSummary(null);
      return;
    }

    const urlToCrawl =
      crawlOptions.length > 1
        ? selectedUrl || crawlOptions[0]?.value
        : domainToUrl(competitor.domain);

    if (!urlToCrawl) {
      setError("Selecciona una URL.");
      return;
    }

    setIsCrawling(true);
    setError("");
    setSummary(null);

    try {
      const s = await runCrawl(urlToCrawl);
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

  const handleCrawlAll = async () => {
    if (!competitor || crawlOptions.length < 2) return;

    setIsCrawling(true);
    setError("");
    setSummary(null);

    const results: string[] = [];
    try {
      for (const opt of crawlOptions) {
        try {
          const s = await runCrawl(opt.value);
          results.push(`${opt.label}: ${s.headline}`);
        } catch (e) {
          results.push(
            `${opt.label}: Error - ${e instanceof Error ? e.message : "fallo"}`,
          );
        }
      }
      setSummary({
        type: "changes",
        headline: `Crawl completado (${crawlOptions.length} URLs)`,
        details: results,
      });
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
          <Link to="/competitors" className="text-cyan-400 hover:underline">
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
              setSelectedUrl("");
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
          <form className="mt-3 space-y-3" onSubmit={handleCrawl}>
            {crawlOptions.length > 1 ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    URL a crawlear
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    value={selectedUrl || crawlOptions[0]?.value}
                    onChange={(e) => setSelectedUrl(e.target.value)}
                  >
                    {crawlOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isCrawling}
                  >
                    {isCrawling ? "Haciendo crawling..." : "Lanzar crawling"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCrawlAll()}
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-400 px-5 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isCrawling}
                  >
                    {isCrawling
                      ? "..."
                      : `Crawl todas (${crawlOptions.length})`}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCrawling}
              >
                {isCrawling ? "Haciendo crawling..." : "Lanzar crawling"}
              </button>
            )}
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
