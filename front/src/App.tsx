import { CrawlSection } from "./components/CrawlSection";
import { HealthSection } from "./components/HealthSection";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-400">
            marketSpy
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Primer crawling real
          </h1>
          <p className="max-w-3xl text-base text-slate-300">
            Separado en dos bloques: health del backend y preview del crawling.
          </p>
        </header>

        <HealthSection />
        <CrawlSection />
      </div>
    </main>
  );
}
