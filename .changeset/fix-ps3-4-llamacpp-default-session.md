---
'@graphorin/provider-llamacpp-node': patch
---

fix(provider-llamacpp-node): real default session factory + honest mid-stream errors (PS-3 / PS-4)

- **PS-3** — `llamaCppNodeAdapter({ modelPath })` was unusable as documented:
  the default session factory unconditionally rejected with "no sessionFactory
  configured", breaking the README quick start, the option's own JSDoc, and the
  repo's `personal-assistant-cli` example on first inference. The default
  factory is now real: `model.createContext()` → `context.getSequence()` →
  `new LlamaChatSession({ contextSequence, systemPrompt })` from the
  lazily-loaded peer, with the peer's callback-streaming
  `prompt(text, { onTextChunk })` bridged to the adapter's AsyncIterable
  contract (a `prompt` rejection rejects the pending iteration, feeding the
  error path). The override seams (`sessionFactory`,
  `runtimeOverrides.createSession`, and the new
  `runtimeOverrides.LlamaChatSession` ctor stub) remain for tests.
- **PS-4** — mid-stream errors were swallowed: the stream yielded `error` and
  then an unconditional `finish: 'stop'`, and `generate()` ignored error events
  entirely, returning truncated text indistinguishable from success (and a
  never-throwing `generate()` bypasses `withRetry`/`withFallback`). The stream
  now finishes with `finishReason: 'error'` after an error event, and
  `generate()` throws a `ProviderHttpError` instead of returning the partial.
