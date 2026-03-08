import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { ChangesPage } from "./pages/ChangesPage";
import { CompetitorsPage } from "./pages/CompetitorsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />} path="/">
        <Route element={<HomePage />} index />
        <Route element={<CompetitorsPage />} path="competitors" />
        <Route element={<HistoryPage />} path="history" />
        <Route element={<ChangesPage />} path="changes" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
