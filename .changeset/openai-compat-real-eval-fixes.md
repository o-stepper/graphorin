---
'@graphorin/provider': patch
'@graphorin/pricing': patch
'@graphorin/evals': patch
---

Deep-retest 0.13.6 remediation: the generic OpenAI-compatible adapter now works with both base-URL conventions and current OpenAI models, and the real-eval harnesses stop masking infrastructure defects.

- `@graphorin/provider`: a `baseUrl` that already ends in `/v1` (the `api.openai.com/v1` / LM Studio / vLLM convention, and the exact providers-guide example) now gets `/chat/completions` appended instead of producing a guaranteed-404 `/v1/v1/chat/completions`; an explicit `chatPath` still wins verbatim. New `tokenLimitParam` option on `openAICompatibleAdapter` pins the wire name for `maxTokens` (`'max_tokens'` classic servers, `'max_completion_tokens'` current OpenAI models); left unset, the adapter reacts to the specific HTTP 400 naming `max_completion_tokens` by re-sending the request once with the remapped parameter and remembering the switch for the provider instance.
- `@graphorin/pricing`: new `priceLookupByModel` - vendor-agnostic, model-id-keyed per-Mtok lookup over the bundled snapshot (with the dateless-alias fallback), drop-in for `withCostTracking({ priceLookup })`. Extracted from the LongMemEval runner so the HaluMem runner's `--max-cost-usd` ceiling actually observes spend instead of staying honestly-warned but unenforced.
- `@graphorin/evals`: new `createFakeEmbedder` - the deterministic offline bag-of-words embedder moved out of the LongMemEval runner so every harness can arm the vector leg (`--embedder fake`); the HaluMem conflict A/B needs it because the reconcile mid-zone is an embedding-similarity band.

Bench harness (not npm-published): HaluMem now checks the consolidator `PhaseOutcome` per session and stamps provider/ingest failures as `INFRASTRUCTURE_FAILED` (non-zero exit, `infrastructureFailedCases` in the JSON report) instead of scoring an empty memory as a quality zero; gains the `--embedder none|fake` axis; and its cost ceiling prices usage via the shared snapshot lookup.
