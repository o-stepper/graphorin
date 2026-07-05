[**Graphorin API reference v0.6.1**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/tools

# @graphorin/tools

> Typed tool surface for the Graphorin framework.

`@graphorin/tools` ships the runtime building blocks every other
`@graphorin/*` package above the persistence layer uses to declare,
register, and execute tools the model can call:

- `tool({...})` - typed factory for declaring a Zod-validated tool.
  Inference flows from `inputSchema` / `outputSchema` into the
  `execute(input, ctx)` callback so authors never repeat the input
  shape.
- `createToolRegistry(...)` - strategy-aware registry that hosts
  every registered tool. Supports the back-compat
  `assertNoDuplicates()` pure-detection signature AND the
  strategy-aware `assertNoDuplicates(strategy, ctx)` overload that
  resolves cross-source collisions through the
  `'auto-prefix' | 'priority' | 'manual'` strategies (with a
  first-party / trusted-skill > untrusted-skill > MCP precedence
  ladder).
- `createToolExecutor(...)` - runs `Tool[]` invocations:
  - parallel-by-default dispatch with bounded concurrency
    (`maxParallelTools`); `executionMode: 'sequential'` opts a tool
    out;
  - approval flow (`needsApproval` predicate ⟶ blocking gate);
  - per-tool secrets ACL scoping via
    `@graphorin/security/secrets`’s `withChildToolSecretsContext`;
  - sandbox-policy resolution via `@graphorin/security/sandbox`’s
    `resolveSandbox(...)` plus an optional `sandboxResolver`
    injection point that the skill loader / agent runtime wires
    when sandbox-bundled code (skills, MCP-derived handlers) needs
    out-of-process execution (delegates to `Sandbox.run(...)`);
  - memory-modification guard hook (`memoryGuardFactory` +
    `memoryRegionReader`) - snapshot-before, verify-after, with
    the mismatch path emitting an audit row and the
    `tool.executor.memory_guard.mismatch.total{toolName,tier}`
    counter increment;
  - hard-kill cancellation with a configurable grace window for
    tools that ignore `ctx.signal` (50 ms default; cancellation
    surfaces `ToolError({ kind: 'aborted' })` and
    `setStatus('cancelled')` on the span);
  - single-round tool repair via the operator-supplied repair hook;
  - a recoverable-error envelope: every `ToolError` carries
    `recoverable` + a `recoveryHint`
    (`retry_later` / `check_input` / `try_alternative` /
    `report_to_user`) rendered to the model under the error message;
  - transparent bounded retry of `rate_limited` outcomes from pure /
    read-only / idempotency-keyed tools (defaults `maxAttempts: 3`,
    `backoffMs: 250`; `ToolRateLimitError.retryAfterMs` wins; tune via
    `createToolExecutor({ retry })`);
  - per-execution `tool.execute` AISpan emitted via the run's
    tracer with rich attributes (`graphorin.tool.name`,
    `graphorin.tool.call_id`, `graphorin.tool.sandbox.kind`,
    `graphorin.tool.sandbox.forced`, `graphorin.tool.sandbox.no_network`,
    `graphorin.tool.sandbox.no_filesystem`,
    `graphorin.tool.memory_guard.tier`, `graphorin.tool.sensitivity`,
    `graphorin.tool.side_effect_class`, `graphorin.tool.streaming_hint`,
    `graphorin.tool.trust_class`, `graphorin.tool.duration_ms`,
    `graphorin.tool.result.contentpart.kind.<image|audio|file>`,
    `graphorin.tool.result.truncation.strategy`,
    `graphorin.tool.result.truncation.applied`,
    `graphorin.tool.result.max_tokens`,
    `graphorin.tool.inbound.sanitization.scan_duration_us`,
    `graphorin.tool.inbound.sanitization.policy`,
    `graphorin.tool.inbound.sanitization.patterns_hit_count`);
  - per-execution audit rows + counter increments keyed under
    stable prefixes (`tool.executor.*`, `tool.classification.*`,
    `tool.collision.*`, `tool.inbound.sanitization.*`,
    `tool.result.*`, `tool.streaming.*`, `tool.preferred-model.*`,
    `tool.retrieval.*`).
- **Default spill writer** - when no operator-supplied
  `SpillWriter` is configured, the executor writes spill artifacts
  to `<os.tmpdir()>/graphorin-spill/<runId>/<toolCallId>.<ext>` with
  `0600` permissions and tier-aware sensitivity inheritance from
  `Tool.sensitivity`. Operators that need a sandbox-aware path
  (`'worker-threads'` / `'isolated-vm'` / `'docker'` tier
  filesystems) inject their own writer via
  `createToolExecutor({ spill })`.
- **Inbound prompt-injection sanitization** - five-policy pipeline
  (`'pass-through' | 'detect-and-flag' | 'detect-and-strip' |
  'detect-and-wrap' | 'detect-and-strip-and-wrap'`) keyed off the
  per-tool trust class. Catalogue lives in
  `@graphorin/observability/redaction/imperative-patterns` (sibling
  to the PII / secrets catalogue used by the outbound exporter
  validators). Optional `failClosed: true` opt-in surfaces hits as
  `ToolError({ kind: 'inbound_sanitization_blocked' })` for
  regulated deployments.
- **Result truncation pipeline** - four strategies (`'middle' |
  'tail' | 'spill-to-file' | 'summarize'`) honouring per-tool
  `maxResultTokens` (default `16384`; `0` disables with a one-time
  WARN). Trust-class auto-defaults: `'tail'` for built-in
  `code_execution`; `'summarize'` for built-in `web_search`;
  `'middle'` everywhere else. Truncation annotations are
  bytes-stable AND calibrated to NOT match any imperative-pattern
  so the downstream sanitization scan is false-positive-free.
- **Streaming-tool execution** - opt-in via
  `tool({ streamingHint: true, async execute(_input, ctx) {
  ctx.streamContent({ kind: 'text', text: 'chunk' });
  ctx.reportProgress(1, 3); } })`. The executor maintains a
  per-`toolCallId` aggregation buffer; the assembled buffer becomes
  the canonical `output` when `execute` returns `void`. Bounded
  backpressure queue (`streaming.eventQueueDepth`, default `256`)
  drops the oldest in-flight event under load while the buffer
  remains lossless.
- **Side-effect classification** -
  `sideEffectClass: 'pure' | 'read-only' | 'side-effecting' |
  'external-stateful'` REQUIRED on the public surface (with a v0.1
  transition mode that emits a one-time WARN per tool name on
  missing classification and applies the conservative deferred
  default `'side-effecting'`). Companion
  `idempotencyKey?: (input, ctx) => string` callback REQUIRED-by-WARN
  for `'side-effecting' | 'external-stateful'` tools - the
  framework never validates the determinism property; that is the
  operator's contract.
- **Per-tool model preferences** -
  `preferredModel?: ModelHint | ModelSpec` with the cost-tier
  vocabulary `'fast' | 'balanced' | 'smart'` exported from
  `@graphorin/core`. The agent runtime (Phase 12) reads the per-tool
  hint at the per-step planner; an explicit `ModelSpec` always wins
  over the cost-tier vocabulary.
- **Tool retrieval at scale** - `defer_loading?: boolean` opt-in.
  The built-in `tool_search({ query, k? = 5 })` (re-exported by
  `@graphorin/tools/built-in`) is auto-registered by the agent
  runtime when at least one tool is deferred; backed by the
  three-tier ranking chain (semantic via the agent's embedder ⟶
  BM25 fallback ⟶ regex name-match final fallback).
- **Worked examples** - optional `examples?: ToolExample[]` per
  tool (bounded `[1, 5]`; overflow emits a one-time WARN). Each
  example's `input` and `output` is validated against the tool's
  schemas at registration; programming errors fail-fast.

## Stable sub-paths

```ts
// Builder + tool spec.
import { tool } from '@graphorin/tools/builder';

// Zod v3/v4 -> JSON Schema converter (what goes on the provider wire).
import { zodToJsonSchema, projectSchemaToJsonSchema } from '@graphorin/tools/schema';

// Strategy-aware registry.
import { createToolRegistry } from '@graphorin/tools/registry';

// Executor.
import { createToolExecutor } from '@graphorin/tools/executor';

// Streaming surface.
import { createStreamingChannel } from '@graphorin/tools/streaming';

// Inbound sanitization.
import { applyInboundSanitization } from '@graphorin/tools/inbound';

// Result envelope helpers + truncation pipeline.
import { truncateBody, toResultEnvelope } from '@graphorin/tools/result';

// Built-in tools (`tool_search`, ...).
import { createToolSearchTool } from '@graphorin/tools/built-in';

// Audit + counter registry.
import { onToolAudit, snapshotCounters } from '@graphorin/tools/audit';

// Typed errors.
import { DuplicateToolNameError } from '@graphorin/tools/errors';
```

## Hello-world

```ts
import { tool, createToolRegistry, createToolExecutor } from '@graphorin/tools';
import { z } from 'zod';

const greet = tool({
  name: 'greet',
  description: 'Greet the user by name.',
  inputSchema: z.object({ name: z.string() }),
  outputSchema: z.object({ greeting: z.string() }),
  sideEffectClass: 'pure',
  async execute({ name }) {
    return { greeting: `Hello, ${name}!` };
  },
});

const registry = createToolRegistry();
registry.register(greet);

const executor = createToolExecutor({ registry });
const completed = await executor.executeBatch({
  calls: [{ toolCallId: '1', toolName: 'greet', args: { name: 'world' } }],
  runContext, // supplied by your agent runtime
  stepNumber: 1,
});
```

## Dependencies

- [`zod`](https://github.com/colinhacks/zod) - required peer
  dependency. Used for input / output / example validation. v3 and
  v4 are both supported.
- `@graphorin/core` - typed contracts (`Tool`, `ToolExecutionContext`,
  `ResolvedTool`, `ToolExample`, `ContentChunk`,
  `SideEffectClass`, `InboundSanitizationPolicy`,
  `TruncationStrategy`, `ToolTrustClass`, the
  `ToolExecuteProgressEvent` / `ToolExecutePartialEvent` agent-event
  variants, …).
- `@graphorin/security` - sandbox policy resolver
  (`resolveSandbox`), per-tool secrets ACL plumbing
  (`withChildToolSecretsContext`, `enforceSecretAcl`).
- `@graphorin/observability` - imperative-pattern catalogue
  (`@graphorin/observability/redaction/imperative-patterns`).

## License

MIT. Copyright © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.6.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/tools/README.md) | @graphorin/tools - typed tool surface for the Graphorin framework. |
| [audit](/api/@graphorin/tools/audit/index.md) | Audit-event emitter + counter registry for `@graphorin/tools`. |
| [builder](/api/@graphorin/tools/builder/index.md) | Tool builder surface for `@graphorin/tools`. |
| [built-in](/api/@graphorin/tools/built-in/index.md) | Built-in tools shipped with `@graphorin/tools`. |
| [code-mode](/api/@graphorin/tools/code-mode/index.md) | Code-mode / programmatic tool calling (P1-2). Public surface: |
| [errors](/api/@graphorin/tools/errors/index.md) | Typed error classes for `@graphorin/tools`. |
| [executor](/api/@graphorin/tools/executor/index.md) | Tool executor surface for `@graphorin/tools`. |
| [inbound](/api/@graphorin/tools/inbound/index.md) | Inbound prompt-injection sanitization surface for `@graphorin/tools`. |
| [package.json](/api/@graphorin/tools/package.json/index.md) | - |
| [registry](/api/@graphorin/tools/registry/index.md) | Strategy-aware tool registry surface for `@graphorin/tools`. |
| [result](/api/@graphorin/tools/result/index.md) | Tool result envelope helpers for `@graphorin/tools` - token counting, truncation pipeline (`'middle' | 'tail' | 'spill-to-file' | 'summarize'`), and the `ToolReturn` content-parts pass-through convention. |
| [schema](/api/@graphorin/tools/schema/index.md) | Schema projection surface: the shared Zod-to-JSON-Schema converter used by the agent's `toolToDefinition`, the code-mode signature projection, and `ToolSearchMatch` (tools-01). |
| [streaming](/api/@graphorin/tools/streaming/index.md) | Streaming-tool execution surface for `@graphorin/tools`. |
