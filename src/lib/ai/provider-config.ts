import { PROVIDER_IDS, type ProviderId } from "./contracts";

export const DEFAULT_PROVIDER_ORDER: ProviderId[] = [
  "gemini",
  "groq",
  "cerebras",
  "sambanova",
  "mistral",
  "openrouter",
];

export interface RoutingConfig {
  order: ProviderId[];
  fallbackEnabled: boolean;
  maxProvidersPerRequest: 1 | 2;
}

export function parseRoutingConfig(
  env: Record<string, string | undefined> = process.env
): RoutingConfig {
  const raw = env.AI_TEXT_PROVIDER_ORDER?.trim();
  const values = raw
    ? raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_PROVIDER_ORDER;
  const known = new Set<string>(PROVIDER_IDS);
  const unknown = values.filter((value) => !known.has(value));
  if (unknown.length > 0) {
    throw new Error(
      `AI_TEXT_PROVIDER_ORDER contains unknown provider(s): ${unknown.join(", ")}`
    );
  }
  const order = [...new Set(values)] as ProviderId[];
  if (order.length === 0) {
    throw new Error(
      "AI_TEXT_PROVIDER_ORDER must contain at least one provider"
    );
  }
  const maxRaw = env.AI_MAX_PROVIDERS_PER_REQUEST ?? "2";
  if (maxRaw !== "1" && maxRaw !== "2") {
    throw new Error("AI_MAX_PROVIDERS_PER_REQUEST must be 1 or 2");
  }
  const fallbackEnabled = env.AI_FALLBACK_ENABLED !== "false";
  return {
    order,
    fallbackEnabled,
    maxProvidersPerRequest: fallbackEnabled ? (Number(maxRaw) as 1 | 2) : 1,
  };
}
