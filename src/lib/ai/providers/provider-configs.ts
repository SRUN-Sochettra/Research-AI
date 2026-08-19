import type { ProviderId, ProviderKind } from "../contracts";

export interface OpenAICompatibleProviderConfig {
  id: Exclude<ProviderId, "gemini">;
  kind: ProviderKind;
  endpoint(env: Record<string, string | undefined>): string;
  apiKey(env: Record<string, string | undefined>): string | undefined;
  model(env: Record<string, string | undefined>): string | undefined;
  defaultModel?: string;
  requiredEnv: string[];
  headers?(env: Record<string, string | undefined>): Record<string, string>;
  unsupportedParameters?: readonly string[];
}

const fixed = (url: string) => () => url;

export const OPENAI_COMPATIBLE_CONFIGS: OpenAICompatibleProviderConfig[] = [
  {
    id: "groq",
    kind: "direct",
    endpoint: fixed("https://api.groq.com/openai/v1/chat/completions"),
    apiKey: (env) => env.GROQ_API_KEY,
    model: (env) => env.GROQ_CHAT_MODEL,
    defaultModel: "llama-3.3-70b-versatile",
    requiredEnv: ["GROQ_API_KEY"],
  },
  {
    id: "cerebras",
    kind: "direct",
    endpoint: fixed("https://api.cerebras.ai/v1/chat/completions"),
    apiKey: (env) => env.CEREBRAS_API_KEY,
    model: (env) => env.CEREBRAS_CHAT_MODEL,
    requiredEnv: ["CEREBRAS_API_KEY", "CEREBRAS_CHAT_MODEL"],
  },
  {
    id: "sambanova",
    kind: "direct",
    endpoint: fixed("https://api.sambanova.ai/v1/chat/completions"),
    apiKey: (env) => env.SAMBANOVA_API_KEY,
    model: (env) => env.SAMBANOVA_CHAT_MODEL,
    requiredEnv: ["SAMBANOVA_API_KEY", "SAMBANOVA_CHAT_MODEL"],
  },
  {
    id: "mistral",
    kind: "direct",
    endpoint: fixed("https://api.mistral.ai/v1/chat/completions"),
    apiKey: (env) => env.MISTRAL_API_KEY,
    model: (env) => env.MISTRAL_CHAT_MODEL,
    requiredEnv: ["MISTRAL_API_KEY", "MISTRAL_CHAT_MODEL"],
  },
  {
    id: "openrouter",
    kind: "gateway",
    endpoint: fixed("https://openrouter.ai/api/v1/chat/completions"),
    apiKey: (env) => env.OPENROUTER_API_KEY,
    model: (env) => env.OPENROUTER_CHAT_MODEL,
    requiredEnv: ["OPENROUTER_API_KEY", "OPENROUTER_CHAT_MODEL"],
    headers: (env) => ({
      ...(env.OPENROUTER_SITE_URL
        ? { "HTTP-Referer": env.OPENROUTER_SITE_URL }
        : {}),
      "X-OpenRouter-Title": env.OPENROUTER_APP_NAME || "SynapseDoc",
    }),
  },
  {
    id: "huggingface",
    kind: "gateway",
    endpoint: fixed("https://router.huggingface.co/v1/chat/completions"),
    apiKey: (env) => env.HUGGINGFACE_TOKEN,
    model: (env) => env.HUGGINGFACE_CHAT_MODEL,
    requiredEnv: ["HUGGINGFACE_TOKEN", "HUGGINGFACE_CHAT_MODEL"],
  },
  {
    id: "cloudflare",
    kind: "direct",
    endpoint: (env) =>
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID ?? ""}/ai/v1/chat/completions`,
    apiKey: (env) => env.CLOUDFLARE_AI_API_TOKEN,
    model: (env) => env.CLOUDFLARE_CHAT_MODEL,
    requiredEnv: [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_AI_API_TOKEN",
      "CLOUDFLARE_CHAT_MODEL",
    ],
  },
];
