import { useState } from "react";

import { ApiError } from "../api";
import { getHealth, type HealthResponse } from "../api/health";

export function HealthSection() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckHealth = async () => {
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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Health</h2>
          <p className="mt-2 text-sm text-slate-400">
            Comprueba la conexion real con `GET /api/health`.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={handleCheckHealth}
        >
          {isLoading ? "Comprobando..." : "Probar health"}
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
          Todavia no se ha hecho ninguna llamada al endpoint de health.
        </div>
      )}
    </section>
  );
}
