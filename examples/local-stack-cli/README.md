# local-stack-cli

> **Fully-local stack: Ollama LLM + Ollama embeddings + SQLite + sqlite-vec.** Wire `createAgent({...})` to a six-tier `Memory` whose vectors come from a local Ollama embedder, whose chat completions come from a local Ollama LLM, and whose persistence lives in a SQLite database file on disk. Zero non-`localhost` packets - provable with `GRAPHORIN_OFFLINE=1`.

This example is the narrowest end-to-end **graphorin** assistant. It ships a single recipe (`'ollama'`) plus a deterministic `'stub'` for CI. If you want the broader recipe matrix (in-process llama.cpp, llama.cpp HTTP server, …), see [`examples/personal-assistant-cli`](../personal-assistant-cli/README.md).

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
- **[Ollama](https://ollama.com/)** daemon listening on `http://127.0.0.1:11434`. Start it once with `ollama serve` (or let the official installer launch the menu-bar service).

Pull the two models the example uses:

```bash
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama pull nomic-embed-text
```

`qwen2.5:7b-instruct-q4_K_M` is a 4-bit-quantised 7B instruction-tuned chat model (~4.7 GB). `nomic-embed-text` is a 768-dim embedding model (~280 MB). Both run comfortably on a 16 GB Mac mini.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/local-stack-cli build
pnpm --filter ./examples/local-stack-cli test
```

Launch the REPL (after `ollama serve` is running and the two pulls completed):

```bash
pnpm --filter ./examples/local-stack-cli dev
```

Expected first-run banner:

```
graphorin v0.13.8 local-stack-cli - recipe='ollama', model='qwen2.5:7b-instruct-q4_K_M'. Type a message and press Enter; Ctrl+C to exit.
> hello
…streamed reply from your local Ollama daemon…
> Ctrl+C
[graphorin] aborting current turn (Ctrl+C)...
```

`Ctrl+C` drains the current turn through `agent.abort({ drain: true, onPendingApprovals: 'hold' })` and closes the SQLite database before exiting.

---

## What gets wired up

```ts
const provider = createProvider(
  ollamaAdapter({ baseUrl, model: 'qwen2.5:7b-instruct-q4_K_M' }),
  { acceptsSensitivity: ['public', 'internal', 'secret'] },
);

const embedder = createOllamaEmbedder({ baseUrl, model: 'nomic-embed-text' });

const store = await createSqliteStore({ path: './.graphorin/local-stack-cli.db', mode: 'lib' });
await store.init();

const scope = { userId, sessionId, agentId: 'local-stack-assistant' };

const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
  embedder,
  workingBlocks: [/* persona, local_setup */],
  consolidator: {
    tier: 'cheap',
    enabled: true,
    provider,
    defaultScope: scope,
    autoPromoteExtraction: true, // distilled facts land active, not quarantined (MCON-2 opt-in)
  },
  contextEngine: {
    providerContextWindow: 32_768, // arms auto-compaction (GRAPHORIN_CONTEXT_WINDOW overrides)
    compaction: {},                // loopback trust would default auto-compaction off
    tokenCounter: new JsTiktokenCounter(),
    factsAutoRecall: { topK: 5, strategy: everyUserTurn }, // facts surface in the system prompt
    privacy: { providerTrust: 'loopback', providerAcceptsSensitivity: provider.acceptsSensitivity },
  },
  resolveScope: () => scope,
});
await memory.consolidator.start();

const agent = createAgent({
  name: 'local-stack-assistant',
  instructions: 'You are graphorin running on a fully-local stack…',
  provider,
  tools: memory.tools,        // model-driven memory reads/writes
  memory,
  autoAssembleContext: true,  // 6-layer memory-aware system prompt per run
  sessionId,
  userId,
});

// Turn persistence is consumer-emitted (the agent runtime never
// auto-persists): push both sides of the turn, then advance the
// consolidator so facts distill in the background.
await memory.session.push(scope, { role: 'user', content: input });
for await (const ev of agent.stream(input, { sessionId, userId })) {
  if (ev.type === 'text.delta') process.stdout.write(ev.delta);
}
await memory.session.push(scope, { role: 'assistant', content: reply });
await memory.consolidator.trigger({ kind: 'turn', value: turn }, scope);
```

The full source is in [`src/main.ts`](./src/main.ts). The stub provider + stub embedder used by `tests/smoke.test.ts` live in [`src/stub-provider.ts`](./src/stub-provider.ts) and [`src/stub-embedder.ts`](./src/stub-embedder.ts) - both are network-free.

---

## Memory that survives restarts

Graphorin's agent runtime never auto-persists turns (see the quickstart's memory contract) - the example owns all three write paths and both read paths:

- **Session log** - every REPL turn pushes the user line and the assistant reply through `memory.session.push(...)` into the `session_messages` table.
- **Consolidation** - after each turn the example calls `memory.consolidator.trigger({ kind: 'turn' }, scope)`; the `tier: 'cheap'` consolidator distills the session log into semantic facts using the same local LLM. `autoPromoteExtraction: true` (MCON-2 opt-in) admits injection-clean extraction facts as `active` so they surface in default recall - injection-flagged facts still quarantine.
- **Procedural rule** - seeded once per database (startup checks for the exact rule text before calling `procedural.define`, so restarts do not accumulate duplicates).
- **Model-driven access** - `tools: memory.tools` exposes the memory tools to the model.
- **Auto-recall** - `autoAssembleContext: true` + `factsAutoRecall` (with an every-turn trigger strategy) assemble a memory-aware system prompt per run, injecting the top consolidated facts relevant to your message. The context engine's privacy filter is pinned to `providerTrust: 'loopback'` to match the loopback-only daemon - without it, internal-sensitivity facts would be silently dropped from the prompt.

Try it: tell the assistant a fact, `Ctrl+C`, relaunch with the same `GRAPHORIN_DB_PATH`, and ask for the fact back. Inspect the tables directly with `sqlite3 ./.graphorin/local-stack-cli.db 'SELECT COUNT(*) FROM session_messages; SELECT text FROM facts;'`.

---

## Sensitivity defaults: loopback trust = all tiers

graphorin classifies provider endpoints into `loopback` / `private` / `public-tls` / `public-cleartext` (`packages/provider/src/trust/classify-local-provider.ts`). `http://127.0.0.1:11434` is **loopback**, so the framework auto-elects `acceptsSensitivity: ['public', 'internal', 'secret']`. The example pins that array explicitly:

```ts
createProvider(adapter, { acceptsSensitivity: ['public', 'internal', 'secret'] });
```

There is **no first-run sensitivity prompt** for this example - the daemon is on your loopback interface, the operating system already gates loopback to processes on this host, and graphorin's Sensitivity tiering is happy to forward all three classes. If you swap the daemon URL for a non-loopback host (e.g. a colleague's LAN box) the classifier downgrades trust and the `secret` tier falls out of the default - pin the array explicitly to override.

---

## `GRAPHORIN_OFFLINE=1` - proving zero non-loopback packets

The only network calls this example makes are to the configured Ollama daemon (default `http://127.0.0.1:11434`). To prove this, set `GRAPHORIN_OFFLINE=1`. The CLI probes the daemon URL during startup and refuses to launch if it is unreachable:

```bash
GRAPHORIN_OFFLINE=1 pnpm --filter ./examples/local-stack-cli dev
# When Ollama is running:
graphorin v0.13.8 local-stack-cli - recipe='ollama', model='qwen2.5:7b-instruct-q4_K_M'. ...

# When Ollama is NOT running:
[graphorin/example-local-stack-cli] Ollama daemon is not reachable at 'http://127.0.0.1:11434'. Start it with `ollama serve` (and `ollama pull qwen2.5:7b-instruct-q4_K_M && ollama pull nomic-embed-text`) - or unset GRAPHORIN_OFFLINE to surface the underlying network error.
# (exit code 2)
```

You can confirm the example does not phone home in another terminal:

```bash
sudo lsof -i -nP | grep node
# expect to see only TCP traffic to 127.0.0.1:11434 (and SQLite holding a file lock under ./.graphorin/)
```

`GRAPHORIN_OFFLINE=1` flips a single boolean inside [`buildProvider`](./src/main.ts) - the underlying `ollamaAdapter(...)` does the actual chat / embedding HTTP calls and never talks to anything other than the configured `baseUrl`.

---

## Storage layout: per-embedder vec0 tables

`@graphorin/store-sqlite` stores embeddings in a per-embedder vec0 table keyed by `EmbedderProvider.configHash()`. The Ollama embedder folds the served model **digest** into its config hash (`packages/embedder-ollama/src/index.ts → canonicalConfigHash`), so two scenarios are safe by construction:

- **Same embedder, same model, same digest** → rows pile into the same vec0 table; vector search keeps working across runs.
- **Same embedder, *different* model** (e.g. you swap `nomic-embed-text` for `bge-m3`) → graphorin sees a new `configHash`, allocates a fresh vec0 table, and your old vectors keep living in their original table. No silent dimension mismatch.

Try the swap by setting `GRAPHORIN_EMBED_MODEL`:

```bash
ollama pull bge-m3
GRAPHORIN_EMBED_MODEL=bge-m3 pnpm --filter ./examples/local-stack-cli dev
```

If you want to consolidate vectors across embedders later, run `migrateEmbedder(...)` from `@graphorin/memory` - it streams the source table through the new embedder and writes into the destination table.

---

## Trade-off vs in-process llama.cpp

The fully-local recipe in [`examples/personal-assistant-cli` § Local LLM provider](../personal-assistant-cli/README.md#recipe-3--in-process-llamacpp-llamacpp-node) loads a GGUF model **inside the Node process** via `node-llama-cpp`. That recipe wins on single-process latency (no socket roundtrip), loses on durability:

| Concern                              | This example (Ollama)                    | personal-assistant-cli (`llamacpp-node`) |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------- |
| Single-process throughput            | extra HTTP roundtrip (slower)            | direct ffi (faster)                      |
| Durable mid-stream resume            | yes - daemon survives a Node restart     | no - model context lives inside Node     |
| Multi-process sharing                | yes - every shell uses the same daemon   | no - each Node process loads its own GGUF|
| Model swap without restart           | `ollama pull` + `GRAPHORIN_LLM_MODEL=...`| restart Node                             |
| Memory pressure                      | one process holds the model              | every Node process holds a copy          |

If you need durable HITL (`runStateToJSON` round-trips, `agent.abort({ drain: true })` followed by a process restart), prefer this example. If you need the absolute lowest single-turn latency on a single laptop, prefer `llamacpp-node`.

---

## Environment variables

| Variable                     | Default                              | Effect                                              |
| ---------------------------- | ------------------------------------ | --------------------------------------------------- |
| `GRAPHORIN_LLM_RECIPE`       | `ollama`                             | One of `ollama`, `stub`.                            |
| `GRAPHORIN_OLLAMA_BASE_URL`  | `http://127.0.0.1:11434`             | Daemon URL (LLM **and** embedder share this).       |
| `GRAPHORIN_LLM_MODEL`        | `qwen2.5:7b-instruct-q4_K_M`         | Ollama LLM model tag.                               |
| `GRAPHORIN_EMBED_MODEL`      | `nomic-embed-text`                   | Ollama embedding model tag.                         |
| `GRAPHORIN_DB_PATH`          | `./.graphorin/local-stack-cli.db`    | SQLite database path. Use `:memory:` for tests.     |
| `GRAPHORIN_USER_ID`          | `local-operator`                     | Memory scope user id.                               |
| `GRAPHORIN_CONTEXT_WINDOW`   | `32768` (`8192` for `stub`)          | Provider context window (tokens) for auto-compaction. |
| `GRAPHORIN_OFFLINE`          | unset                                | When `1`, probe the daemon URL and fail fast.       |

---

## Project layout

```
examples/local-stack-cli/
├── src/
│   ├── main.ts             # REPL entry + createAssistant({...}) helper
│   ├── stub-provider.ts    # Deterministic Provider (no network)
│   └── stub-embedder.ts    # Deterministic 8-dim Embedder (no network)
├── tests/
│   └── smoke.test.ts       # vitest coverage (stub stack + offline probe)
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## Troubleshooting

- **`Ollama daemon is not reachable at 'http://127.0.0.1:11434'`** - run `ollama serve`, confirm with `curl http://127.0.0.1:11434`, re-run.
- **`/api/show returned 404 for model 'nomic-embed-text'`** - pull the embedder: `ollama pull nomic-embed-text`.
- **`embedding dim drifted: expected 768, got 1024`** - you swapped the embed model mid-database. Either roll back, or `migrateEmbedder(...)` to a fresh vec0 table.
- **`Unknown GRAPHORIN_LLM_RECIPE='...'`** - pick `ollama` or `stub`.
- **`Loopback-only stack` TypeError** - `GRAPHORIN_OLLAMA_BASE_URL` must use hostname `127.0.0.1`, `localhost`, or `::1`. Remote or LAN hosts belong in `examples/personal-assistant-cli`.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.8 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
