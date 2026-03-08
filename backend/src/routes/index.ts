import { Router } from "express";

import { crawlingRouter } from "./crawling.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/crawling", crawlingRouter);
