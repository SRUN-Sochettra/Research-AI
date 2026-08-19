import type { BaseMessage } from "@langchain/core/messages";
import type { TextProvider, TextRequest } from "../contracts";
import { ProviderError } from "../errors";
import type { OpenAICompatibleProviderConfig } from "./provider-configs";

function role(message: BaseMessage): "system" | "user" | "assistant" {
  const type = message.getType();
  return type === "system" ? "system" : type === "human" ? "user" : "assistant";
}

function text(message: BaseMessage): string {
  if (typeof message.content === "string") return message.content;
  return message.content
    .map((part) =>
      typeof part === "string" ? part : "text" in part ? String(part.text) : ""
    )
    .join("");
}

function retryAt(response: Response): number | undefined {
  const candidates = [
    response.headers.get("retry-after"),
    response.headers.get("x-ratelimit-reset-requests"),
    response.headers.get("x-ratelimit-reset"),
  ];
  for (const value of candidates) {
    if (!value) continue;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
      return seconds > 1_000_000_000
        ? seconds * 1000
        : Date.now() + seconds * 1000;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function httpError(provider: string, response: Response): ProviderError {
  const status = response.status;
  const category =
    status === 429
      ? "rate_limit"
      : status >= 500
        ? "server"
        : status === 401
          ? "authentication"
          : status === 403
            ? "authorization"
            : status === 404
              ? "configuration"
              : "validation";
  return new ProviderError(
    `${provider} request failed with HTTP ${status}`,
    category,
    status === 429 || status >= 500,
    status,
    retryAt(response)
  );
}

async function request(
  config: OpenAICompatibleProviderConfig,
  provider: TextProvider,
  input: TextRequest,
  stream: boolean,
  env: Record<string, string | undefined>
): Promise<Response> {
  const configError = provider.configurationError?.();
  if (configError) {
    throw new ProviderError(configError, "configuration", false);
  }
  const response = await fetch(config.endpoint(env), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey(env)}`,
      "Content-Type": "application/json",
      ...config.headers?.(env),
    },
    body: JSON.stringify({
      model: provider.model,
      messages: input.messages.map((message) => ({
        role: role(message),
        content: text(message),
      })),
      temperature: input.temperature ?? 0.3,
      stream,
    }),
    signal: input.signal,
  });
  if (!response.ok) throw httpError(config.id, response);
  return response;
}

export function createOpenAICompatibleProvider(
  config: OpenAICompatibleProviderConfig,
  env: Record<string, string | undefined> = process.env
): TextProvider {
  const model = config.model(env) || config.defaultModel || "";
  const configurationError = () => {
    const missing = config.requiredEnv.filter((name) => !env[name]);
    return missing.length > 0
      ? `${config.id} is not configured; missing ${missing.join(", ")}`
      : null;
  };
  const provider: TextProvider = {
    id: config.id,
    model,
    kind: config.kind,
    capabilities: {
      text: true,
      streaming: true,
      embeddings: false,
      ocrPdf: false,
    },
    configured: () => configurationError() === null,
    configurationError,
    async invoke(input) {
      const response = await request(config, provider, input, false, env);
      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: string | Array<{ text?: string }> };
        }>;
      };
      const content = data.choices?.[0]?.message?.content;
      const output = (
        typeof content === "string"
          ? content
          : content?.map((part) => part.text ?? "").join("")
      )?.trim();
      if (!output) {
        throw new ProviderError(
          `${config.id} returned an empty response`,
          "invalid_response",
          true,
          502
        );
      }
      return output;
    },
    async *stream(input) {
      const response = await request(config, provider, input, true, env);
      if (!response.body) {
        throw new ProviderError(
          `${config.id} returned no response stream`,
          "invalid_response",
          true,
          502
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            let data: { choices?: Array<{ delta?: { content?: string } }> };
            try {
              data = JSON.parse(payload) as typeof data;
            } catch {
              throw new ProviderError(
                `${config.id} returned malformed stream data`,
                "invalid_response",
                true,
                502
              );
            }
            const token = data.choices?.[0]?.delta?.content;
            if (token) yield token;
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
  return provider;
}
