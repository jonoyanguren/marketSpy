import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import type { ChangeReportResult } from "../services/crawling/change-detection.service.js";

import { connectToDatabase } from "../config/database.js";
import {
  loadPagePreview,
  type CrawlPreviewResult,
} from "../services/crawling/page-loader.service.js";
import { CompetitorModel } from "../models/competitor.model.js";
import {
  detectAndSaveChanges,
  listChangeReports,
} from "../services/crawling/change-detection.service.js";
import {
  listCrawlSnapshots,
  saveCrawlSnapshot,
} from "../services/crawling/snapshot.service.js";
import { sendError } from "../utils/error-handler.js";

type CrawlPreviewRequestBody = {
  url?: string;
  competitorId?: string;
};

export type CrawlSummary = {
  type: "baseline" | "changes" | "unchanged";
  headline: string;
  details: string[];
};

function buildCrawlSummary(params: {
  competitorName: string;
  requestedUrl: string;
  title: string;
  h1: string | null;
  snapshotId: string;
  changeReport: ChangeReportResult | null;
  hadPreviousSnapshot: boolean;
}): CrawlSummary {
  const { competitorName, requestedUrl, title, h1, snapshotId, changeReport, hadPreviousSnapshot } = params;

  if (!hadPreviousSnapshot) {
    return {
      type: "baseline",
      headline: "Captura inicial guardada",
      details: [
        `Competitor: ${competitorName}`,
        `URL: ${requestedUrl}`,
        title ? `Título: ${title}` : null,
        h1 ? `H1: ${h1}` : null,
        `Snapshot #${snapshotId.slice(-8)} guardado. En el próximo crawl se compararán los cambios.`,
      ].filter(Boolean) as string[],
    };
  }

  if (changeReport) {
    const details: string[] = [];
    if (changeReport.titleDiff) {
      details.push(`Título: "${changeReport.titleDiff.from}" → "${changeReport.titleDiff.to}"`);
    }
    if (changeReport.h1Diff) {
      details.push(
        `H1: "${changeReport.h1Diff.from ?? "—"}" → "${changeReport.h1Diff.to ?? "—"}"`,
      );
    }
    if (changeReport.htmlChanged) details.push("HTML modificado");
    if (changeReport.visibleTextChanged) details.push("Texto visible modificado");

    return {
      type: "changes",
      headline: "Cambios detectados",
      details,
    };
  }

  return {
    type: "unchanged",
    headline: "Sin cambios",
    details: ["La página es idéntica al último snapshot."],
  };
}

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
  const competitorId = request.body?.competitorId?.trim();

  if (!url) {
    response.status(400).json({
      message: "The `url` field is required.",
    });
    return;
  }

  if (!competitorId) {
    response.status(400).json({
      message: "The `competitorId` field is required.",
    });
    return;
  }

  if (!isValidObjectId(competitorId)) {
    response.status(400).json({
      message: "The `competitorId` field must be a valid id.",
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
    await connectToDatabase();

    const competitor = await CompetitorModel.findById(competitorId).lean();

    if (!competitor) {
      response.status(404).json({
        message: "Competitor not found.",
      });
      return;
    }

    const result: CrawlPreviewResult = await loadPagePreview(url);
    const savedSnapshot = await saveCrawlSnapshot(result, competitorId);
    const { changeReport, hadPreviousSnapshot } = await detectAndSaveChanges(
      savedSnapshot.id,
      competitorId,
      result.requestedUrl,
    );

    const summary = buildCrawlSummary({
      competitorName: competitor.name,
      requestedUrl: result.requestedUrl,
      title: result.title,
      h1: result.h1,
      snapshotId: savedSnapshot.id,
      changeReport,
      hadPreviousSnapshot,
    });

    response.json({
      data: {
        competitor: {
          id: competitorId,
          name: competitor.name,
          domain: competitor.domain,
        },
        requestedUrl: result.requestedUrl,
        finalUrl: result.finalUrl,
        title: result.title,
        h1: result.h1,
        htmlPreview: result.html.slice(0, 5_000),
        htmlLength: result.html.length,
        visibleTextPreview: result.visibleText.slice(0, 2_000),
        visibleTextLength: result.visibleText.length,
        snapshotId: savedSnapshot.id,
        competitorId: savedSnapshot.competitorId,
        crawledAt: savedSnapshot.crawledAt,
        htmlHash: savedSnapshot.htmlHash,
        visibleTextHash: savedSnapshot.visibleTextHash,
      },
      summary,
      changeReport: changeReport ?? undefined,
    });
  } catch (error) {
    sendError(response, error, "Failed to crawl the URL.", "previewCrawl");
  }
};

export const getCrawlingHistory = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const items = await listCrawlSnapshots();

    response.json({
      data: items,
    });
  } catch (error) {
    sendError(response, error, "Failed to load crawl history.", "getCrawlingHistory");
  }
};

export const getChangeReports = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    const items = await listChangeReports();

    response.json({
      data: items,
    });
  } catch (error) {
    sendError(response, error, "Failed to load change reports.", "getChangeReports");
  }
};
