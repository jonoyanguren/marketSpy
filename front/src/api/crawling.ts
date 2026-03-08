import { callApi } from "./index";

export type CrawlPreviewData = {
  competitor: {
    id: string;
    name: string;
    domain: string;
  };
  competitorId: string;
  requestedUrl: string;
  finalUrl: string;
  title: string;
  h1: string | null;
  htmlPreview: string;
  htmlLength: number;
  visibleTextPreview: string;
  visibleTextLength: number;
  snapshotId: string;
  crawledAt: string;
  htmlHash: string;
  visibleTextHash: string;
};

export type CrawlHistoryItem = {
  id: string;
  competitor: {
    id: string;
    name: string;
    domain: string;
  } | null;
  requestedUrl: string;
  finalUrl: string;
  title: string;
  h1: string | null;
  htmlLength: number;
  visibleTextLength: number;
  htmlHash: string;
  visibleTextHash: string;
  crawledAt: string;
};

export type ChangeReportData = {
  id: string;
  snapshotAId: string;
  snapshotBId: string;
  competitorId: string;
  requestedUrl: string;
  htmlChanged: boolean;
  visibleTextChanged: boolean;
  titleDiff: { from: string; to: string } | null;
  h1Diff: { from: string | null; to: string | null } | null;
  visibleTextDiff?: { added: string[]; removed: string[] } | null;
  aiStatus?: "pending" | "completed" | "failed";
  aiModel?: string | null;
  aiPromptVersion?: string | null;
  aiAnalysis?: {
    version: "1.0";
    language: "es";
    summary: string;
    impactScore: number;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
    keyChanges: Array<{
      category: string;
      description: string;
      evidence: string;
      impact: string;
    }>;
    businessImpact: {
      seo: string;
      messaging: string;
      ux: string;
      conversion: string;
    };
    recommendations: Array<{
      priority: "high" | "medium" | "low";
      action: string;
      reason: string;
    }>;
    riskFlags: string[];
    watchItems: string[];
  } | null;
  aiError?: string | null;
  detectedAt: string;
};

export type ChangeReportItem = ChangeReportData & {
  competitor: { id: string; name: string; domain: string } | null;
};

export type CrawlSummary = {
  type: "baseline" | "changes" | "unchanged";
  headline: string;
  details: string[];
};

type CrawlPreviewResponse = {
  data: CrawlPreviewData;
  summary: CrawlSummary;
  changeReport?: ChangeReportData;
};

type CrawlHistoryResponse = {
  data: CrawlHistoryItem[];
};

type CrawlChangesResponse = {
  data: ChangeReportItem[];
};

export async function previewCrawl(input: {
  url: string;
  competitorId: string;
}): Promise<{
  data: CrawlPreviewData;
  summary: CrawlSummary;
  changeReport?: ChangeReportData;
}> {
  const response = await callApi<CrawlPreviewResponse>("/api/crawling/preview", {
    method: "POST",
    body: input,
  });

  return {
    data: response.data,
    summary: response.summary,
    changeReport: response.changeReport,
  };
}

export async function getCrawlHistory(): Promise<CrawlHistoryItem[]> {
  const response = await callApi<CrawlHistoryResponse>("/api/crawling/history", {
    method: "GET",
  });

  return response.data;
}

export async function getChangeReports(): Promise<ChangeReportItem[]> {
  const response = await callApi<CrawlChangesResponse>(
    "/api/crawling/changes",
    { method: "GET" },
  );

  return response.data;
}
