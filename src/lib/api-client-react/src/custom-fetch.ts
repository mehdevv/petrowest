import { handleApiRoute } from "../../supabase-backend";

export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

// ── Error Classes ─────────────────────────────────────────

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string }
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string }
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

// ── Helpers ───────────────────────────────────────────────

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;
  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

function resolveMethod(
  input: RequestInfo | URL,
  explicitMethod?: string
): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request)
    return input.method.toUpperCase();
  return "GET";
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (typeof URL !== "undefined" && input instanceof URL)
    return input.toString();
  return (input as Request).url;
}

// ── Main customFetch ──────────────────────────────────────

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {}
): Promise<T> {
  const { headers: _headersInit, ...init } = options;
  const method = resolveMethod(input, init.method);
  const url = resolveUrl(input);

  // ── Supabase-backed API routing ───────────────────────
  // If the URL starts with /api/, intercept and route to Supabase.
  if (url.startsWith("/api/") || url.startsWith("/api?")) {
    try {
      // Parse body if present
      let body: any = undefined;
      if (init.body && typeof init.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }

      const result = await handleApiRoute(url, method, body);

      // 204 No Content
      if (result.status === 204 || result.data === null) {
        return null as T;
      }

      return result.data as T;
    } catch (err: any) {
      // Convert RouteError to ApiError for compatibility with React Query
      const status = err.status || 500;
      const message = err.message || "Internal error";

      // Create a fake Response so ApiError works
      const fakeResponse = new Response(JSON.stringify({ error: message }), {
        status,
        statusText: message,
        headers: { "Content-Type": "application/json" },
      });

      throw new ApiError(
        fakeResponse,
        { error: message } as any,
        { method, url }
      );
    }
  }

  // ── Normal fetch fallback (non-API URLs) ──────────────
  const response = await fetch(input, { ...init, method });
  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(response, errorData, { method, url });
  }

  if (response.status === 204) return null as T;

  try {
    return (await response.json()) as T;
  } catch {
    return null as T;
  }
}
