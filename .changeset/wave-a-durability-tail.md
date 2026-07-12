---
'@graphorin/core': minor
'@graphorin/workflow': minor
'@graphorin/server': minor
---

Durability tail (item 16, A3). `awaitExternal(name, { schema })` validates the resolved payload at the replay delivery point against a structural `PayloadSchemaLike` (zod v3/v4 compatible, no zod dependency in core): a failing payload restores the suspension instead of failing the thread - the invalid value is discarded (never persisted as satisfied), the thread stays suspended on the same awakeable, and the resolver receives a typed `awakeable-payload-invalid` error. New pure helpers `serializeAwakeableRef` / `parseAwakeableRef` round-trip the canonical `(workflowId, threadId, name)` awakeable address through one compact string for single-slot channel surfaces (messenger callback data); the parser returns `null` on malformed input. The server now warns loudly at `start()` when workflows are registered without a durable-timer driver - a `sleepFor` thread would otherwise sleep forever with zero signal (the wiring stays programmatic by design; the config file carries no domain adapters).
