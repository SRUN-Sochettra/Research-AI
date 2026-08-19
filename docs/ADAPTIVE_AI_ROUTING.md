# Adaptive AI routing

Text generation uses a provider-neutral registry. Gemini has a dedicated adapter; Groq, Cerebras, SambaNova, Mistral, OpenRouter, Hugging Face Inference Providers, and Cloudflare Workers AI share a restrained OpenAI-compatible adapter with fixed official endpoints and explicit per-provider configuration. OpenRouter and Hugging Face are gateways; other registered providers are direct.

Eligibility intersects operator order, complete credentials/model configuration, text/streaming capability, and circuit health. Default order is `gemini,groq,cerebras,sambanova,mistral,openrouter`; Hugging Face and Cloudflare require explicit opt-in. Calls are sequential, never hedged. `AI_MAX_PROVIDERS_PER_REQUEST` accepts only `1` or `2`; disabling fallback forces one. Non-streaming keeps the existing two attempts per selected provider and 25-second budget.

Streaming buffers the first content chunk before exposure. Retryable pre-token failure may select one fallback. After visible output, no alternate provider continues. Cancellation stops retry/fallback. The API route retains the existing `meta`, `token`, `citations`, `done`, and `error` contract and owns the single terminal event and assistant persistence.

All providers reuse `RedisProviderHealthStore`, `getRedisCredentials`, keys `synapsedoc:ai-health:<provider>` and `:probe`, three-failure threshold, 45-second cooldown, 300-second health TTL, and `SET NX` half-open probe. Redis failure degrades to instance-local non-authoritative memory.

Optional Cohere v2 reranking is disabled by default. When enabled, retrieval requests at most 12 candidates, sends the query and candidate text, validates returned indices, and reorders original chunk objects. IDs, document IDs, pages, text, and similarities remain attached. Any failure or invalid/empty output fails open to original vector order; passage text is not logged.

The sole active embedding profile remains `google:gemini-embedding-001:3072:v1`; no migration or alternate embedding path is added. Native PDF extraction remains first, Gemini remains the only AI OCR provider, and the current single-page OCR reconstruction limitation remains.

## Environment

```dotenv
GOOGLE_API_KEY=
GEMINI_CHAT_MODEL=
GROQ_API_KEY=
GROQ_CHAT_MODEL=
CEREBRAS_API_KEY=
CEREBRAS_CHAT_MODEL=
SAMBANOVA_API_KEY=
SAMBANOVA_CHAT_MODEL=
MISTRAL_API_KEY=
MISTRAL_CHAT_MODEL=
OPENROUTER_API_KEY=
OPENROUTER_CHAT_MODEL=
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=SynapseDoc
HUGGINGFACE_TOKEN=
HUGGINGFACE_CHAT_MODEL=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_AI_API_TOKEN=
CLOUDFLARE_CHAT_MODEL=
COHERE_API_KEY=
COHERE_RERANK_MODEL=
AI_RERANK_ENABLED=false
AI_RERANK_PROVIDER=cohere
AI_TEXT_PROVIDER_ORDER=gemini,groq,cerebras,sambanova,mistral,openrouter
AI_FALLBACK_ENABLED=true
AI_MAX_PROVIDERS_PER_REQUEST=2
```

Cerebras, SambaNova, Mistral, OpenRouter, Hugging Face, Cloudflare, and Cohere require explicit model variables. OpenRouter never appends `:free`; Hugging Face requires an explicit model/provider path. Account model availability must be verified live.

## Privacy and rollback

Ordinary RAG may send the question, bounded history, and bounded retrieved passages to the selected processor; gateways may involve an upstream provider. Cohere receives only the query and bounded candidates when enabled. OCR may send PDF content to Gemini. Retention, training, region, security, and compliance terms require account-specific review.

Immediate rollback: `AI_TEXT_PROVIDER_ORDER=gemini`, `AI_FALLBACK_ENABLED=false`, `AI_MAX_PROVIDERS_PER_REQUEST=1`, `AI_RERANK_ENABLED=false`. Full rollback reverts supplied files; no database rollback is required.
