# personal-assistant-cli

> A 30-minute hands-on tour through **graphorin** - wire `createAgent({...})` to a six-tier `Memory` backed by SQLite + local embeddings, hook it up to one of three opt-in local-LLM stacks, and stream a real conversation through your terminal.

This example is the smallest end-to-end graphorin assistant. Everything runs on your laptop: SQLite for storage, transformers.js for embeddings (the `stub` recipe swaps in a deterministic stub embedder so CI needs no model download), and your choice of Ollama, llama.cpp HTTP server, or in-process llama.cpp for the language model. No API keys, no telemetry, no phone-home.

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
- **Optional** - at least one of:
  - [Ollama](https://ollama.com/) daemon listening on `http://127.0.0.1:11434`.
  - [llama.cpp `llama-server`](https://github.com/ggml-org/llama.cpp) listening on `http://127.0.0.1:8080`.
  - A locally cached `*.gguf` file plus `pnpm add @graphorin/provider-llamacpp-node` inside this example directory (the in-process recipe).

You can skip the LLM entirely and run the deterministic `stub` recipe - handy for plumbing tests and CI.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/personal-assistant-cli build
pnpm --filter ./examples/personal-assistant-cli test
```

Launch the REPL:

```bash
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/personal-assistant-cli dev
```

Expected first-run output:

```
graphorin v0.9.0 personal-assistant-cli - recipe='stub', model='stub-echo'. Type a message and press Enter; Ctrl+C to exit.
> hello there
stub-echo: hello there
>
```

Press `Ctrl+C` to drain the current turn (`agent.abort({ drain: true, onPendingApprovals: 'hold' })`) and close the SQLite store.

---

## Recipe 1 - Ollama (default)

Ollama is the simplest local-LLM stack: install once, `ollama pull qwen2.5:7b-instruct-q4_K_M`, and the daemon stays alive in the background.

```bash
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama serve &  # if the daemon isn't already running
GRAPHORIN_LLM_RECIPE=ollama \
GRAPHORIN_LLM_MODEL=qwen2.5:7b-instruct-q4_K_M \
  pnpm --filter ./examples/personal-assistant-cli dev
```

Expected first-run banner:

```
graphorin v0.9.0 personal-assistant-cli - recipe='ollama', model='qwen2.5:7b-instruct-q4_K_M'. Type a message and press Enter; Ctrl+C to exit.
> remember I prefer metric units
Got it - I'll keep that in mind.
> what's the weather in San Francisco?
…streamed reply, in metric…
```

The `Provider` is wrapped through `createProvider(adapter, { acceptsSensitivity: ['public', 'internal'] })` - that array IS the first-run sensitivity prompt. Memory rows tagged `secret` are filtered out before any payload reaches the daemon.

Override the daemon URL with `GRAPHORIN_LLM_BASEURL=http://other-host:11434`. Override the model with `GRAPHORIN_LLM_MODEL=...`.

## Recipe 2 - llama.cpp HTTP server

Run [`llama-server`](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) on a port of your choice (default `8080`):

```bash
./llama-server -m ./qwen2.5-7b-instruct.Q4_K_M.gguf -c 8192 --port 8080
GRAPHORIN_LLM_RECIPE=llamacpp-server \
GRAPHORIN_LLM_BASEURL=http://127.0.0.1:8080 \
  pnpm --filter ./examples/personal-assistant-cli dev
```

Expected banner:

```
graphorin v0.9.0 personal-assistant-cli - recipe='llamacpp-server', model='llama'. ...
```

The HTTP shape is OpenAI-compatible; graphorin's `llamaCppServerAdapter(...)` handles the wire translation.

## Recipe 3 - In-process llama.cpp (`llamacpp-node`)

This recipe loads a GGUF model directly inside the Node process via [`node-llama-cpp`](https://node-llama-cpp.withcat.ai/). It is the only recipe whose runtime is opt-in - the example does NOT statically depend on the companion package so the workspace lockfile stays small.

```bash
pnpm --filter ./examples/personal-assistant-cli add @graphorin/provider-llamacpp-node
GRAPHORIN_LLM_RECIPE=llamacpp-node \
GRAPHORIN_LLM_MODEL_PATH=/abs/path/qwen2.5-7b-instruct.Q4_K_M.gguf \
  pnpm --filter ./examples/personal-assistant-cli dev
```

The first turn pays the model-load cost (a few seconds for a 4-bit 7B model on a recent Mac). Subsequent turns are fast.

---

## Hello world (< 20 source lines)

The snippet at [`src/hello-world.ts`](./src/hello-world.ts) is a self-contained walkthrough - `createAgent` + `Memory` + streaming + the first-run sensitivity choice - that runs against the stub provider so you can see the wiring without provisioning an LLM:

```ts
import { createAgent } from '@graphorin/agent';
import { createMemory } from '@graphorin/memory';
import { createProvider } from '@graphorin/provider';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createStubProvider } from './stub-provider.js';

const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
await store.init();
const memory = createMemory({ store: store.memory, embeddings: store.embeddings });
const provider = createProvider(createStubProvider(), {
  acceptsSensitivity: ['public', 'internal'],
});
const agent = createAgent({ name: 'hello', instructions: 'Be brief.', provider, memory });
for await (const ev of agent.stream('Hi!', { sessionId: 's1', userId: 'u1' })) {
  if (ev.type === 'text.delta') process.stdout.write(ev.delta);
}
await store.close();
```

Run it directly:

```bash
pnpm --filter ./examples/personal-assistant-cli exec tsx src/hello-world.ts
# stub-echo: Hi!
```

---

## Memory that survives restarts

Graphorin's agent runtime never auto-persists turns - the example owns the wiring:

- Every REPL turn pushes the user line and the assistant reply through `memory.session.push(...)`, then advances the consolidator with `memory.consolidator.trigger({ kind: 'turn' }, scope)`. `autoPromoteExtraction: true` (MCON-2 opt-in) admits injection-clean extraction facts as `active` so they surface in default recall.
- `tools: memory.tools` exposes the memory tools to the model; `autoAssembleContext: true` + `factsAutoRecall` (with an every-turn trigger strategy) assemble a memory-aware system prompt per run, injecting the top consolidated facts relevant to your message. The context engine's privacy filter classifies the configured endpoint (`providerTrust`), so a loopback daemon receives internal-sensitivity memory while a remote one does not.
- The startup procedural rule is seeded idempotently (the exact rule text is the dedupe key), so restarts do not accumulate duplicate rules.

The default store is `:memory:` - set `GRAPHORIN_DB_PATH=./assistant.db` to keep memory across launches. Teach the assistant a fact, `Ctrl+C`, relaunch with the same `GRAPHORIN_DB_PATH`, and ask for the fact back.

`GRAPHORIN_CONTEXT_WINDOW` (default `32768`, `8192` for the `stub` recipe) tells the context engine your model's token window so auto-compaction can actually fire.

## Why `tier: 'cheap'` on the consolidator?

The default `tier: 'free'` consolidator pins zero-token ceilings - useful for CI but unsatisfying for an actual assistant: memory consolidation never runs, so facts never get summarised and rules never settle. The example overrides this with:

```ts
createMemory({
  // ...
  consolidator: { tier: 'cheap', enabled: true, provider, defaultScope: scope },
})
```

`'cheap'` enables the `light` + `standard` phases with a 50k-token / day ceiling and runs against the same local LLM you already chose. Combined with the per-turn `trigger({ kind: 'turn' }, scope)` calls above, it keeps memory feeling alive after the first conversation. To revert to the safe default, pass `consolidator: { tier: 'free', enabled: false }` (or omit the field entirely).

See `CONSOLIDATOR_TIER_DEFAULTS` exported from `@graphorin/memory` for the full per-tier ceiling table.

---

## The durable-resume tradeoff

graphorin's HITL (human-in-the-loop) durable-resume contract requires the runtime to be able to re-execute a step after a process restart. That's why the recipes split:

| Recipe              | Durable mid-stream resume? | Notes                                                                 |
| ------------------- | -------------------------- | --------------------------------------------------------------------- |
| `ollama`            | yes                        | Ollama daemon survives the Node process; `RunState.toJSON` round-trips. |
| `llamacpp-server`   | yes                        | Same shape as Ollama - HTTP server holds the model context.           |
| `llamacpp-node`     | **no**                     | Model context lives inside Node; restart loses it.                    |
| `stub`              | n/a                        | No real model state.                                                  |

If you need durable HITL, prefer one of the HTTP-shaped recipes.

---

## Verifying the local-only contract

graphorin promises **zero implicit network calls**. You can prove this by setting `GRAPHORIN_OFFLINE=1` and watching the example refuse to phone home:

```bash
GRAPHORIN_OFFLINE=1 GRAPHORIN_LLM_RECIPE=stub \
  pnpm --filter ./examples/personal-assistant-cli dev
# starts cleanly - the stub provider never opens a socket
```

With the `ollama` recipe, the example probes the daemon URL once at startup. Unreachable endpoints raise `OfflineRecipeUnreachableError` (exit code 2) with a helpful message:

```bash
GRAPHORIN_OFFLINE=1 GRAPHORIN_LLM_RECIPE=ollama \
  pnpm --filter ./examples/personal-assistant-cli dev
# [graphorin/example-personal-assistant-cli] GRAPHORIN_OFFLINE=1 is set and recipe 'ollama' cannot reach its local endpoint 'http://127.0.0.1:11434'. Start the daemon (or unset GRAPHORIN_OFFLINE) and try again.
```

Network sniffers (e.g. `lsof -i -nP | grep node`) should show traffic only to your chosen local endpoint, never beyond.

---

## Project layout

```
examples/personal-assistant-cli/
├── src/
│   ├── main.ts              # REPL entry point + createAssistant({...}) helper
│   ├── stub-provider.ts     # Deterministic Provider (no network)
│   ├── stub-embedder.ts     # Deterministic 8-dim Embedder (no network)
│   └── hello-world.ts       # < 20-line snippet embedded above
├── tests/
│   └── smoke.test.ts        # vitest coverage (stub stack + offline path)
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

## Troubleshooting

- **`Unknown GRAPHORIN_LLM_RECIPE='...'`** - pick one of `ollama`, `llamacpp-server`, `llamacpp-node`, `stub`.
- **`recipe 'llamacpp-node' needs '@graphorin/provider-llamacpp-node'`** - install the companion package: `pnpm --filter ./examples/personal-assistant-cli add @graphorin/provider-llamacpp-node`.
- **Ollama daemon refuses connections** - confirm `ollama serve` is running (`curl http://127.0.0.1:11434`) and the model has been pulled (`ollama list`).

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.9.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
