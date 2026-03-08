import { connectToDatabase } from "../../config/database.js";
import { ChangeReportModel } from "../../models/change-report.model.js";
import { CompetitorModel } from "../../models/competitor.model.js";
import { CrawlSnapshotModel } from "../../models/crawl-snapshot.model.js";
import {
  analyzeChangeWithAi,
  type AiChangeAnalysis,
  type AiStatus,
} from "../ai/change-analysis.service.js";
import { computeVisibleTextDiff } from "../../utils/text-diff.js";

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
  visibleTextDiff: { added: string[]; removed: string[] } | null;
  aiStatus: AiStatus;
  aiModel: string | null;
  aiPromptVersion: string | null;
  aiAnalysis: AiChangeAnalysis | null;
  aiError: string | null;
  detectedAt: string;
};

export type DetectChangesResult = {
  changeReport: ChangeReportResult | null;
  hadPreviousSnapshot: boolean;
};

export async function detectAndSaveChanges(
  newSnapshotId: string,
  competitorId: string,
  requestedUrl: string,
): Promise<DetectChangesResult> {
  await connectToDatabase();

  const newSnapshot = await CrawlSnapshotModel.findById(newSnapshotId).lean();
  if (!newSnapshot) {
    return { changeReport: null, hadPreviousSnapshot: false };
  }

  const previousSnapshot = await CrawlSnapshotModel.findOne({
    competitorId,
    requestedUrl,
    _id: { $ne: newSnapshotId },
    crawledAt: { $lt: newSnapshot.crawledAt },
  })
    .sort({ crawledAt: -1 })
    .limit(1)
    .lean();

  if (!previousSnapshot) {
    return { changeReport: null, hadPreviousSnapshot: false };
  }

  const htmlChanged = previousSnapshot.htmlHash !== newSnapshot.htmlHash;
  const visibleTextChanged =
    previousSnapshot.visibleTextHash !== newSnapshot.visibleTextHash;

  const prevTitle = (previousSnapshot.title ?? "").trim();
  const newTitle = (newSnapshot.title ?? "").trim();
  const prevH1 = String(previousSnapshot.h1 ?? "").trim();
  const newH1 = String(newSnapshot.h1 ?? "").trim();

  const titleChanged = prevTitle !== newTitle;
  const h1Changed = prevH1 !== newH1;

  if (!htmlChanged && !visibleTextChanged && !titleChanged && !h1Changed) {
    return { changeReport: null, hadPreviousSnapshot: true };
  }

  const visibleTextDiff = visibleTextChanged
    ? computeVisibleTextDiff(
        previousSnapshot.visibleText ?? "",
        newSnapshot.visibleText ?? "",
      )
    : undefined;

  const report = await ChangeReportModel.create({
    snapshotAId: previousSnapshot._id,
    snapshotBId: newSnapshot._id,
    competitorId,
    requestedUrl,
    htmlChanged,
    visibleTextChanged,
    titleDiff: titleChanged ? { from: prevTitle, to: newTitle } : undefined,
    h1Diff: h1Changed
      ? { from: prevH1 || null, to: newH1 || null }
      : undefined,
    visibleTextDiff:
      visibleTextDiff &&
      (visibleTextDiff.added.length > 0 || visibleTextDiff.removed.length > 0)
        ? visibleTextDiff
        : undefined,
    aiStatus: "pending",
    aiPromptVersion: "change-v1",
    detectedAt: new Date(),
  });

  const competitor = await CompetitorModel.findById(competitorId)
    .select("name domain")
    .lean();

  setImmediate(() => {
    void enrichChangeReportWithAi({
      reportId: String(report._id),
      competitorName: competitor?.name ?? "Competitor",
      competitorDomain: competitor?.domain ?? "",
      requestedUrl,
      oldSnapshot: {
        title: previousSnapshot.title ?? "",
        h1: previousSnapshot.h1 ?? null,
        visibleText: previousSnapshot.visibleText ?? "",
        htmlLength: previousSnapshot.htmlLength ?? 0,
        visibleTextLength: previousSnapshot.visibleTextLength ?? 0,
      },
      newSnapshot: {
        title: newSnapshot.title ?? "",
        h1: newSnapshot.h1 ?? null,
        visibleText: newSnapshot.visibleText ?? "",
        htmlLength: newSnapshot.htmlLength ?? 0,
        visibleTextLength: newSnapshot.visibleTextLength ?? 0,
      },
      changeSignals: {
        htmlChanged,
        visibleTextChanged,
        titleDiff: titleChanged ? { from: prevTitle, to: newTitle } : null,
        h1Diff: h1Changed ? { from: prevH1 || null, to: newH1 || null } : null,
        visibleTextDiff:
          visibleTextDiff &&
          (visibleTextDiff.added.length > 0 || visibleTextDiff.removed.length > 0)
            ? visibleTextDiff
            : null,
      },
    });
  });

  const result: ChangeReportResult = {
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
    visibleTextDiff:
      report.visibleTextDiff &&
      (report.visibleTextDiff.added?.length > 0 ||
        report.visibleTextDiff.removed?.length > 0)
        ? {
            added: report.visibleTextDiff.added ?? [],
            removed: report.visibleTextDiff.removed ?? [],
          }
        : null,
    aiStatus: (report.aiStatus as AiStatus) ?? "pending",
    aiModel: report.aiModel ?? null,
    aiPromptVersion: report.aiPromptVersion ?? null,
    aiAnalysis: (report.aiAnalysis as AiChangeAnalysis | null) ?? null,
    aiError: report.aiError ?? null,
    detectedAt: report.detectedAt.toISOString(),
  };

  return { changeReport: result, hadPreviousSnapshot: true };
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
  visibleTextDiff: { added: string[]; removed: string[] } | null;
  aiStatus: AiStatus;
  aiModel: string | null;
  aiPromptVersion: string | null;
  aiAnalysis: AiChangeAnalysis | null;
  aiError: string | null;
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
    visibleTextDiff:
      r.visibleTextDiff &&
      (r.visibleTextDiff.added?.length > 0 ||
        r.visibleTextDiff.removed?.length > 0)
        ? {
            added: r.visibleTextDiff.added ?? [],
            removed: r.visibleTextDiff.removed ?? [],
          }
        : null,
    aiStatus: (r.aiStatus as AiStatus) ?? "pending",
    aiModel: r.aiModel ?? null,
    aiPromptVersion: r.aiPromptVersion ?? null,
    aiAnalysis: (r.aiAnalysis as AiChangeAnalysis | null) ?? null,
    aiError: r.aiError ?? null,
    detectedAt: r.detectedAt.toISOString(),
  }));
}

async function enrichChangeReportWithAi(input: {
  reportId: string;
  competitorName: string;
  competitorDomain: string;
  requestedUrl: string;
  oldSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  newSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  changeSignals: {
    htmlChanged: boolean;
    visibleTextChanged: boolean;
    titleDiff: { from: string; to: string } | null;
    h1Diff: { from: string | null; to: string | null } | null;
    visibleTextDiff: { added: string[]; removed: string[] } | null;
  };
}): Promise<void> {
  try {
    const { analysis, model } = await analyzeChangeWithAi({
      competitorName: input.competitorName,
      competitorDomain: input.competitorDomain,
      requestedUrl: input.requestedUrl,
      oldSnapshot: input.oldSnapshot,
      newSnapshot: input.newSnapshot,
      changeSignals: input.changeSignals,
    });

    if (!analysis) {
      await ChangeReportModel.findByIdAndUpdate(input.reportId, {
        $set: {
          aiStatus: "failed",
          aiError: "AI response invalid or unavailable.",
          aiModel: model,
        },
      });
      return;
    }

    await ChangeReportModel.findByIdAndUpdate(input.reportId, {
      $set: {
        aiStatus: "completed",
        aiAnalysis: analysis,
        aiError: null,
        aiModel: model,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    await ChangeReportModel.findByIdAndUpdate(input.reportId, {
      $set: {
        aiStatus: "failed",
        aiError: message,
      },
    });
  }
}
