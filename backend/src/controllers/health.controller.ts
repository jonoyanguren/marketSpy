import type { Request, Response } from "express";

export const getHealth = (_request: Request, response: Response): void => {
  response.json({
    status: "ok",
    service: "marketspy-backend",
    timestamp: new Date().toISOString(),
  });
};
