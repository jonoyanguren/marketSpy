import { Router } from "express";

import {
  createCompetitor,
  listCompetitors,
} from "../controllers/competitor.controller.js";

export const competitorsRouter = Router();

competitorsRouter.get("/", listCompetitors);
competitorsRouter.post("/", createCompetitor);
