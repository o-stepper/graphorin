---
title: Tools
description: The typed tool({...}) builder, ToolRegistry, and ToolExecutor — parallel dispatch, approvals, sandbox-policy resolution, inbound sanitisation, and the memory-modification guard.
---

# Tools

`@graphorin/tools` ships the runtime building blocks every higher-level package uses to declare, register, and execute the tools the model can call:

- **`tool({...})`** — typed factory for declaring a Zod-validated tool. Inference flows from `inputSchema` / `outputSchema` into the `execute(input, ctx)` callback so you never repeat the input shape.
- **`createToolRegistry(...)`** — strategy-aware registry that hosts every registered tool, with cross-source collision policies.
- **`createToolExecutor(...)`** — runs `Tool[]` invocations with parallel-by-default dispatch, approval flow, sandbox-policy resolution, and a memory-modification guard.

## Declaring a tool

```ts
import { tool } from '@graphorin/tools';
import { z } from 'zod';

export const weather = tool({
  name: 'weather.lookup',
  description: 'Look up the current weather for a city.',
  inputSchema: z.object({
    city: z.string().describe('Full city name'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  outputSchema: z.object({
    summary: z.string(),
    temperature: z.number(),
  }),
  sideEffectClass: 'read-only',
  sensitivity: 'public',
  preferredModel: 'fast',
  async execute({ city, unit }, ctx) {
    ctx.signal.throwIfAborted();
    const data = await ctx.fetch(`/weather?q=${encodeURIComponent(city)}&unit=${unit}`);
    return { summary: data.summary, temperature: data.temperature };
  },
});
```

The result is a fully typed `Tool` object. The `execute` callback receives the parsed input and a `ctx: ToolExecutionContext` with `signal`, scope-bound secrets, and the agent run identifiers.

## Tool classification

Every tool declares two safety attributes plus an explicit approval predicate:

| Attribute | Values | What it controls |
|---|---|---|
| `sensitivity` | `'public'` / `'internal'` / `'secret'` | Whether the result may flow into traces and exports unredacted, and which providers may see it. |
| `sideEffectClass` | `'pure'` / `'read-only'` / `'side-effecting'` / `'external-stateful'` | Idempotency-key requirements, audit emphasis, sandbox-tier defaults. |
| `needsApproval` | `boolean` or `(input, ctx) => boolean \| Promise<boolean>` | Whether the runtime suspends the run with a `tool.approval.requested` event before executing the tool. |
| `memoryGuardTier` | `MemoryGuardTier` (DEC-153) | Classification for the pre/post memory-snapshot guard. **Active when the agent has `memory` wired** (SDF-1); skipped with a one-time WARN otherwise — see [Memory-modification guard](#memory-modification-guard). |
| `preferredModel` | `'fast'` / `'balanced'` / `'smart'` or a `ModelSpec` | Per-tool model-tier hint. Resolved against the agent's tier map. |

Approval is **driven by `needsApproval`**, not by `sideEffectClass`. The latter is a classification used for idempotency checks, sandbox defaults, and audit emphasis; whether a specific call gates on a human is the operator's decision.

```ts
export const refundOrder = tool({
  name: 'refund.create',
  description: 'Issue a refund for a previously placed order.',
  inputSchema: z.object({ orderId: z.string(), amountUsd: z.number() }),
  outputSchema: z.object({ receiptId: z.string() }),
  sideEffectClass: 'external-stateful',
  sensitivity: 'internal',
  needsApproval: ({ amountUsd }) => amountUsd >= 100,
  async execute(input, ctx) {
    return await callPaymentApi(input);
  },
});
```

## Worked examples

A tool may ship up to **five** worked `examples` — `{ input, output, comment? }` triples validated against the tool's `inputSchema` / `outputSchema` at registration. The agent renders them into the `ToolDefinition` it sends the provider, so the model sees concrete input→output pairs next to the schema:

```ts
export const weather = tool({
  name: 'weather.lookup',
  description: 'Look up the current weather for a city.',
  inputSchema: z.object({ city: z.string(), unit: z.enum(['celsius', 'fahrenheit']) }),
  outputSchema: z.object({ summary: z.string(), temperature: z.number() }),
  sideEffectClass: 'read-only',
  examples: [
    {
      input: { city: 'Paris', unit: 'celsius' },
      output: { summary: 'Clear', temperature: 21 },
      comment: 'Typical summer afternoon.',
    },
  ],
  async execute({ city, unit }, ctx) {
    /* … */
  },
});
```

Whether examples ship is governed by `examplesEagerlyRendered`, which the registry resolves from `defer_loading`:

| Tool | Resolved `examplesEagerlyRendered` | Examples rendered? |
|---|---|---|
| Eager (`defer_loading` omitted or `false`) | `true` / left to the runtime | **Yes** — every step. |
| Deferred (`defer_loading: true`) | `false` | **No** — withheld even after `tool_search` promotes the tool. |
| Any, with explicit `examplesEagerlyRendered: false` | `false` | **No** — opt out without deferring the whole tool. |

This keeps large, deferred tool sets lean: a deferred tool adds nothing to the per-step context until `tool_search` surfaces it, and even then its examples stay out of context. Rendered examples are always capped at five.

## ToolRegistry

`createToolRegistry(...)` takes **no tool list**. You register each tool with its provenance (a `ToolSource`), then resolve any cross-source name collisions in one deterministic pass:

```ts
import { createToolRegistry } from '@graphorin/tools';

const registry = createToolRegistry({ semanticScoreThreshold: 0.5 });

registry.register(weather); // source defaults to { kind: 'first-party' }
for (const memoryTool of memory.tools) registry.register(memoryTool);

// Collapse cross-source name collisions; first-party always wins.
registry.assertNoDuplicates('auto-prefix', { source: { kind: 'first-party' } });
```

The optional second argument to `register(...)` is the tool's `ToolSource` — `{ kind: 'first-party' }` (default), `{ kind: 'skill', skillName, trustLevel }`, `{ kind: 'mcp', serverIdentity }`, `{ kind: 'built-in', subsystem }`, or `{ kind: 'web-search', providerName }`. It drives both the auto-prefix namespace and the priority ladder. `assertNoDuplicates(strategy, ctx)` then resolves collisions through three strategies:

| Strategy | When to use |
|---|---|
| `'auto-prefix'` (default) | Default for skill / MCP imports. Renames losers with a stable namespace prefix (e.g. `linear.search_issues`) on collision. |
| `'priority'` | Use when the precedence ladder is enough — first-party > trusted-skill > untrusted-skill > MCP. |
| `'manual'` | Fail-fast on duplicates: throws `ToolCollisionError`. Use when you want explicit registration. |

> Using `@graphorin/agent`? You never call this directly — `createAgent(...)` assembles and collision-resolves one registry from `config.tools` + `config.skills` at warm-up and exposes it read-only as `agent.registry`. See [how the agent assembles and drives the registry](/guide/agent-runtime#tool-execution-in-the-loop).

## ToolExecutor

```ts
import { createToolExecutor } from '@graphorin/tools';

const executor = createToolExecutor({
  registry,
  maxParallelTools: 8,
  approvalGate: {
    // Operator-supplied: prompt a human, then resolve once the decision is in.
    async request(call, approval) {
      return { granted: true }; // or { granted: false, reason: '…' }
    },
  },
});

// Run the model's tool calls for one step as a single batch.
const completed = await executor.executeBatch({ calls, runContext, stepNumber });
```

What you get out of the box:

- **Parallel-by-default dispatch.** Bounded concurrency via `maxParallelTools` (default `8`). Opt a single tool out with `executionMode: 'sequential'`.
- **Approval flow.** A tool's `needsApproval` predicate triggers a blocking gate; the runtime emits `tool.approval.requested` so a human can resolve it durably (granted / denied surface as `tool.approval.granted` / `tool.approval.denied`).
- **Per-tool secrets ACL scoping** via `@graphorin/security/secrets`'s `withChildToolSecretsContext`.
- **Sandbox-policy resolution** via `@graphorin/security/sandbox`. Three sandbox tiers — `'none'`, `'isolated-vm'`, `'docker'` — chosen per tool / per call.
- **Memory-modification guard hook.** Snapshot-before, verify-after; mismatches emit an audit row and a `tool.executor.memory_guard.mismatch.total{toolName,tier}` counter increment.
- **Hard-kill cancellation** with a configurable grace window (50 ms default). Cancellation surfaces `ToolError({ kind: 'aborted' })` and `setStatus('cancelled')` on the span.
- **Single-round tool repair** via the operator-supplied repair hook.
- **Per-execution `tool.execute` span** emitted via the run's tracer with rich `graphorin.tool.*` attributes.

> Using `@graphorin/agent`? `createAgent(...)` constructs this executor at warm-up and calls `executeBatch(...)` for you each step, bridging its events into `agent.stream(...)`. Approvals route through durable HITL instead of the in-process gate: the agent pre-screens `needsApproval` and suspends the run *before* dispatch, so its configured gate simply auto-grants. See [how the agent drives tool execution](/guide/agent-runtime#tool-execution-in-the-loop).

## Response budgets and pagination

Every tool result is bounded by `maxResultTokens` (default **16384**) — **text and structured (object/array) outputs alike**. When a result exceeds the cap, the executor applies the tool's `truncationStrategy` (`'middle'` / `'tail'` / `'spill-to-file'` / `'summarize'`); the bounded text is what reaches the model, never the full object. A structured output on the default `'middle'` strategy is routed through **spill-to-file by default**, so the full blob is preserved behind a `read_result` handle while only a bounded preview enters context. The 16k default sits deliberately below the ~25k single-result norm some providers tolerate; raise it per tool when a tool legitimately returns more, or set `maxResultTokens: 0` to disable the cap (the registry emits a WARN — uncapped results can blow the context window):

```ts
export const bigReport = tool({
  name: 'report.export',
  // …
  maxResultTokens: 40_000,
  truncationStrategy: 'spill-to-file',
});
```

> The truncation budget is currently a fixed token count. Making it provider-aware — deriving the cap from the active model's context window via the token counter — is a planned enhancement tracked with first-class context management.

For tools that can return many rows, prefer **pagination over one large response**. The convention is a `limit` + `cursor` input and a `nextCursor` in the output, so the model fetches one bounded page at a time instead of truncating a giant blob:

```ts
export const listOrders = tool({
  name: 'orders.list',
  description: 'List orders, newest first. Pass the returned nextCursor to page.',
  inputSchema: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  }),
  outputSchema: z.object({
    orders: z.array(orderSchema),
    nextCursor: z.string().optional(),
  }),
  sideEffectClass: 'read-only',
  async execute({ limit, cursor }, ctx) {
    /* … */
  },
});
```

## Result handles and read_result

`'spill-to-file'` does more than truncate: the executor writes the **full** body to a run-scoped artifact (`<tmpdir>/graphorin-spill/<runId>/<toolCallId>.<ext>`, mode `0600`) and surfaces a structured `ResultHandle` on the `ToolResult`:

```ts
interface ResultHandle {
  uri: string; // opaque, run-scoped — e.g. "graphorin-spill:<runId>/<toolCallId>.json"
  kind: 'spill-file' | 'resource-link'; // 'resource-link' = an MCP resource_link (see below)
  preview: string; // the bounded slice already inlined in context
  bytes?: number; // size of the full artifact
}
```

The agent inlines only `preview` (plus a one-line retrieval hint) — so a multi-megabyte result never enters the context window, **even when the tool returns a structured object** — and auto-registers the built-in **`read_result`** tool whenever at least one registered tool spills. The model then fetches just what it needs, by byte range or by line range:

```ts
// model-issued call, paging through the spilled artifact:
read_result({ handle: 'graphorin-spill:run-42/orders.json', startLine: 1, endLine: 50 });
read_result({ handle: 'graphorin-spill:run-42/orders.json', offset: 4096, length: 2048 });
// → { content, bytes, totalBytes, eof }
```

The `uri` is **opaque**: the spill reader resolves it only within the spill artifact root, so a handle can never be used to read arbitrary files (a `..` traversal or a non-`graphorin-spill:` scheme is rejected). Handles are gated by **sensitivity**: a `sensitivity: 'secret'` tool is never spilled to the shared store — its body is truncated in place and no handle is produced. Operators that need a sandbox-aware artifact path inject their own writer + reader via `createToolExecutor({ spill })` and `createReadResultTool({ reader })`.

**External handles (`'resource-link'`).** The same machinery resolves non-spill handles. An MCP `resource_link` tool result surfaces a `resource-link` handle (the resource `uri`) instead of inlining the body; the agent resolves it on demand by composing extra readers after the spill reader — pass `createAgent({ resultReaders: [createMcpResourceReader({ clients })] })` so `read_result` pages an MCP resource exactly like a spilled artifact. Readers are tried in order and each rejects handles it does not own, so resolution falls through cleanly. See the [MCP client guide](/guide/mcp-client#large-resources-resource_link-result-handles).

## Code-mode

Code-mode lets the model orchestrate many tools in one sandboxed script, so intermediate results stay out of context (the agent enables it with `toolInvocation: 'code-mode'` — see the [agent-runtime guide](/guide/agent-runtime#code-mode-toolinvocation-code-mode)). `@graphorin/tools/code-mode` ships the building blocks:

```ts
import { projectToolApi, createCodeExecuteTool, createCodeSearchTool } from '@graphorin/tools/code-mode';
import { runBridgedSource } from '@graphorin/security/sandbox';

// Project the resolved tools as a typed code API the model can read:
const projection = projectToolApi(registry.list());
projection.catalogue;            // name + one-line description, grouped by source
projection.signatureFor('list_orders'); // `tools.list_orders = (input: {…}) => Promise<unknown>`
```

`createCodeExecuteTool({ projection, allowedTools, executeTool })` builds the `code_execute` tool. Its `executeTool` bridge is invoked for each `tools.<name>(args)` call the script makes; the agent wires it to `executor.executeOne(...)`, so a code-mode call is governed exactly like a direct one. `createCodeSearchTool({ projection, searchDeferred })` builds `code_search`, which returns matching signatures on demand.

Execution itself is `runBridgedSource(...)` from `@graphorin/security/sandbox` — a `worker-threads`-tier primitive that evaluates the source as the body of an `async (tools) => { … }` function, exposes `tools` as RPC stubs that round-trip to the host `dispatch`, blocks network/filesystem, enforces a wall-clock timeout + memory ceiling + a tool-call budget, and returns **only** the script's final value. The worker runs with an **empty environment**: it is constructed with `env: {}` and the runtime scrubs `process.env` before the script runs, so host environment variables (API keys, credentials) are never visible to model-written code. The worker can reach the host through nothing but the tool-call channel, and that channel serves only the `allowedTools` names — there is no path to the registry, the executor, or any other host object. As with the `worker-threads` sandbox tier, this is best-effort defence in depth, not a guarantee against process-level mischief by hostile code; layer `isolated-vm` / `docker` underneath when you need V8-grade isolation.

## Memory-modification guard

Every tool declares a `memoryGuardTier` — one of `'pure'`, `'side-effecting-no-memory'`, `'memory-aware'`, `'unknown'`, or `'untrusted'`. When a memory-region reader is supplied, the executor snapshots the affected region before a memory-aware call, verifies it after, and audits any unexpected drift (`memory:modification:before` / `memory:modification:after`). **With `memory` wired on the agent this step is active** (SDF-1): the runtime binds a scope-aware region reader over the working-memory tier (the scope resolves from the in-flight run), so the snapshot/verify cycle runs for every guarded tier. Without `memory`, the guard is skipped and the agent emits a one-time WARN when any tool declares a `memoryGuardTier` — the silent no-op is visible.

## Sandbox tiers

```mermaid
flowchart LR
    A[Tool call] --> R[Sandbox resolver]
    R -->|trusted in-process| N[none]
    R -->|untrusted JS| V[isolated-vm]
    R -->|untrusted binary| D[docker]
```

| Tier | Backed by | When chosen |
|---|---|---|
| `'none'` | The Node.js process. | Trusted, in-process tools. Default for first-party tools. |
| `'isolated-vm'` | [`isolated-vm`](https://github.com/laverdet/isolated-vm) (peer dependency). | Untrusted JavaScript tools (e.g. skills loaded from disk). |
| `'docker'` | [`dockerode`](https://github.com/apocas/dockerode) (peer dependency). | Untrusted binaries or full subprocess isolation. |

The two sandbox peers are opt-in and not installed by default. See [Security](/guide/security) for the threat model.

## Provenance / data-flow policy

The executor accepts an optional `dataFlowGuard` (P1-3) that enforces data-flow rules at the tool boundary using provenance rather than pattern scans — defusing the lethal trifecta (untrusted content + private data + an exfiltration sink). The agent wires it from `createAgent({ dataFlowPolicy })`; the pure engine lives in `@graphorin/security/dataflow`:

```ts
import {
  createDataFlowPolicy,
  createTaintLedger,
  deriveTaintLabel,
} from '@graphorin/security/dataflow';

const policy = createDataFlowPolicy({ mode: 'enforce' });
const ledger = createTaintLedger(); // one per run
// after each tool output:
ledger.recordOutput(deriveTaintLabel({ trustClass, source, sensitivity }), outputText);
// before a sink runs:
const probe = ledger.inspectArgs(JSON.stringify(args));
const decision = policy.evaluate({
  toolName,
  sideEffectClass,
  carriesUntrustedVerbatim: probe.carriesUntrustedVerbatim,
  untrustedSeen: ledger.untrustedSeen,
  sensitiveSeen: ledger.sensitiveSeen,
  sourceKinds: ledger.untrustedSourceKinds,
});
// decision.action ∈ 'allow' | 'flag' | 'declassify' | 'block'
```

The executor consults the guard only for sinks (`side-effecting` / `external-stateful`); a `'block'` short-circuits to a `dataflow_policy_blocked` `ToolError`, and `tool:dataflow:flagged|blocked|declassified` audit rows are emitted for observability. Untrusted output is tagged from the trust class (`mcp-derived` / `web-search` / `skill-untrusted`); secret-tier output from `sensitivity: 'secret'`. See [the agent guide](/guide/agent-runtime#provenance-data-flow-policy-dataflowpolicy) for the end-to-end `dataFlowPolicy` config.

## Composition

Tools, [Skills](/guide/skills), and [MCP servers](/guide/mcp-client) all surface to the agent through the same `ToolRegistry`. From the model's point of view they are indistinguishable — declarative inputs, declarative outputs, declared safety attributes.

## Next steps

- [Skills](/guide/skills) — load skills written to the public `SKILL.md` packaging format.
- [MCP client](/guide/mcp-client) — talk to remote tool servers over Model Context Protocol.
- [Security](/guide/security) — sandbox and approval architecture.
- [Memory system](/guide/memory-system) — the eleven memory tools wired through `@graphorin/tools`.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
