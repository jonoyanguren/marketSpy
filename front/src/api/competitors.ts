import { callApi } from "./index";

export type Competitor = {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  createdAt: string;
};

type CompetitorsResponse = {
  data: Competitor[];
};

type CreateCompetitorResponse = {
  data: Competitor;
};

export async function getCompetitors(): Promise<Competitor[]> {
  const response = await callApi<CompetitorsResponse>("/api/competitors", {
    method: "GET",
  });

  return response.data;
}

export async function createCompetitor(input: {
  name: string;
  domain: string;
}): Promise<Competitor> {
  const response = await callApi<CreateCompetitorResponse>("/api/competitors", {
    method: "POST",
    body: input,
  });

  return response.data;
}
