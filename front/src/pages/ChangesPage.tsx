import { useEffect, useState } from "react";

import { ApiError } from "../api";
import {
  getChangeReports,
  type ChangeReportItem,
} from "../api/crawling";

export function ChangesPage() {
  const [items, setItems] = useState<ChangeReportItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChanges = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getChangeReports();
        setItems(data);
      } catch (requestError) {
        setError(
          requestError instanceof ApiError || requestError instanceof Error
            ? requestError.message
            : "Unable to load change reports.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadChanges();
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">Cambios detectados</h2>
        <p className="mt-2 text-sm text-slate-400">
          Diferencias entre snapshots consecutivos del mismo competitor.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Cargando cambios...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          No se han detectado cambios aun. Haz varios crawls del mismo
          competitor para ver las diferencias.
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200"
            >
              <p className="font-semibold text-amber-100">
                {item.competitor
                  ? `${item.competitor.name} (${item.competitor.domain})`
                  : "Competitor desconocido"}
              </p>
              <p className="mt-1 break-all text-slate-400">{item.requestedUrl}</p>
              <p className="mt-1 text-slate-500">{item.detectedAt}</p>
              <ul className="mt-3 list-inside list-disc space-y-1">
                {item.htmlChanged ? (
                  <li>HTML cambio (hash distinto)</li>
                ) : null}
                {item.visibleTextChanged ? (
                  <li>Texto visible cambio (hash distinto)</li>
                ) : null}
                {item.titleDiff ? (
                  <li>
                    Title: &quot;{item.titleDiff.from}&quot; →
                    &quot;{item.titleDiff.to}&quot;
                  </li>
                ) : null}
                {item.h1Diff ? (
                  <li>
                    H1: &quot;{item.h1Diff.from ?? "—"}&quot; →
                    &quot;{item.h1Diff.to ?? "—"}&quot;
                  </li>
                ) : null}
              </ul>
              <div className="mt-3 text-xs text-slate-600">
                <p>
                  Snapshot A: {item.snapshotAId} | Snapshot B: {item.snapshotBId}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
