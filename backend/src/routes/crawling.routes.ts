import { Router } from "express";

import {
  getChangeReports,
  getCrawlingHistory,
  previewCrawl,
} from "../controllers/crawling.controller.js";

export const crawlingRouter = Router();

crawlingRouter.get("/history", getCrawlingHistory);
crawlingRouter.get("/changes", getChangeReports);
crawlingRouter.post("/preview", previewCrawl);
