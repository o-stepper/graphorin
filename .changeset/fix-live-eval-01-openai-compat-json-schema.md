---
'@graphorin/provider': patch
---

Fix structured output silently breaking over the Anthropic OpenAI-compat endpoint (e2e 2026-07-16, LIVE-EVAL-01, major). The openai-shaped adapter emitted `response_format: { type: 'json_object' }` for a structured request without an explicit JSON schema, but the Anthropic OpenAI-compat endpoint rejects it with HTTP 400 (`response_format.type: Input should be 'json_schema'`), so the memory standard-phase extraction over that path silently produced zero facts. A schema-less structured request now sends a permissive `json_schema` (`{ type: 'object', additionalProperties: true }`, `strict: false`) instead of `json_object`, which is accepted by OpenAI's lenient json_schema mode and by the compat endpoints; a request that carries an explicit schema is unchanged (strict json_schema). Offline regression test pins the wire shape; a live re-check against the Anthropic OpenAI-compat endpoint is recommended before publishing the W-059 benchmark run.
