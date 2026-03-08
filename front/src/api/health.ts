import { callApi } from "./index";

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export function getHealth(baseUrl?: string): Promise<HealthResponse> {
  return callApi<HealthResponse>("/api/health", {
    method: "GET",
    baseUrl,
  });
}
