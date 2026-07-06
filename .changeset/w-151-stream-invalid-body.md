---
'@graphorin/server': minor
---

`POST /agents/:id/stream` rejects a malformed body with the same `400 config-invalid` envelope as its sibling `/run` route (W-151), validated through one shared helper BEFORE any run is registered - previously a failed parse silently launched the agent on an empty prompt behind a successful-looking 202, burning provider tokens. Empty and absent bodies stay valid via the schema default, so minimal legitimate calls are unaffected; clients that relied on the silent 202 for invalid bodies now get the honest 400.
