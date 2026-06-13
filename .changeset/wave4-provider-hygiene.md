---
'@graphorin/provider': patch
---

Wave-4 provider hygiene (low-severity audit tail):

- **PS-12** — `vercelAdapter` now reports `finishReason: 'aborted'` (not the initial `'stop'`) when the request signal aborts mid-stream, matching the openai-shaped and ollama adapters.
- **PS-22** — `withRedaction` now (a) re-compiles any non-global user-supplied pattern with the `g` flag, so `.replace`/`.match` cover **every** occurrence on a line rather than only the first (the built-ins were already global), and (b) keeps a bounded tail buffer across `text-delta` events so a secret split across two stream chunks is still detected by the observability scan (best-effort, capped window).
