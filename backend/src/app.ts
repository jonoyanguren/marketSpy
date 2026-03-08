import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./utils/error-handler.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  }),
);

app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    name: "marketSpy API",
    version: "0.1.0",
  });
});

app.use("/api", requestLogger);
app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`marketSpy backend listening on http://localhost:${env.port}`);
});
