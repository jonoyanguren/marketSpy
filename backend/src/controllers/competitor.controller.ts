import type { Request, Response } from "express";

import { connectToDatabase } from "../config/database.js";
import { CompetitorModel } from "../models/competitor.model.js";

type CreateCompetitorBody = {
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
    const message =
      error instanceof Error ? error.message : "Failed to load competitors.";

    response.status(500).json({
      message,
    });
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
    const message =
      error instanceof Error ? error.message : "Failed to create competitor.";

    response.status(500).json({
      message,
    });
  }
};
