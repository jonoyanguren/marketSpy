import { useEffect, useState } from "react";

import { ApiError } from "../api";
import { getCrawlHistory, type CrawlHistoryItem } from "../api/crawling";

export function HistoryPage() {
  const [items, setItems] = useState<CrawlHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getCrawlHistory();
        setItems(data);
      } catch (requestError) {
        setError(
          requestError instanceof ApiError || requestError instanceof Error
            ? requestError.message
            : "Unable to load crawl history.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">History</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ultimos crawls guardados en la base de datos.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Cargando historial...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Todavia no hay crawls guardados.
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300"
            >
              <p className="font-semibold text-white">
                {item.title || "Sin titulo"}
              </p>
              <p className="mt-1 break-all text-slate-400">{item.finalUrl}</p>
              <div className="mt-4 space-y-1">
                <p>
                  <strong>Snapshot ID:</strong> {item.id}
                </p>
                <p>
                  <strong>H1:</strong> {item.h1 || "Sin H1"}
                </p>
                <p>
                  <strong>Crawled at:</strong> {item.crawledAt}
                </p>
                <p>
                  <strong>HTML length:</strong> {item.htmlLength}
                </p>
                <p>
                  <strong>Visible text length:</strong> {item.visibleTextLength}
                </p>
                <p className="break-all">
                  <strong>HTML hash:</strong> {item.htmlHash}
                </p>
                <p className="break-all">
                  <strong>Visible text hash:</strong> {item.visibleTextHash}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
