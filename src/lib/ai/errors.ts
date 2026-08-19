export type ProviderErrorCategory =
  | "rate_limit"
  | "server"
  | "timeout"
  | "network"
  | "unavailable"
  | "context_length"
  | "invalid_response"
  | "authentication"
  | "configuration"
  | "authorization"
  | "safety"
  | "validation"
  | "unsupported"
  | "application"
  | "unknown";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly category: ProviderErrorCategory,
    public readonly retryable: boolean,
    public readonly status?: number,
    public readonly retryAt?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value =
    (error as { status?: unknown; statusCode?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" ? value : undefined;
}

export function classifyProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;
  const status = statusOf(error);
  const code =
    error && typeof error === "object"
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message =
    error instanceof Error ? error.message : "Unknown provider failure";
  const lower = `${code} ${message}`.toLowerCase();

  if (status === 429)
    return new ProviderError(
      "Provider rate limited the request",
      "rate_limit",
      true,
      status,
      undefined,
      error
    );
  if (status && status >= 500)
    return new ProviderError(
      "Provider service failed temporarily",
      "server",
      true,
      status,
      undefined,
      error
    );
  if (status === 401 || lower.includes("invalid api key"))
    return new ProviderError(
      "Provider authentication failed",
      "authentication",
      false,
      status,
      undefined,
      error
    );
  if (status === 403)
    return new ProviderError(
      "Provider authorization failed",
      "authorization",
      false,
      status,
      undefined,
      error
    );
  if (
    status === 400 &&
    (lower.includes("context") || lower.includes("token limit"))
  )
    return new ProviderError(
      "Provider context limit exceeded",
      "context_length",
      true,
      status,
      undefined,
      error
    );
  if (status === 400)
    return new ProviderError(
      "Provider rejected the request",
      "validation",
      false,
      status,
      undefined,
      error
    );
  if (lower.includes("safety") || lower.includes("blocked"))
    return new ProviderError(
      "Provider safety policy rejected the request",
      "safety",
      false,
      status,
      undefined,
      error
    );
  if (lower.includes("abort"))
    return new ProviderError(
      "Provider request was cancelled",
      "application",
      false,
      status,
      undefined,
      error
    );
  if (lower.includes("timeout") || code === "etimedout")
    return new ProviderError(
      "Provider request timed out",
      "timeout",
      true,
      status,
      undefined,
      error
    );
  if (
    ["econnreset", "econnrefused", "enotfound"].includes(code.toLowerCase()) ||
    lower.includes("fetch failed")
  )
    return new ProviderError(
      "Temporary provider network failure",
      "network",
      true,
      status,
      undefined,
      error
    );
  if (lower.includes("not configured") || lower.includes("is not set"))
    return new ProviderError(
      "Provider is not configured",
      "configuration",
      false,
      status,
      undefined,
      error
    );
  return new ProviderError(
    "Provider request failed",
    "unknown",
    false,
    status,
    undefined,
    error
  );
}
