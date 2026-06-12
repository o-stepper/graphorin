---
'@graphorin/mcp': patch
---

fix(mcp): blob resources slice over real bytes; sampling keeps all content blocks (MC-10, MC-13)

- **MC-10**: `createMcpResourceReader` treated a base64 `blob` resource as
  UTF-8 text — `totalBytes` was ~33% inflated and byte ranges could cut
  base64 quads into undecodable garbage. Blob resources are now DECODED
  before slicing: ranges and `totalBytes` operate on real payload bytes
  (text resources unchanged).
- **MC-13**: the sampling bridge narrowed every SDK message to its FIRST
  content block — a text+image message reached the operator's
  `MCPSamplingHandler` with the image silently dropped.
  `MCPSamplingMessage.content` is now the full
  `ReadonlyArray<MCPSamplingContent>` (handlers that assumed a single
  block read `content[0]`). Sampling is deprecated upstream; this is the
  minimal no-silent-loss fix.
