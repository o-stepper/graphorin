---
'@graphorin/provider': minor
---

W-095: the local adapters can finally put images on the wire - and never drop multimodal content silently again. With `capabilities: { multimodal: true }`, `openAICompatibleAdapter` / `llamaCppServerAdapter` emit OpenAI `content` parts arrays (`image_url` with bytes as a data URI - default mime `image/png` - and `URL`s passed through as strings; the SERVER dereferences, the adapter never fetches), and `ollamaAdapter` fills the native per-message `images` array with raw base64 (URL images cannot be inlined on that path and are dropped loudly). Audio/file parts have no portable wire form on OpenAI-compatible servers and keep being dropped - now with a WARN. With default capabilities the wire stays byte-identical (flat string content), and dropping ANY non-text part triggers exactly one WARN per adapter instance naming the dropped kinds and pointing at `capabilities.multimodal`.
