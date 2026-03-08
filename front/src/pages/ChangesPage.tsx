import { Fragment, useEffect, useState } from "react";

import { ApiError } from "../api";
import {
  getChangeReports,
  type ChangeReportItem,
} from "../api/crawling";

const severityLabel: Record<"low" | "medium" | "high" | "critical", string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const severityStyles: Record<
  "low" | "medium" | "high" | "critical",
  { dot: string; chip: string }
> = {
  low: {
    dot: "bg-emerald-400",
    chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  medium: {
    dot: "bg-amber-400",
    chip: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  high: {
    dot: "bg-orange-400",
    chip: "border-orange-500/40 bg-orange-500/10 text-orange-200",
  },
  critical: {
    dot: "bg-rose-400",
    chip: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  },
};

export function ChangesPage() {
  const [items, setItems] = useState<ChangeReportItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitorFilter, setCompetitorFilter] = useState("all");

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

  const competitorOptions = [
    ...new Map(
      items
        .filter((item) => item.competitor)
        .map((item) => [item.competitor!.id, item.competitor!]),
    ).values(),
  ];

  const filteredItems = items.filter((item) => {
    if (competitorFilter === "all") return true;
    if (competitorFilter === "unknown") return !item.competitor;
    return item.competitor?.id === competitorFilter;
  });

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">Cambios detectados</h2>
        <p className="mt-2 text-sm text-slate-400">
          Diferencias entre snapshots consecutivos del mismo competitor.
        </p>
        {!isLoading && !error && items.length > 0 ? (
          <div className="mt-4 max-w-sm">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Filtrar por competidor
            </label>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              value={competitorFilter}
              onChange={(e) => {
                setCompetitorFilter(e.target.value);
                setExpandedId(null);
              }}
            >
              <option value="all">Todos</option>
              {competitorOptions.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.name} ({competitor.domain})
                </option>
              ))}
              <option value="unknown">Competidor desconocido</option>
            </select>
          </div>
        ) : null}
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

      {!isLoading && !error && items.length > 0 && filteredItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          No hay cambios para el competidor seleccionado.
        </div>
      ) : null}

      {!isLoading && !error && filteredItems.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Competitor</th>
                <th className="px-4 py-3 text-left font-medium">URL</th>
                <th className="px-4 py-3 text-left font-medium">Severidad</th>
                <th className="px-4 py-3 text-left font-medium">Impacto</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isExpanded = expandedId === item.id;
                const severity =
                  item.aiStatus === "completed" && item.aiAnalysis
                    ? item.aiAnalysis.severity
                    : null;
                const severityStyle = severity ? severityStyles[severity] : null;

                return (
                  <Fragment key={item.id}>
                    <tr className="border-b border-slate-800 text-slate-200">
                      <td className="px-4 py-3">
                        {item.competitor
                          ? `${item.competitor.name} (${item.competitor.domain})`
                          : "Competitor desconocido"}
                      </td>
                      <td className="max-w-[360px] truncate px-4 py-3 text-slate-400">
                        {item.requestedUrl}
                      </td>
                      <td className="px-4 py-3">
                        {severity && severityStyle ? (
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs ${severityStyle.chip}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${severityStyle.dot}`} />
                            {severityLabel[severity]}
                          </span>
                        ) : item.aiStatus === "failed" ? (
                          <span className="text-rose-300">Sin evaluar</span>
                        ) : (
                          <span className="text-cyan-300">Procesando</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.aiStatus === "completed" && item.aiAnalysis
                          ? `${item.aiAnalysis.impactScore}/100`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(item.detectedAt).toLocaleString("es")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                          onClick={() =>
                            setExpandedId((current) => (current === item.id ? null : item.id))
                          }
                        >
                          {isExpanded ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="border-b border-slate-800 bg-slate-900/40">
                        <td colSpan={6} className="px-4 py-4">
                          {item.aiStatus === "completed" && item.aiAnalysis ? (
                            <div className="space-y-3 text-slate-200">
                              <p>{item.aiAnalysis.summary}</p>
                              <p className="text-xs text-slate-400">
                                Confianza: {Math.round(item.aiAnalysis.confidence * 100)}%
                              </p>
                              {item.aiAnalysis.recommendations.length > 0 ? (
                                <ul className="list-disc space-y-1 pl-5 text-slate-300">
                                  {item.aiAnalysis.recommendations.slice(0, 4).map((rec, idx) => (
                                    <li key={idx}>
                                      [{rec.priority}] {rec.action}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ) : item.aiStatus === "failed" ? (
                            <div className="space-y-2">
                              <p className="text-rose-300">
                                No se pudo evaluar este cambio.
                              </p>
                              {item.aiError ? (
                                <p className="text-xs text-slate-500">{item.aiError}</p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-cyan-300">Procesando informe...</p>
                          )}

                          <div className="mt-4 space-y-2">
                            {item.titleDiff && item.titleDiff.from !== item.titleDiff.to ? (
                              <p className="text-slate-300">
                                <span className="text-slate-500">Título:</span> "
                                {item.titleDiff.from}" → "{item.titleDiff.to}"
                              </p>
                            ) : null}
                            {item.h1Diff &&
                            (item.h1Diff.from ?? "") !== (item.h1Diff.to ?? "") ? (
                              <p className="text-slate-300">
                                <span className="text-slate-500">H1:</span> "
                                {item.h1Diff.from ?? "—"}" → "{item.h1Diff.to ?? "—"}"
                              </p>
                            ) : null}
                            {item.visibleTextDiff?.removed?.map((r, i) => (
                              <p key={`removed-${i}`} className="text-rose-300">
                                <span className="text-slate-500">Eliminado:</span> "{r}"
                              </p>
                            ))}
                            {item.visibleTextDiff?.added?.map((a, i) => (
                              <p key={`added-${i}`} className="text-emerald-300">
                                <span className="text-slate-500">Añadido:</span> "{a}"
                              </p>
                            ))}
                            {item.htmlChanged ? (
                              <p className="text-slate-400">HTML modificado</p>
                            ) : null}
                            <p className="text-xs text-slate-600">
                              Snapshot A: {item.snapshotAId} | Snapshot B: {item.snapshotBId}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
