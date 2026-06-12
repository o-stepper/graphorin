---
'@graphorin/provider': patch
---

fix(provider): native Ollama tool_call serialization + stable ids (PS-13)

The native Ollama `/api/chat` path reused `toOpenAIChatMessages`, so replayed
assistant `tool_calls` were serialized OpenAI-style — `arguments` as a
JSON-stringified blob, plus `id` / `type` fields. Ollama's Go server expects
`arguments` to be an object map (`map[string]any`) and rejects the string and
the extra fields, breaking any multi-turn replay of tool calls.

- New `toOllamaChatMessages` emits `tool_calls` as `{ function: { name,
  arguments } }` with `arguments` as an object (string blobs are parsed
  leniently) and no `id` / `type`; the adapter's `buildBody` now uses it (making
  the long-standing "native-Ollama path uses its own conversion" doc true).
- Generated tool-call ids use `crypto.randomUUID()` instead of `Math.random()`.

Red-first: unit tests assert object `arguments`, absent `id`/`type`, lenient
string-arg parsing, and preserved role/content for plain + tool-result messages.
