import { connectToDatabase } from "../../config/database.js";
import { ChangeReportModel } from "../../models/change-report.model.js";
import { CrawlSnapshotModel } from "../../models/crawl-snapshot.model.js";

export type ChangeReportResult = {
  id: string;
  snapshotAId: string;
  snapshotBId: string;
  competitorId: string;
  requestedUrl: string;
  htmlChanged: boolean;
  visibleTextChanged: boolean;
  titleDiff: { from: string; to: string } | null;
  h1Diff: { from: string | null; to: string | null } | null;
  detectedAt: string;
};

export async function detectAndSaveChanges(
  newSnapshotId: string,
  competitorId: string,
  requestedUrl: string,
): Promise<ChangeReportResult | null> {
  await connectToDatabase();

  const newSnapshot = await CrawlSnapshotModel.findById(newSnapshotId).lean();
  if (!newSnapshot) return null;

  const previousSnapshot = await CrawlSnapshotModel.findOne({
    competitorId,
    requestedUrl,
    _id: { $ne: newSnapshotId },
    crawledAt: { $lt: newSnapshot.crawledAt },
  })
    .sort({ crawledAt: -1 })
    .limit(1)
    .lean();

  if (!previousSnapshot) return null;

  const htmlChanged = previousSnapshot.htmlHash !== newSnapshot.htmlHash;
  const visibleTextChanged =
    previousSnapshot.visibleTextHash !== newSnapshot.visibleTextHash;
  const titleChanged =
    (previousSnapshot.title ?? "") !== (newSnapshot.title ?? "");
  const h1Changed =
    String(previousSnapshot.h1 ?? "") !== String(newSnapshot.h1 ?? "");

  if (!htmlChanged && !visibleTextChanged && !titleChanged && !h1Changed) {
    return null;
  }

  const report = await ChangeReportModel.create({
    snapshotAId: previousSnapshot._id,
    snapshotBId: newSnapshot._id,
    competitorId,
    requestedUrl,
    htmlChanged,
    visibleTextChanged,
    titleDiff: titleChanged
      ? { from: previousSnapshot.title ?? "", to: newSnapshot.title ?? "" }
      : undefined,
    h1Diff: h1Changed
      ? {
          from: previousSnapshot.h1 ?? null,
          to: newSnapshot.h1 ?? null,
        }
      : undefined,
    detectedAt: new Date(),
  });

  return {
    id: String(report._id),
    snapshotAId: String(report.snapshotAId),
    snapshotBId: String(report.snapshotBId),
    competitorId: String(report.competitorId),
    requestedUrl: report.requestedUrl,
    htmlChanged: report.htmlChanged,
    visibleTextChanged: report.visibleTextChanged,
    titleDiff: report.titleDiff
      ? {
          from: report.titleDiff.from ?? "",
          to: report.titleDiff.to ?? "",
        }
      : null,
    h1Diff: report.h1Diff
      ? {
          from: report.h1Diff.from ?? null,
          to: report.h1Diff.to ?? null,
        }
      : null,
    detectedAt: report.detectedAt.toISOString(),
  };
}

export type ChangeReportListItem = {
  id: string;
  snapshotAId: string;
  snapshotBId: string;
  competitor: { id: string; name: string; domain: string } | null;
  requestedUrl: string;
  htmlChanged: boolean;
  visibleTextChanged: boolean;
  titleDiff: { from: string; to: string } | null;
  h1Diff: { from: string | null; to: string | null } | null;
  detectedAt: string;
};

export async function listChangeReports(): Promise<ChangeReportListItem[]> {
  await connectToDatabase();

  const reports = await ChangeReportModel.find()
    .sort({ detectedAt: -1 })
    .limit(50)
    .populate("competitorId", "name domain")
    .lean();

  return reports.map((r) => ({
    id: String(r._id),
    snapshotAId: String(r.snapshotAId),
    snapshotBId: String(r.snapshotBId),
    competitor:
      r.competitorId &&
      typeof r.competitorId === "object" &&
      "name" in r.competitorId &&
      "domain" in r.competitorId
        ? {
            id: String(r.competitorId._id),
            name: String(r.competitorId.name),
            domain: String(r.competitorId.domain),
          }
        : null,
    requestedUrl: r.requestedUrl,
    htmlChanged: r.htmlChanged,
    visibleTextChanged: r.visibleTextChanged,
    titleDiff: r.titleDiff
      ? { from: r.titleDiff.from ?? "", to: r.titleDiff.to ?? "" }
      : null,
    h1Diff: r.h1Diff
      ? { from: r.h1Diff.from ?? null, to: r.h1Diff.to ?? null }
      : null,
    detectedAt: r.detectedAt.toISOString(),
  }));
}
