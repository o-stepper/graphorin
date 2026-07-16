---
'@graphorin/protocol': patch
---

Fix `ServerMessageSchema` accepting an RPC response frame with neither `result` nor `error` (e2e 2026-07-13, CORE-PRO-01, minor). `result: z.unknown()` makes the key optional in zod, so a frame carrying only `{ v, jsonrpc, id }` validated as a success even though JSON-RPC 2.0 requires exactly one of result/error. The success schema now requires the `result` key to be present (any value, including `null`), so a result-and-error-less frame fails validation. Regression tests pin the rejection and that an explicit-null result still validates as a success.
