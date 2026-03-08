import { Router } from "express";

import {
  createCompetitor,
  deleteCompetitor,
  getCompetitorBaseline,
  listCompetitors,
  updateCompetitor,
} from "../controllers/competitor.controller.js";

export const competitorsRouter = Router();

competitorsRouter.get("/", listCompetitors);
competitorsRouter.post("/", createCompetitor);
competitorsRouter.get("/:id/baseline", getCompetitorBaseline);
competitorsRouter.patch("/:id", updateCompetitor);
competitorsRouter.delete("/:id", deleteCompetitor);
