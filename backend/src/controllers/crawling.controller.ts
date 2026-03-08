import type { Request, Response } from "express";

import {
  loadPagePreview,
  type CrawlPreviewResult,
} from "../services/crawling/page-loader.service.js";
import { saveCrawlSnapshot } from "../services/crawling/snapshot.service.js";

type CrawlPreviewRequestBody = {
  url?: string;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const previewCrawl = async (
  request: Request<unknown, unknown, CrawlPreviewRequestBody>,
  response: Response,
): Promise<void> => {
  const url = request.body?.url?.trim();

  if (!url) {
    response.status(400).json({
      message: "The `url` field is required.",
    });
    return;
  }

  if (!isValidHttpUrl(url)) {
    response.status(400).json({
      message: "The `url` field must be a valid http or https URL.",
    });
    return;
  }

  try {
    const result: CrawlPreviewResult = await loadPagePreview(url);
    const savedSnapshot = await saveCrawlSnapshot(result);

    response.json({
      data: {
        requestedUrl: result.requestedUrl,
        finalUrl: result.finalUrl,
        title: result.title,
        h1: result.h1,
        htmlPreview: result.html.slice(0, 5_000),
        htmlLength: result.html.length,
        visibleTextPreview: result.visibleText.slice(0, 2_000),
        visibleTextLength: result.visibleText.length,
        snapshotId: savedSnapshot.id,
        crawledAt: savedSnapshot.crawledAt,
        htmlHash: savedSnapshot.htmlHash,
        visibleTextHash: savedSnapshot.visibleTextHash,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to crawl the URL.";

    response.status(500).json({
      message,
    });
  }
};
