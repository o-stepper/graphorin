---
title: Quickstart
description: A 20-line memory-backed agent that streams tokens and persists facts to local SQLite via local embeddings.
---

# Quickstart

This walkthrough is the smallest end-to-end Graphorin assistant. Everything runs on your laptop - SQLite for storage, multilingual embeddings via `@huggingface/transformers`, and a deterministic stub provider for the LLM. No API keys, no telemetry, no phone-home.

::: tip pnpm 10 users
pnpm 10 skips `better-sqlite3`'s install script unless it is approved, and the first run then dies with a bindings error. Approve it before you start - see [Native modules and pnpm 10](/guide/installation#native-modules-and-pnpm-10).
:::

## What you'll build

A memory-backed agent that:

1. Stores facts in a six-tier memory system on a local SQLite database.
2. Streams tokens to your terminal as it answers.
3. Survives a process restart with all state intact.

## Hello world

One self-contained file. The 20 lines of agent code at the bottom are the
part you will keep; the `createStubProvider()` above them is a tiny,
deterministic `Provider` that echoes the last user message - no API keys, no
network - so the whole thing runs offline. Swap it for a real adapter from
[Providers](/guide/providers) when you are ready.

```ts
import type { Provider, ProviderEvent, ProviderRequest } from '@graphorin/core';
import { zeroUsage } from '@graphorin/core';
import { createAgent } from '@graphorin/agent';
import { createMemory } from '@graphorin/memory';
import { createProvider } from '@graphorin/provider';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

function createStubProvider(): Provider {
  const reply = (req: ProviderRequest): string => {
    const last = [...req.messages].reverse().find((m) => m.role === 'user');
    const text =
      typeof last?.content === 'string'
        ? last.content
        : (last?.content ?? [])
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join(' ');
    return `stub-echo: ${text}`;
  };
  return {
    name: 'stub',
    modelId: 'stub-echo',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 8_192,
      maxOutput: 1_024,
      reasoningContract: 'optional',
    },
    acceptsSensitivity: ['public', 'internal', 'secret'],
    async *stream(req): AsyncIterable<ProviderEvent> {
      yield { type: 'stream-start', metadata: { providerName: 'stub', modelId: 'stub-echo' } };
      yield { type: 'text-delta', delta: reply(req) };
      yield { type: 'finish', finishReason: 'stop', usage: zeroUsage() };
    },
    async generate(req) {
      return { text: reply(req), usage: zeroUsage(), finishReason: 'stop' };
    },
  };
}

const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();

const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
  // The deterministic stub never approaches a context limit, so the
  // auto-compaction safety net has nothing to do here. Keeping it off
  // makes the quickstart start clean; the real-LLM recipe below shows
  // the production context profile instead.
  contextEngine: { compaction: false },
});

const provider = createProvider(createStubProvider(), {
  acceptsSensitivity: ['public', 'internal'],
});

const agent = createAgent({
  name: 'hello',
  instructions: 'Be brief and helpful.',
  provider,
  memory,
  tools: memory.tools, // expose the eleven memory tools to the model
});

for await (const event of agent.stream('Hi!', { sessionId: 's1', userId: 'u1' })) {
  if (event.type === 'text.delta') process.stdout.write(event.delta);
}

await sqlite.close();
```

The runnable [example apps](/guide/examples) ship a fuller version of this same
stub as a standalone `stub-provider.ts` module.

## What's happening

```mermaid
sequenceDiagram
    autonumber
    participant App as Your code
    participant Agent as createAgent
    participant Memory as Memory facade
    participant Provider as Provider
    participant LLM as LLM (or stub)
    participant Store as SQLite + sqlite-vec

    App->>Agent: agent.stream("Hi!")
    Agent->>Provider: stream(messages, tools)
    Provider->>LLM: HTTP / in-process call
    LLM-->>Provider: token stream
    Provider-->>Agent: AgentEvent stream
    Agent->>Memory: memory tool call (e.g. fact_search / fact_remember)
    Memory->>Store: read / append rows
    Store-->>Memory: rows
    Memory-->>Agent: tool result
    Agent-->>App: event.type === "text.delta"
```

> The model reaches memory only through the **memory tools** it calls - the agent does not auto-compile a memory-aware prompt or auto-persist facts. Pass `tools: memory.tools` (below) to make those tools available; the only automatic memory integration today is [auto-compaction](/guide/agent-runtime#context-management-in-the-loop).

## Try it with a real local LLM

Swap the stub provider for one of the local-LLM recipes. The three extra
adapter options keep a thinking-capable model fast and make the context
budget coherent end to end - one number for the Ollama server, the
declared provider capabilities, and the memory compaction trigger:

```ts
import { JsTiktokenCounter, ollamaAdapter, createProvider } from '@graphorin/provider';
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

const provider = createProvider(
  ollamaAdapter({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen3:8b-q4_K_M',
    think: false, // qwen3 thinks by default; false keeps a simple assistant fast
    numCtx: 40_960, // one number for the server request AND capabilities.contextWindow
    keepAlive: '10m', // keep the model loaded between turns
  }),
  { acceptsSensitivity: ['public', 'internal'] },
);

const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();

const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
  contextEngine: {
    // Auto-compaction stays on and now has a real budget to work with.
    providerContextWindow: provider.capabilities.contextWindow,
    tokenCounter: new JsTiktokenCounter(), // needs the js-tiktoken peer: pnpm add js-tiktoken
  },
});
```

Or the OpenAI-compatible HTTP adapter for `llama.cpp`'s `llama-server`, LM Studio, LocalAI, or any vendor that speaks the OpenAI Chat Completions wire format. See [Providers](/guide/providers) for the full matrix, including how the Ollama adapter surfaces model thinking as `reasoning.delta` events and what it does (and refuses to do) with a forced `toolChoice`.

## Sensitivity-aware payloads

`acceptsSensitivity: ['public', 'internal']` is the **first-run sensitivity prompt**. Memory rows tagged `secret` are filtered out before any payload reaches the provider. The default for an unfamiliar provider is **deny everything except `public`** until you opt in. See [Security](/guide/security) for the threat model.

## Streaming events

`agent.stream(...)` returns a typed `AsyncIterable<AgentEvent<TOutput>>`. Every operation the runtime performs surfaces as an event:

A few of the most common event types:

| Event type | When it fires |
|---|---|
| `agent.start` / `agent.end` | The run starts and finishes. |
| `step.start` / `step.end` | Per-step boundaries inside the run. |
| `text.delta` / `text.complete` | Token / final text from the model. |
| `reasoning.delta` | A token of the model's extended-reasoning channel (when present). |
| `tool.call.start` / `tool.call.delta` / `tool.call.end` | Streaming model emission of a tool call. |
| `tool.execute.start` / `tool.execute.end` / `tool.execute.error` | Execution lifecycle of the tool. |
| `tool.approval.requested` / `tool.approval.granted` / `tool.approval.denied` | A privileged tool needs human approval and the eventual decision. |
| `context.compacted` | The context engine auto-compacted the buffer. |
| `handoff` | The agent handed off to another agent. |
| `agent.model.fellback` | The agent retried against a fallback model. |
| `agent.fanout.spawned` / `agent.fanout.merged` | Fan-out lifecycle. |
| `agent.evaluator.iteration` / `agent.evaluator.converged` | Evaluator-optimizer lifecycle. |
| `agent.progress.written` / `agent.progress.read` | A progress artifact was persisted or loaded. |
| `agent.lateral-leak.detected` | The lateral-leak defense layer flagged outbound content. |
| `guardrail.tripped` | An input or output guardrail tripped. |

The discriminated `AgentEvent<TOutput>` union is exhaustive and verified at compile time - `assertNever(event)` in the default branch keeps your handlers honest.

## Persisting facts

Passing `tools: memory.tools` (as in the agent above) exposes the eleven memory tools to the model (a twelfth, `deep_recall`, when iterative retrieval is configured) - without it the model has no memory tools to call. You can also drive the same tiers directly from your own code, no agent required:

```ts
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();
const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
  contextEngine: { compaction: false }, // no agent loop here - nothing to compact
});

await memory.semantic.remember(
  { userId: 'alex' },
  { text: 'Loves mountain hiking and fresh espresso.' },
);

const hits = await memory.semantic.search({ userId: 'alex' }, 'mountain trip ideas');
for (const hit of hits) console.log(hit.record.text, hit.score);
```

See [Memory system](/guide/memory-system) for the full tier model and the conflict-resolution pipeline.

## Next steps

- [Architecture](/guide/architecture) - how the layers fit together.
- [Memory system](/guide/memory-system) - the six tiers, hybrid search, and the consolidator.
- [Agent runtime](/guide/agent-runtime) - streaming, HITL, multi-agent handoffs.
- [Providers](/guide/providers) - switch from the stub to Ollama, llama.cpp, or any cloud provider.
- [Examples](/guide/examples) - full end-to-end example apps in the repository.

