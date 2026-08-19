# Legal review required before public launch

This patch supplies a repo-tailored operational draft, not legal advice. Before launch:

1. Set `NEXT_PUBLIC_LEGAL_EMAIL` to a monitored address.
2. Confirm the legal operator name and whether Cambodia is the intended governing law.
3. Verify the exact production regions and terms for Vercel, Supabase, Google Gemini API, Upstash, and Langfuse.
4. Confirm whether the Gemini API account is paid or unpaid and what provider data-use/retention rules apply. Do not claim “never trained on” or “zero retention” without evidence for the deployed account.
5. Implement and test account deletion and data export, or keep the manual-request disclosure.
6. Verify deletion in the live Supabase database, object storage, backups, document chunks, conversations, messages, and multi-document `document_ids` arrays.
7. Confirm production RLS/storage policies and rate limiting. The repository design is not proof that the deployed database is configured correctly.
8. Decide and document retention periods for operational logs, deleted data, backups, and failed uploads.
9. Obtain qualified legal review for the jurisdictions where the service is offered.
10. Re-run review whenever providers, analytics, cookies, pricing, age requirements, upload types, limits, or data flows change.
11. Verify account-specific terms for Gemini, Groq, Cerebras, SambaNova, Mistral, OpenRouter/upstreams, Hugging Face/inference partners, Cloudflare Workers AI, and Cohere when enabled.
12. Confirm deployed disclosures match provider order, gateway routing, model availability, regions, retention, training, security, and production-key terms.
