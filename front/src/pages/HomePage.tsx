import { useEffect, useState } from "react";

import { ApiError } from "../api";
import type { Competitor } from "../api/competitors";
import { getCompetitors } from "../api/competitors";
import { CompetitorsSection } from "../components/CompetitorsSection";
import { HealthSection } from "../components/HealthSection";

export function HomePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompetitors = async () => {
      try {
        const data = await getCompetitors();
        setCompetitors(data);

        if (data.length > 0) {
          setSelectedCompetitorId((current) => current || data[0].id);
        }
      } catch (requestError) {
        setError(
          requestError instanceof ApiError || requestError instanceof Error
            ? requestError.message
            : "Unable to load competitors.",
        );
      }
    };

    void loadCompetitors();
  }, []);

  return (
    <>
      <HealthSection />
      <CompetitorsSection
        competitors={competitors}
        onCompetitorSelected={setSelectedCompetitorId}
        selectedCompetitorId={selectedCompetitorId}
      />
      {error ? (
        <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </section>
      ) : null}
    </>
  );
}
