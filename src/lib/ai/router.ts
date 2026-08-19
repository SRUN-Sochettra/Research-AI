import type { TextProvider, TextRequest, ProviderId } from "./contracts";
import { classifyProviderError, ProviderError } from "./errors";
import type { ProviderHealthStore } from "./health-store";
import { RedisProviderHealthStore } from "./health-store";
import { createProviderRegistry } from "./provider-registry";
import { parseRoutingConfig } from "./provider-config";
import { logger } from "@/lib/observability/logger";

const MAX_ATTEMPTS_PER_PROVIDER = 2;
const TOTAL_BUDGET_MS = 25_000;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error("Aborted"));
      },
      { once: true }
    );
  });

export class AIRouter {
  constructor(
    private providers: TextProvider[],
    private health: ProviderHealthStore = new RedisProviderHealthStore(),
    private env: Record<string, string | undefined> = process.env
  ) {}

  private async eligible(request: TextRequest): Promise<TextProvider[]> {
    const routing = parseRoutingConfig(this.env);
    const result: TextProvider[] = [];
    for (const id of routing.order) {
      const provider = this.providers.find((candidate) => candidate.id === id);
      let exclusion: string | null = null;
      if (!provider) exclusion = "not_registered";
      else if (!provider.configured())
        exclusion = provider.configurationError?.() ?? "not_configured";
      else if (!provider.capabilities.text) exclusion = "text_unsupported";
      else if (request.streaming && !provider.capabilities.streaming)
        exclusion = "streaming_unsupported";
      if (exclusion) {
        logger.info("AI provider excluded", {
          workload: request.workload,
          provider: id,
          exclusionReason: exclusion,
        });
        continue;
      }
      const health = await this.health.get(id);
      if (health.state === "open") {
        logger.info("AI provider excluded", {
          workload: request.workload,
          provider: id,
          exclusionReason: "circuit_open",
          circuitState: health.state,
          retryAt: health.retryAt,
        });
        continue;
      }
      if (health.state === "half-open" && !(await this.health.claimProbe(id))) {
        logger.info("AI provider excluded", {
          workload: request.workload,
          provider: id,
          exclusionReason: "half_open_probe_unavailable",
          circuitState: health.state,
        });
        continue;
      }
      result.push(provider!);
      if (result.length >= routing.maxProvidersPerRequest) break;
    }
    return result;
  }

  async invokeText(
    request: TextRequest
  ): Promise<{ text: string; provider: ProviderId; model: string }> {
    const started = Date.now();
    const routing = parseRoutingConfig(this.env);
    let last: ProviderError | undefined;
    const providers = await this.eligible(request);
    for (
      let providerIndex = 0;
      providerIndex < providers.length;
      providerIndex++
    ) {
      const provider = providers[providerIndex]!;
      for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS_PER_PROVIDER &&
        Date.now() - started < TOTAL_BUDGET_MS;
        attempt++
      ) {
        if (request.signal?.aborted)
          throw classifyProviderError(
            request.signal.reason ?? new Error("Aborted")
          );
        try {
          logger.info("AI provider attempt", {
            workload: request.workload,
            provider: provider.id,
            model: provider.model,
            providerKind: provider.kind,
            attempt,
            maxAttempts: MAX_ATTEMPTS_PER_PROVIDER,
            providerNumber: providerIndex + 1,
            maxProviders: routing.maxProvidersPerRequest,
            streaming: false,
          });
          const text = await provider.invoke(request);
          await this.health.success(provider.id);
          logger.info("AI request completed", {
            workload: request.workload,
            finalProvider: provider.id,
            model: provider.model,
            providerKind: provider.kind,
            fallbackOccurred: providerIndex > 0,
            latencyMs: Date.now() - started,
            success: true,
          });
          return { text, provider: provider.id, model: provider.model };
        } catch (error) {
          last = classifyProviderError(error);
          logger.warn("AI provider attempt failed", {
            workload: request.workload,
            provider: provider.id,
            model: provider.model,
            providerKind: provider.kind,
            attempt,
            category: last.category,
            retryable: last.retryable,
            retryAt: last.retryAt,
            cancelled: request.signal?.aborted === true,
          });
          if (request.signal?.aborted || !last.retryable) throw last;
          await this.health.failure(provider.id, last.retryAt);
          if (attempt < MAX_ATTEMPTS_PER_PROVIDER) {
            await sleep(
              Math.min(
                last.retryAt
                  ? Math.max(0, last.retryAt - Date.now())
                  : 200 * 2 ** (attempt - 1) + Math.random() * 100,
                2_000
              ),
              request.signal
            );
          }
        }
      }
    }
    throw (
      last ??
      new ProviderError(
        "No configured healthy text provider is available",
        "configuration",
        false
      )
    );
  }

  async streamChat(
    request: TextRequest,
    onToken: (token: string) => void
  ): Promise<{ text: string; provider: ProviderId; model: string }> {
    const started = Date.now();
    const routing = parseRoutingConfig(this.env);
    const providers = await this.eligible({ ...request, streaming: true });
    let last: ProviderError | undefined;
    for (
      let providerIndex = 0;
      providerIndex < providers.length;
      providerIndex++
    ) {
      const provider = providers[providerIndex]!;
      if (request.signal?.aborted)
        throw classifyProviderError(
          request.signal.reason ?? new Error("Aborted")
        );
      let visible = false;
      try {
        logger.info("AI streaming provider selected", {
          workload: request.workload,
          provider: provider.id,
          model: provider.model,
          providerKind: provider.kind,
          providerNumber: providerIndex + 1,
          maxProviders: routing.maxProvidersPerRequest,
        });
        const iterator = provider
          .stream({ ...request, streaming: true })
          [Symbol.asyncIterator]();
        const first = await iterator.next();
        if (first.done || !first.value) {
          throw new ProviderError(
            "Provider returned no stream content",
            "invalid_response",
            true,
            502
          );
        }
        let text = String(first.value);
        visible = true;
        onToken(String(first.value));
        logger.info("AI streaming started", {
          workload: request.workload,
          provider: provider.id,
          streamingStarted: true,
        });
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          text += next.value;
          onToken(String(next.value));
        }
        await this.health.success(provider.id);
        logger.info("AI streaming completed", {
          workload: request.workload,
          finalProvider: provider.id,
          model: provider.model,
          providerKind: provider.kind,
          fallbackOccurred: providerIndex > 0,
          latencyMs: Date.now() - started,
          success: true,
        });
        return { text, provider: provider.id, model: provider.model };
      } catch (error) {
        last = classifyProviderError(error);
        if (request.signal?.aborted) throw last;
        await this.health.failure(provider.id, last.retryAt);
        if (visible) {
          throw new ProviderError(
            "The response was interrupted after streaming began. Please retry.",
            last.category,
            false,
            last.status,
            last.retryAt,
            error
          );
        }
        if (!last.retryable) throw last;
        logger.warn("AI pre-stream fallback", {
          workload: request.workload,
          provider: provider.id,
          category: last.category,
          retryable: true,
          fallbackOccurred: providerIndex + 1 < providers.length,
        });
      }
    }
    throw (
      last ??
      new ProviderError(
        "No configured healthy streaming provider is available",
        "configuration",
        false
      )
    );
  }
}

export const aiRouter = new AIRouter(createProviderRegistry());
