import type { NextFunction, Request, Response } from "express";

const formatDuration = (startedAt: number): string => {
  const durationMs = Date.now() - startedAt;
  return `${durationMs}ms`;
};

export const requestLogger = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const startedAt = Date.now();

  response.on("finish", () => {
    const status = response.statusCode;
    const line = [
      "[api]",
      request.method,
      request.originalUrl,
      String(status),
      formatDuration(startedAt),
    ].join(" ");

    if (status >= 500) {
      const bodyStr = JSON.stringify(request.body ?? {}).slice(0, 500);
      console.error(line, "| body:", bodyStr + (bodyStr.length >= 500 ? "…" : ""));
    } else {
      console.log(line);
    }
  });

  next();
};
