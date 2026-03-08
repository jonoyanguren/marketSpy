type CallApiOptions = Omit<RequestInit, "body"> & {
  baseUrl?: string;
  body?: BodyInit | Record<string, unknown> | null;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 0, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const buildUrl = (path: string, baseUrl?: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
};

const buildBody = (
  body: CallApiOptions["body"],
): BodyInit | null | undefined => {
  if (!body || body instanceof FormData || typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
};

const parseResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

export async function callApi<T>(
  path: string,
  options: CallApiOptions = {},
): Promise<T> {
  const { baseUrl, body, headers, ...requestInit } = options;

  const response = await fetch(buildUrl(path, baseUrl), {
    ...requestInit,
    headers: {
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body: buildBody(body),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

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
