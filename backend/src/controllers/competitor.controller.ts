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
};

type UpdateCompetitorBody = {
  name?: string;
  domain?: string;
};

const normalizeDomain = (value: string): string => {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(withProtocol);
  return parsed.hostname.toLowerCase();
};

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

    const competitor = await CompetitorModel.create({
      name,
      domain,
      active: true,
    });

    response.status(201).json({
      data: {
        id: competitor.id,
        name: competitor.name,
        domain: competitor.domain,
        active: competitor.active,
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

  if (!id || !isValidObjectId(id)) {
    response.status(400).json({
      message: "Invalid competitor ID.",
    });
    return;
  }

  if (!name && !rawDomain) {
    response.status(400).json({
      message: "Provide at least `name` or `domain` to update.",
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

    if (name) competitor.name = name;
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
      competitor.domain = domain;
    }

    await competitor.save();

    response.json({
      data: {
        id: competitor.id,
        name: competitor.name,
        domain: competitor.domain,
        active: competitor.active,
        createdAt: competitor.createdAt.toISOString(),
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
