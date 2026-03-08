import { NavLink, Outlet } from "react-router-dom";

const navLinkClassName = ({ isActive }: { isActive: boolean }): string => {
  return [
    "rounded-2xl px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-cyan-400 text-slate-950"
      : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white",
  ].join(" ");
};

export function AppShell() {
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
            Navegacion base con home e historial de crawls guardados.
          </p>
          <nav className="flex gap-3">
            <NavLink className={navLinkClassName} to="/">
              Home
            </NavLink>
            <NavLink className={navLinkClassName} to="/history">
              History
            </NavLink>
          </nav>
        </header>

        <Outlet />
      </div>
    </main>
  );
}
