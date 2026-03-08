import { Router } from "express";

import { previewCrawl } from "../controllers/crawling.controller.js";

export const crawlingRouter = Router();

crawlingRouter.post("/preview", previewCrawl);
