import type { Request, Response } from "express";

import { env } from "../config/env.js";

/**
 * Logs error with full stack trace and context.
 */
export function logError(
  error: unknown,
  context?: string,
  extra?: Record<string, unknown>,
): void {
  const prefix = context ? `[${context}]` : "[error]";
  console.error(prefix, error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  if (extra && Object.keys(extra).length > 0) {
    console.error(prefix, "extra:", JSON.stringify(extra, null, 2));
  }
}

/**
 * Sends 500 response and logs the error.
 * In development, includes more details in the response.
 */
export function sendError(
  response: Response,
  error: unknown,
  defaultMessage = "Internal server error.",
  context?: string,
): void {
  const message =
    error instanceof Error ? error.message : defaultMessage;

  logError(error, context ?? "server", {
    status: 500,
    message,
  });

  const body: { message: string; stack?: string } = { message };

  if (env.nodeEnv !== "production" && error instanceof Error && error.stack) {
    body.stack = error.stack;
  }

  response.status(500).json(body);
}

/**
 * Express error handler middleware.
 * Catches unhandled errors from async route handlers.
 */
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: (err?: unknown) => void,
): void {
  logError(error, "unhandled");
  sendError(response, error);
}
