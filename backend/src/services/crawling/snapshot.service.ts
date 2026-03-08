import { createHash } from "node:crypto";

import { connectToDatabase } from "../../config/database.js";
import { CrawlSnapshotModel } from "../../models/crawl-snapshot.model.js";
import type { CrawlPreviewResult } from "./page-loader.service.js";

const sha256 = (value: string): string => {
  return createHash("sha256").update(value).digest("hex");
};

export type SavedCrawlSnapshot = {
  id: string;
  competitorId: string;
  crawledAt: string;
  htmlHash: string;
  visibleTextHash: string;
};

export type CrawlSnapshotHistoryItem = {
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

export async function saveCrawlSnapshot(
  result: CrawlPreviewResult,
  competitorId: string,
): Promise<SavedCrawlSnapshot> {
  await connectToDatabase();

  const htmlHash = sha256(result.html);
  const visibleTextHash = sha256(result.visibleText);

  const snapshot = await CrawlSnapshotModel.create({
    competitorId,
    requestedUrl: result.requestedUrl,
    finalUrl: result.finalUrl,
    title: result.title,
    h1: result.h1,
    html: result.html,
    visibleText: result.visibleText,
    htmlLength: result.html.length,
    visibleTextLength: result.visibleText.length,
    htmlHash,
    visibleTextHash,
    crawledAt: new Date(),
  });

  return {
    id: snapshot.id,
    competitorId,
    crawledAt: snapshot.crawledAt.toISOString(),
    htmlHash,
    visibleTextHash,
  };
}

export async function listCrawlSnapshots(): Promise<CrawlSnapshotHistoryItem[]> {
  await connectToDatabase();

  const snapshots = await CrawlSnapshotModel.find()
    .sort({ crawledAt: -1 })
    .limit(50)
    .populate("competitorId", "name domain")
    .lean();

  return snapshots.map((snapshot) => ({
    id: String(snapshot._id),
    competitor:
      snapshot.competitorId &&
      typeof snapshot.competitorId === "object" &&
      "name" in snapshot.competitorId &&
      "domain" in snapshot.competitorId
        ? {
            id: String(snapshot.competitorId._id),
            name: String(snapshot.competitorId.name),
            domain: String(snapshot.competitorId.domain),
          }
        : null,
    requestedUrl: snapshot.requestedUrl,
    finalUrl: snapshot.finalUrl,
    title: snapshot.title,
    h1: snapshot.h1 ?? null,
    htmlLength: snapshot.htmlLength,
    visibleTextLength: snapshot.visibleTextLength,
    htmlHash: snapshot.htmlHash,
    visibleTextHash: snapshot.visibleTextHash,
    crawledAt: snapshot.crawledAt.toISOString(),
  }));
}
