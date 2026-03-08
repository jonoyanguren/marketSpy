import { type FormEvent, useEffect, useRef, useState } from "react";

import { ApiError } from "../api";
import type { Competitor } from "../api/competitors";
import {
  createCompetitor,
  deleteCompetitor,
  getCompetitorBaseline,
  getCompetitors,
  updateCompetitor,
  type CompetitorReport,
} from "../api/competitors";

function Badge({
  label,
  status,
}: {
  label: string;
  status: "ok" | "corto" | "largo" | "ausente";
}) {
  const classes =
    status === "ok"
      ? "bg-emerald-500/20 text-emerald-300"
      : status === "ausente"
        ? "bg-rose-500/20 text-rose-300"
        : status === "corto"
          ? "bg-amber-500/20 text-amber-300"
          : "bg-amber-500/20 text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function CompetitorReportPanel({
  report,
  isLoading,
  onClose,
}: {
  report: CompetitorReport | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
        Generando informe...
      </div>
    );
  }

  if (!report) return null;

  if (report.empty) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="font-semibold text-white">{report.executive.headline}</h3>
        <p className="mt-2 text-sm text-slate-400">{report.executive.summary}</p>
        <button
          type="button"
          className="mt-4 text-sm text-cyan-400 hover:underline"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    );
  }

  const seo = report.seo!;
  const positioning = report.positioning!;
  const structure = report.structure!;
  const content = report.content!;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
      <div className="border-b border-slate-700 bg-slate-950/50 px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {report.executive.headline}
        </h3>
        <button
          type="button"
          className="text-sm text-slate-400 hover:text-white"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>

      <div className="space-y-0">
        {/* Executive summary */}
        <section className="border-b border-slate-700/50 px-6 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Resumen ejecutivo
          </h4>
          <p className="text-sm leading-relaxed text-slate-300">
            {report.executive.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {report.url ? (
              <a
                href={report.url}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                {report.url}
              </a>
            ) : null}
            {report.crawledAt ? (
              <span>Capturado: {new Date(report.crawledAt).toLocaleString("es")}</span>
            ) : null}
            {report.snapshotId ? (
              <span>Snapshot #{report.snapshotId}</span>
            ) : null}
          </div>
        </section>

        {/* Posicionamiento */}
        <section className="border-b border-slate-700/50 px-6 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Posicionamiento
          </h4>
          <blockquote className="border-l-2 border-cyan-500/50 pl-4 text-sm italic text-slate-300">
            {positioning.valueProposition}
          </blockquote>
          <div className="mt-3 grid gap-2 text-sm">
            <p>
              <span className="text-slate-500">Título:</span>{" "}
              <span className="text-slate-200">{positioning.title}</span>
            </p>
            {positioning.h1 ? (
              <p>
                <span className="text-slate-500">H1:</span>{" "}
                <span className="text-slate-200">{positioning.h1}</span>
              </p>
            ) : null}
          </div>
        </section>

        {/* SEO técnico */}
        <section className="border-b border-slate-700/50 px-6 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            SEO técnico
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge
              label={`Título ${seo.titleLength} chars`}
              status={seo.titleAssessment}
            />
            <Badge
              label={
                seo.metaDescription
                  ? `Meta ${seo.metaDescriptionLength} chars`
                  : "Sin meta"
              }
              status={seo.metaAssessment}
            />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-400">
            <p>
              {seo.wordCount} palabras · {seo.contentLength} caracteres texto
            </p>
            {seo.metaDescription ? (
              <p className="text-slate-300">{seo.metaDescription}</p>
            ) : null}
          </div>
        </section>

        {/* Estructura */}
        <section className="border-b border-slate-700/50 px-6 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Estructura
          </h4>
          <p className="text-sm text-slate-400">
            HTML: {(structure.htmlSize / 1024).toFixed(1)} KB · {structure.headings.h2.length} H2 · {structure.headings.h3.length} H3
          </p>
          {structure.headings.h2.length > 0 || structure.headings.h3.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {structure.headings.h2.map((h, i) => (
                <li key={i} className="pl-2">
                  · {h}
                </li>
              ))}
              {structure.headings.h3.slice(0, 5).map((h, i) => (
                <li key={i} className="pl-4 text-slate-500">
                  – {h}
                </li>
              ))}
              {structure.headings.h3.length > 5 ? (
                <li className="pl-4 text-slate-600">
                  +{structure.headings.h3.length - 5} más
                </li>
              ) : null}
            </ul>
          ) : null}
        </section>

        {/* Contenido */}
        <section className="px-6 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Contenido y palabras clave
          </h4>
          <p className="text-sm leading-relaxed text-slate-400">
            {content.preview}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.keyPhrases.map((phrase, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300"
              >
                {phrase}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [createName, setCreateName] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [createUrls, setCreateUrls] = useState<string[]>([]);
  const [createUrlInput, setCreateUrlInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editUrls, setEditUrls] = useState<string[]>([]);
  const editUrlsRef = useRef<string[]>([]);
  const [editUrlInput, setEditUrlInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  editUrlsRef.current = editUrls;
  const [baselineForId, setBaselineForId] = useState<string | null>(null);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [isLoadingBaseline, setIsLoadingBaseline] = useState(false);

  const loadCompetitors = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCompetitors();
      setCompetitors(data);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to load competitors.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCompetitors();
  }, []);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    try {
      const c = await createCompetitor({
        name: createName,
        domain: createDomain,
        urls: createUrls,
      });
      setCompetitors((prev) => [c, ...prev]);
      setCreateName("");
      setCreateDomain("");
      setCreateUrls([]);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to create competitor.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (c: Competitor) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDomain(c.domain);
    setEditUrls(c.urls ?? []);
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setIsUpdating(true);
    setError("");
    try {
      const c = await updateCompetitor(editingId, {
        name: editName,
        domain: editDomain,
        urls: editUrlsRef.current,
      });
      setCompetitors((prev) =>
        prev.map((x) => (x.id === editingId ? c : x)),
      );
      setEditingId(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to update competitor.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Borrar "${name}"? Se borraran sus snapshots y reportes.`)) return;
    setError("");
    try {
      await deleteCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      if (baselineForId === id) setBaselineForId(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to delete competitor.",
      );
    }
  };

  const handleVerInfo = async (id: string) => {
    if (baselineForId === id && report) return;
    setBaselineForId(id);
    setIsLoadingBaseline(true);
    setReport(null);
    try {
      const r = await getCompetitorBaseline(id);
      setReport(r);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : "Unable to load baseline.",
      );
    } finally {
      setIsLoadingBaseline(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div>
        <h2 className="text-xl font-semibold text-white">Competitors</h2>
        <p className="mt-2 text-sm text-slate-400">
          Gestiona competitors: crear, editar, borrar. Ver info genera un
          informe de competencia profesional.
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleCreate}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Nombre"
          />
          <input
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            value={createDomain}
            onChange={(e) => setCreateDomain(e.target.value)}
            placeholder="Domain (ej. python.org)"
          />
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            disabled={isCreating}
          >
            {isCreating ? "Creando..." : "Crear"}
          </button>
        </div>
        <div>
          <label className="mb-2 block text-xs text-slate-400">
            URLs extra (paths o URLs completas)
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              value={createUrlInput}
              onChange={(e) => setCreateUrlInput(e.target.value)}
              placeholder="/pricing, /features o https://..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (createUrlInput.trim()) {
                    setCreateUrls((prev) => [...prev, createUrlInput.trim()]);
                    setCreateUrlInput("");
                  }
                }
              }}
            />
            <button
              type="button"
              className="rounded-2xl border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
              onClick={() => {
                if (createUrlInput.trim()) {
                  setCreateUrls((prev) => [...prev, createUrlInput.trim()]);
                  setCreateUrlInput("");
                }
              }}
            >
              Añadir
            </button>
          </div>
          {createUrls.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {createUrls.map((u, i) => (
                <li
                  key={i}
                  className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs"
                >
                  {u}
                  <button
                    type="button"
                    className="text-rose-400 hover:text-rose-300"
                    onClick={() =>
                      setCreateUrls((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Cargando...
        </div>
      ) : competitors.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          No hay competitors. Crea uno arriba.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {competitors.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-4"
            >
              {editingId === c.id ? (
                <form
                  className="flex w-full flex-col gap-3"
                  onSubmit={handleUpdate}
                >
                  <div className="flex flex-wrap gap-3">
                    <input
                      className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <input
                      className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
                      disabled={isUpdating}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-600 px-4 py-2 text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">URLs extra:</span>
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                        value={editUrlInput}
                        onChange={(e) => setEditUrlInput(e.target.value)}
                        placeholder="/pricing"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (editUrlInput.trim()) {
                              setEditUrls((prev) => [...prev, editUrlInput.trim()]);
                              setEditUrlInput("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-xl border border-slate-600 px-3 py-2 text-sm"
                        onClick={() => {
                          if (editUrlInput.trim()) {
                            setEditUrls((prev) => [...prev, editUrlInput.trim()]);
                            setEditUrlInput("");
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                    {editUrls.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {editUrls.map((u, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-1 rounded bg-slate-700/50 px-2 py-0.5 text-xs"
                          >
                            {u}
                            <button
                              type="button"
                              className="text-rose-400 hover:text-rose-300"
                              onClick={() =>
                                setEditUrls((prev) => prev.filter((_, j) => j !== i))
                              }
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{c.name}</span>
                      <span className="text-slate-400">({c.domain})</span>
                    </div>
                    <ul className="text-xs text-slate-500">
                      <li className="font-medium text-slate-400">URLs en BD:</li>
                      <li className="break-all">https://{c.domain} (raíz)</li>
                      {(c.urls ?? []).map((u) => (
                        <li key={u} className="break-all pl-2">
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                      onClick={() => handleVerInfo(c.id)}
                    >
                      Ver info
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
                      onClick={() => startEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-rose-500/50 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                      onClick={() => handleDelete(c.id, c.name)}
                    >
                      Borrar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {baselineForId ? (
        <CompetitorReportPanel
          report={report}
          isLoading={isLoadingBaseline}
          onClose={() => {
            setBaselineForId(null);
            setReport(null);
          }}
        />
      ) : null}
    </section>
  );
}
