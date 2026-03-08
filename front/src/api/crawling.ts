import { callApi } from "./index";

export type CrawlPreviewData = {
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

type CrawlPreviewResponse = {
  data: CrawlPreviewData;
};

type CrawlHistoryResponse = {
  data: CrawlHistoryItem[];
};

export async function previewCrawl(url: string): Promise<CrawlPreviewData> {
  const response = await callApi<CrawlPreviewResponse>("/api/crawling/preview", {
    method: "POST",
    body: { url },
  });

  return response.data;
}

export async function getCrawlHistory(): Promise<CrawlHistoryItem[]> {
  const response = await callApi<CrawlHistoryResponse>("/api/crawling/history", {
    method: "GET",
  });

  return response.data;
}
