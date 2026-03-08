import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "../config/database.js";
import { sendError } from "../utils/error-handler.js";
import { ChangeReportModel } from "../models/change-report.model.js";
import { CompetitorModel } from "../models/competitor.model.js";
import { CrawlSnapshotModel } from "../models/crawl-snapshot.model.js";

type CreateCompetitorBody = {
  name?: string;
  domain?: string;
  urls?: string[];
};

type UpdateCompetitorBody = {
  name?: string;
  domain?: string;
  urls?: string[];
};

const normalizeDomain = (value: string): string => {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  return parsed.hostname.toLowerCase();
};

/** Normalize URL entry (path or full URL) to absolute URL using domain */
function normalizeUrl(entry: string, domain: string): string {
  const trimmed = entry.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    return parsed.toString();
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://${domain}${path}`;
}

export const listCompetitors = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  try {
    await connectToDatabase();

    const competitors = await CompetitorModel.find()
      .sort({ createdAt: -1 })
      .lean();

    response.json({
      data: competitors.map((competitor) => ({
        id: String(competitor._id),
        name: competitor.name,
        domain: competitor.domain,
        active: competitor.active,
        urls: (competitor.urls ?? []).filter(Boolean),
        createdAt: competitor.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    sendError(response, error, "Failed to load competitors.", "listCompetitors");
  }
};

export const createCompetitor = async (
  request: Request<unknown, unknown, CreateCompetitorBody>,
  response: Response,
): Promise<void> => {
  const name = request.body?.name?.trim();
  const rawDomain = request.body?.domain?.trim();

  if (!name) {
    response.status(400).json({
      message: "The `name` field is required.",
    });
    return;
  }

  if (!rawDomain) {
    response.status(400).json({
      message: "The `domain` field is required.",
    });
    return;
  }

  let domain: string;

  try {
    domain = normalizeDomain(rawDomain);
  } catch {
    response.status(400).json({
      message: "The `domain` field must be a valid domain or URL.",
    });
    return;
  }

  try {
    await connectToDatabase();

    const existingCompetitor = await CompetitorModel.findOne({ domain }).lean();

    if (existingCompetitor) {
      response.status(409).json({
        message: "A competitor with this domain already exists.",
      });
      return;
    }

    const rawUrls = request.body?.urls;
    const urls = Array.isArray(rawUrls)
      ? [...new Set(
          rawUrls
            .map((u) => normalizeUrl(String(u), domain))
            .filter(Boolean),
        )]
      : [];

    const competitor = await CompetitorModel.create({
      name,
      domain,
      active: true,
      urls,
    });

    response.status(201).json({
      data: {
        id: competitor.id,
        name: competitor.name,
        domain: competitor.domain,
        active: competitor.active,
        urls: competitor.urls ?? [],
        createdAt: competitor.createdAt.toISOString(),
      },
    });
  } catch (error) {
    sendError(response, error, "Failed to create competitor.", "createCompetitor");
  }
};

export const updateCompetitor = async (
  request: Request<{ id: string }, unknown, UpdateCompetitorBody>,
  response: Response,
): Promise<void> => {
  const id = request.params?.id?.trim();
  const name = request.body?.name?.trim();
  const rawDomain = request.body?.domain?.trim();
  const rawUrls = request.body?.urls;

  if (!id || !isValidObjectId(id)) {
    response.status(400).json({
      message: "Invalid competitor ID.",
    });
    return;
  }

  if (!name && !rawDomain && rawUrls === undefined) {
    response.status(400).json({
      message: "Provide at least `name`, `domain` or `urls` to update.",
    });
    return;
  }

  let domain: string | undefined;

  if (rawDomain) {
    try {
      domain = normalizeDomain(rawDomain);
    } catch {
      response.status(400).json({
        message: "The `domain` field must be a valid domain or URL.",
      });
      return;
    }
  }

  try {
    await connectToDatabase();

    const competitor = await CompetitorModel.findById(id);

    if (!competitor) {
      response.status(404).json({
        message: "Competitor not found.",
      });
      return;
    }

    const update: Record<string, unknown> = {};

    if (name) update.name = name;
    if (domain !== undefined) {
      const existing = await CompetitorModel.findOne({
        domain,
        _id: { $ne: id },
      }).lean();
      if (existing) {
        response.status(409).json({
          message: "A competitor with this domain already exists.",
        });
        return;
      }
      update.domain = domain;
    }

    if (Array.isArray(rawUrls)) {
      const baseDomain = (update.domain as string | undefined) ?? competitor.domain;
      update.urls = [
        ...new Set(
          rawUrls
            .map((u) => normalizeUrl(String(u), baseDomain))
            .filter(Boolean),
        ),
      ];
    }

    const updated = Object.keys(update).length > 0
      ? await CompetitorModel.findByIdAndUpdate(id, { $set: update }, { new: true })
          .lean()
      : competitor?.toObject?.() ?? competitor;

    if (!updated) {
      response.status(404).json({ message: "Competitor not found." });
      return;
    }

    const doc = updated as { _id: unknown; name: string; domain: string; active: boolean; urls?: string[]; createdAt: Date };
    response.json({
      data: {
        id: String(doc._id),
        name: doc.name,
        domain: doc.domain,
        active: doc.active,
        urls: (doc.urls ?? []).filter(Boolean),
        createdAt: (doc.createdAt as Date).toISOString(),
      },
    });
  } catch (error) {
    sendError(response, error, "Failed to update competitor.", "updateCompetitor");
  }
};

export const deleteCompetitor = async (
  request: Request<{ id: string }>,
  response: Response,
): Promise<void> => {
  const id = request.params?.id?.trim();

  if (!id || !isValidObjectId(id)) {
    response.status(400).json({
      message: "Invalid competitor ID.",
    });
    return;
  }

  try {
    await connectToDatabase();

    const competitor = await CompetitorModel.findByIdAndDelete(id);

    if (!competitor) {
      response.status(404).json({
        message: "Competitor not found.",
      });
      return;
    }

    await CrawlSnapshotModel.deleteMany({ competitorId: id });
    await ChangeReportModel.deleteMany({ competitorId: id });

    response.status(204).send();
  } catch (error) {
    sendError(response, error, "Failed to delete competitor.", "deleteCompetitor");
  }
};

import {
  buildCompetitorReport,
  type CompetitorReport,
} from "../services/competitor/report.service.js";

export type BaselineSummary = CompetitorReport;

export const getCompetitorBaseline = async (
  request: Request<{ id: string }>,
  response: Response,
): Promise<void> => {
  const id = request.params?.id?.trim();

  if (!id || !isValidObjectId(id)) {
    response.status(400).json({
      message: "Invalid competitor ID.",
    });
    return;
  }

  try {
    await connectToDatabase();

    const competitor = await CompetitorModel.findById(id).lean();

    if (!competitor) {
      response.status(404).json({
        message: "Competitor not found.",
      });
      return;
    }

    const firstSnapshot = await CrawlSnapshotModel.findOne({
      competitorId: id,
    })
      .sort({ crawledAt: 1 })
      .limit(1)
      .lean();

    if (!firstSnapshot) {
      response.json({
        data: {
          competitor: { name: competitor.name, domain: competitor.domain },
          executive: {
            headline: "Sin primera pasada",
            summary:
              "No se ha lanzado ningun crawl para este competitor. Lanza uno desde Home.",
          },
          empty: true,
          positioning: null,
          seo: null,
          structure: null,
          content: null,
          crawledAt: null,
          url: null,
          snapshotId: null,
        },
      });
      return;
    }

    const report = buildCompetitorReport(
      { name: competitor.name, domain: competitor.domain },
      firstSnapshot as Parameters<typeof buildCompetitorReport>[1],
    );

    response.json({ data: report });
  } catch (error) {
    sendError(response, error, "Failed to load baseline.", "getCompetitorBaseline");
  }
};
