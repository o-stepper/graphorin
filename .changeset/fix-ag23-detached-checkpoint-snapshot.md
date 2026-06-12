---
'@graphorin/agent': minor
---

The suspend checkpoint now persists a detached, secret-redacted snapshot (AG-23): `checkpointStore.put` receives `serializeRunState(state, { stripTracingApiKey: true })` instead of the live `MutableRunState` reference, so post-suspend mutations can no longer leak into an already-persisted checkpoint. `serializeRunState` deep-clones via a JSON round-trip (enforcing its documented plain-JSON contract) and the previously dead `stripTracingApiKey` option now deep-redacts secret-named keys (`apiKey`, `authorization`, bearer/access/refresh tokens, `password`, `secret`, …) anywhere in the snapshot — including inside the JSON-string `content` of tool messages. Redaction is best-effort by key name. Note: the persisted checkpoint `state` is now the version-stamped `SerializedRunState` shape — read it back with `deserializeRunState`.
