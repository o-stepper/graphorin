---
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/security': minor
'@graphorin/provider': minor
'@graphorin/pricing': minor
'@graphorin/embedder-ollama': minor
'@graphorin/reranker-transformersjs': minor
'@graphorin/server': minor
'@graphorin/tools': minor
---

Audit follow-up: safe quick-wins toward v0.2.0.

**Architecture**

- `@graphorin/core`: extract `ToolCall` into `types/tool-call.ts` to break the
  `message.ts ↔ tool.ts` import cycle (re-exported from `tool.ts`, so import
  paths are unchanged).
- `@graphorin/store-sqlite`: extract the structural driver types
  (`BetterSqlite3Database/Statement/Constructor`) into `driver-types.ts` to
  break the `connection.ts ↔ encryption/index.ts` cycle (re-exported from
  `connection.ts`).

**Security**

- `@graphorin/security`: new exported `assessSecretStrength` weak-secret
  heuristic (length + Shannon entropy + identical-run detection). The pepper
  strength check (`rotatePepper` / `rekeyTokens`) now rejects low-entropy /
  placeholder peppers, not just sub-32-byte ones; `WeakPepperError` carries a
  reason.
- `@graphorin/security`: `refreshAccessToken` gains an opt-in
  `revokePreviousOnRotation` flag — best-effort revoke of the previous refresh
  token when the server rotates it (RFC 6749 §10.4 / OAuth 2.1).

**Adapters & provider**

- `@graphorin/embedder-ollama`: per-request `timeoutMs` (default 30 s) combined
  with any caller `signal`, so a hung Ollama daemon cannot stall an embed call.
- `@graphorin/pricing`: `refreshPricing` gains `timeoutMs` (default 30 s) and a
  combinable `signal`, so the opt-in refresh cannot hang.
- `@graphorin/reranker-transformersjs`: validate `batchSize` (positive integer)
  in the constructor.
- `@graphorin/provider`: document the rationale for the canonical middleware
  ordering inline (redaction innermost, etc.).

**Server**

- `@graphorin/server`: document the WebSocket subprotocol + browser ticket flow
  and link it to the `@graphorin/protocol` wire contract.

**Tools**

- `@graphorin/tools`: document the inbound-sanitization defense posture (why
  `failClosed` is opt-in: untrusted classes already strip-and-wrap).
