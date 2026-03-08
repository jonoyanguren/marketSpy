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

export async function updateCompetitor(
  id: string,
  input: { name?: string; domain?: string },
): Promise<Competitor> {
  const response = await callApi<CreateCompetitorResponse>(
    `/api/competitors/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data;
}

export async function deleteCompetitor(id: string): Promise<void> {
  await callApi<unknown>(`/api/competitors/${id}`, {
    method: "DELETE",
  });
}

export type CompetitorReport = {
  competitor: { name: string; domain: string };
  executive: { headline: string; summary: string };
  empty?: boolean;
  positioning?: {
    valueProposition: string;
    title: string;
    h1: string | null;
  } | null;
  seo?: {
    title: string;
    titleLength: number;
    titleAssessment: "corto" | "ok" | "largo";
    metaDescription: string | null;
    metaDescriptionLength: number;
    metaAssessment: "ausente" | "corto" | "ok" | "largo";
    h1: string | null;
    wordCount: number;
    contentLength: number;
  } | null;
  structure?: {
    htmlSize: number;
    headings: { h2: string[]; h3: string[] };
  } | null;
  content?: {
    preview: string;
    keyPhrases: string[];
  } | null;
  crawledAt?: string | null;
  url?: string | null;
  snapshotId?: string | null;
};

export type BaselineSummary = CompetitorReport;

export async function getCompetitorBaseline(
  id: string,
): Promise<CompetitorReport> {
  const response = await callApi<{ data: BaselineSummary }>(
    `/api/competitors/${id}/baseline`,
    { method: "GET" },
  );

  return response.data;
}
