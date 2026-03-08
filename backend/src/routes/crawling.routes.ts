import { Router } from "express";

import {
  getCrawlingHistory,
  previewCrawl,
} from "../controllers/crawling.controller.js";

export const crawlingRouter = Router();

crawlingRouter.get("/history", getCrawlingHistory);
crawlingRouter.post("/preview", previewCrawl);
