---
'@graphorin/mcp': patch
---

fix(mcp): non-text content and structured payloads are never silently lost (MC-8, MC-11)

- **MC-8**: the typed `output` (the only channel the agent serialises into
  the tool message) concatenated text parts only — an image/audio-only
  result produced an EMPTY tool message and even text-bearing embedded
  `resource` parts were dropped. Embedded resource text now joins the
  output outright; image/audio/blob-resource parts leave a text descriptor
  (`[image image/png, ~6kB — full payload in contentParts]`).
- **MC-11**: a `structuredContent` schema-validation failure fell through
  to the text mirror, returning an empty string when the server sent only
  structured content — payload silently gone. The failure now logs a
  warning and mirrors the payload as JSON text (same as the no-schema
  branch), so a mismatch never yields an empty output. (With a compliant
  server the SDK validates wire-side; this client fallback covers
  validator divergence.)
