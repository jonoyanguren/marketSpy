import { type FormEvent, useState } from "react";

import { ApiError } from "../api";
import { previewCrawl, type CrawlPreviewData } from "../api/crawling";

export function CrawlSection() {
  const [url, setUrl] = useState("https://example.com");
  const [crawlResult, setCrawlResult] = useState<CrawlPreviewData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await previewCrawl(url);
      setCrawlResult(data);
    } catch (requestError) {
      setCrawlResult(null);
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to reach the backend.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">Crawl</h2>
        <p className="mt-2 text-sm text-slate-400">
          Lanza `POST /api/crawling/preview` y muestra la respuesta real del
          backend.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">
            URL a crawlear
          </span>
          <input
            type="url"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Haciendo crawling..." : "Lanzar crawling"}
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {crawlResult ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
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
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Todavia no se ha lanzado ningun crawling real.
        </div>
      )}
    </section>
  );
}
