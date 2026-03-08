import { Router } from "express";

import { competitorsRouter } from "./competitors.routes.js";
import { crawlingRouter } from "./crawling.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/competitors", competitorsRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/crawling", crawlingRouter);
