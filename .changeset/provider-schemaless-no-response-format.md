---
'@graphorin/provider': patch
---

OpenAI-shaped adapters: a SCHEMA-LESS structured request no longer sends any `response_format`. The 0.10.2 fix replaced `json_object` with a permissive `strict: false` json_schema, but a billed live pass against the Anthropic OpenAI-compat endpoint showed it rejects that too (`response_format.json_schema.strict: Input should be True`), and `strict: true` requires a closed schema - so every permissive spelling 400s there. The universal contract is the agent's trailing JSON instruction plus the local `schema.parse` gate; explicit `outputType.jsonSchema` requests keep the strict `json_schema` mapping (live-verified green on the same endpoint with a closed schema).
