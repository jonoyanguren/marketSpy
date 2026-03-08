import { useState } from "react";

import { ApiError, getHealth, type HealthResponse } from "./api";

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePingBackend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getHealth();
      setHealth(data);
    } catch (requestError) {
      setHealth(null);
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            marketSpy
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Primera conexion con la API
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Esta pantalla solo hace una cosa: probar la conexion real con el
            backend a traves del endpoint `GET /api/health`.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Estado del backend
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Se usa la ruta relativa `/api/health`, pasando por el proxy de
                Vite al backend local.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={handlePingBackend}
            >
              {isLoading ? "Conectando..." : "Probar conexion"}
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {health ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
              <p>
                <strong>Status:</strong> {health.status}
              </p>
              <p>
                <strong>Service:</strong> {health.service}
              </p>
              <p>
                <strong>Timestamp:</strong> {health.timestamp}
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
              Todavia no se ha hecho ninguna llamada real a la API.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
