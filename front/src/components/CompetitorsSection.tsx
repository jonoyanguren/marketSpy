import { type FormEvent, useState } from "react";

import { ApiError } from "../api";
import type { Competitor } from "../api/competitors";
import { createCompetitor } from "../api/competitors";
import {
  previewCrawl,
  type CrawlPreviewData,
  type ChangeReportData,
} from "../api/crawling";

type CompetitorsSectionProps = {
  competitors: Competitor[];
  selectedCompetitorId: string;
  onCompetitorCreated: (competitor: Competitor) => void;
  onCompetitorSelected: (competitorId: string) => void;
};

export function CompetitorsSection({
  competitors,
  selectedCompetitorId,
  onCompetitorCreated,
  onCompetitorSelected,
}: CompetitorsSectionProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [crawlResult, setCrawlResult] = useState<CrawlPreviewData | null>(null);
  const [changeReport, setChangeReport] =
    useState<ChangeReportData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);

  const handleCreateCompetitor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const competitor = await createCompetitor({ name, domain });
      onCompetitorCreated(competitor);
      setName("");
      setDomain("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to create competitor.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const domainToUrl = (d: string): string =>
    /^https?:\/\//i.test(d) ? d : `https://${d}`;

  const handleCrawl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const competitor = competitors.find((c) => c.id === selectedCompetitorId);
    if (!competitor) {
      setError("Selecciona un competitor antes de lanzar el crawl.");
      setCrawlResult(null);
      return;
    }

    setIsCrawling(true);
    setError("");
    setCrawlResult(null);
    setChangeReport(null);

    try {
      const { data, changeReport: cr } = await previewCrawl({
        url: domainToUrl(competitor.domain),
        competitorId: selectedCompetitorId,
      });
      setCrawlResult(data);
      setChangeReport(cr ?? null);
    } catch (requestError) {
      setCrawlResult(null);
      setChangeReport(null);
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
        <h2 className="text-xl font-semibold text-white">Competitors</h2>
        <p className="mt-2 text-sm text-slate-400">
          Crea competitors, selecciona uno y lanza el crawl de su dominio.
        </p>
      </div>

      <form
        className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={handleCreateCompetitor}
      >
        <input
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del competitor"
        />
        <input
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="python.org o https://python.org"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Creando..." : "Crear"}
        </button>
      </form>

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
              setCrawlResult(null);
              setChangeReport(null);
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

      {crawlResult ? (
        <div className="mt-6 space-y-4">
          {changeReport ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
              <p className="font-semibold text-amber-100">
                Cambios detectados vs snapshot anterior
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {changeReport.htmlChanged ? (
                  <li>HTML cambio (hash distinto)</li>
                ) : null}
                {changeReport.visibleTextChanged ? (
                  <li>Texto visible cambio (hash distinto)</li>
                ) : null}
                {changeReport.titleDiff ? (
                  <li>
                    Title: "{changeReport.titleDiff.from}" → "
                    {changeReport.titleDiff.to}"
                  </li>
                ) : null}
                {changeReport.h1Diff ? (
                  <li>
                    H1: "{changeReport.h1Diff.from ?? "—"}" → "
                    {changeReport.h1Diff.to ?? "—"}"
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
            <p>
              <strong>Competitor:</strong> {crawlResult.competitor.name} (
              {crawlResult.competitor.domain})
            </p>
            <p>
              <strong>Requested URL:</strong> {crawlResult.requestedUrl}
            </p>
            <p>
              <strong>Final URL:</strong> {crawlResult.finalUrl}
            </p>
            <p>
              <strong>Title:</strong> {crawlResult.title || "Sin titulo"}
            </p>
            <p>
              <strong>H1:</strong> {crawlResult.h1 || "Sin H1"}
            </p>
            <p>
              <strong>HTML length:</strong> {crawlResult.htmlLength}
            </p>
            <p>
              <strong>Visible text length:</strong> {crawlResult.visibleTextLength}
            </p>
            <p>
              <strong>Snapshot ID:</strong> {crawlResult.snapshotId}
            </p>
            <p>
              <strong>Crawled at:</strong> {crawlResult.crawledAt}
            </p>
            <p className="break-all">
              <strong>HTML hash:</strong> {crawlResult.htmlHash}
            </p>
            <p className="break-all">
              <strong>Visible text hash:</strong> {crawlResult.visibleTextHash}
            </p>
          </div>
        </div>
      ) : selectedCompetitorId ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Todavia no se ha lanzado ningun crawling para este competitor.
        </div>
      ) : null}
    </section>
  );
}
