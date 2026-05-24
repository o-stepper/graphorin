---
'@graphorin/core': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

WI-10 / P1-4 — result references / handles instead of always inlining.

**Handles, not blobs.** A tool with `truncationStrategy: 'spill-to-file'` now
yields a structured `ResultHandle` (new on `ToolResult`): the executor writes
the full body to a run-scoped artifact (`<tmpdir>/graphorin-spill/<runId>/<toolCallId>.<ext>`,
mode `0600`) and the agent inlines only the bounded **preview** plus a one-line
retrieval hint. The full result never enters the context window — **including
when the tool returns a structured object**, which the truncation pipeline
alone leaves intact (`wrapOutput` passes objects through untouched). The model
fetches the rest on demand via the new built-in **`read_result`** tool.

**`read_result`.** Auto-registered (eager) whenever at least one registered
tool opts into `'spill-to-file'` — mirroring how `tool_search` registers only
when a deferred tool exists. It pages through a spilled artifact by byte range
(`offset`/`length`) or line range (`startLine`/`endLine`, 1-based inclusive),
returning at most `maxBytes` (default 64 KiB) plus `totalBytes`/`eof`. Handle
URIs are **opaque** (`graphorin-spill:<runId>/<toolCallId>.<ext>`): the reader
resolves them only within the spill artifact root, so a `..` traversal or a
non-`graphorin-spill:` scheme is rejected and a handle can never read an
arbitrary file. The raw absolute path is kept only on the operator-facing spill
audit row, never surfaced to the model.

**Sensitivity gate.** A `sensitivity: 'secret'` tool is never spilled to the
shared store — its body is truncated in place and no handle is produced.

New public API: `ResultHandle` (`@graphorin/core`); `createDefaultSpillWriter`,
`createFileResultReader` / `ResultReader` / `ResultReadRange` /
`ResultReadOutcome` / `SPILL_HANDLE_SCHEME` (`@graphorin/tools/result`);
`createReadResultTool` (`@graphorin/tools/built-in`). The `'spill-to-file'`
annotation now carries the opaque `handle=` (was the raw `artifactPath=`). The
happy path for inlined (non-spilled) results is unchanged (R10). Fully offline
(R4).
