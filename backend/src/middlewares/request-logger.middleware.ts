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
    console.log(
      [
        "[api]",
        request.method,
        request.originalUrl,
        String(response.statusCode),
        formatDuration(startedAt),
      ].join(" "),
    );
  });

  next();
};
