import type { TextProvider } from "./contracts";
import { createGeminiProvider } from "./providers/gemini-provider";
import { createOpenAICompatibleProvider } from "./providers/openai-compatible-provider";
import { OPENAI_COMPATIBLE_CONFIGS } from "./providers/provider-configs";

export function createProviderRegistry(
  env: Record<string, string | undefined> = process.env
): TextProvider[] {
  return [
    createGeminiProvider(),
    ...OPENAI_COMPATIBLE_CONFIGS.map((config) =>
      createOpenAICompatibleProvider(config, env)
    ),
  ];
}
