// src/lib/observability/langfuse-callback.ts
//
// Temporary no-op LangChain callback handler.
//
// WHY THIS EXISTS:
// The legacy `langfuse-langchain@3.x` pinned in package.json targets LangChain
// v0.x and is incompatible with this project's LangChain v1 (`@langchain/core@1.x`).
// Constructing its CallbackHandler under LangChain >=1.x throws at runtime
// ("legacy modules are required"). Langfuse's LangChain-v1 support moved to the
// new scoped SDK `@langfuse/langchain` (>= v5; requires Langfuse JS SDK >= 4.3.0),
// which uses a different, OpenTelemetry-based setup.
//
// Until that migration, this shim keeps the AI pipeline compiling AND running,
// with tracing simply disabled. The app is designed to degrade gracefully when
// Langfuse is unavailable (see AGENTS.md §8), so this preserves that property.
//
// TO RESTORE REAL TRACING:
//   1. npm remove langfuse langfuse-langchain
//   2. npm i @langfuse/langchain @langfuse/tracing @langfuse/otel
//   3. Wire up the OTel span processor once at startup, then replace this
//      import with `import { CallbackHandler } from "@langfuse/langchain"`.
//      (The new CallbackHandler no longer takes { userId, sessionId, tags } in
//      its constructor — set those via trace attributes instead. Check current
//      docs: https://langfuse.com/integrations/frameworks/langchain )

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

export interface LangfuseCallbackOptions {
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

/**
 * Drop-in, constructor-compatible replacement for the old
 * `langfuse-langchain` CallbackHandler. Accepts the same options object the
 * call sites already pass, but does nothing (all BaseCallbackHandler methods
 * default to no-ops).
 */
export class CallbackHandler extends BaseCallbackHandler {
  name = "LangfuseNoopCallbackHandler";

  constructor(_options?: LangfuseCallbackOptions) {
    super();
  }
}
