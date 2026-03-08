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

type CrawlPreviewResponse = {
  data: CrawlPreviewData;
};

export async function previewCrawl(url: string): Promise<CrawlPreviewData> {
  const response = await callApi<CrawlPreviewResponse>("/api/crawling/preview", {
    method: "POST",
    body: { url },
  });

  return response.data;
}
