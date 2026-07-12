---
title: Minimal profile
description: The scaffold 'minimal' preset, the lean install path, and the README-on-demand skill pattern for cheap always-on agents.
---

# Minimal profile

A proactive assistant runs far more agent invocations than a chat window does: every heartbeat beat and every cron fire is a run. The minimal profile is the cheap-run posture for those invocations - a lean install, a lean per-step context, and a skill pattern that keeps reference material out of the prompt until a run actually needs it.

## The `scaffold: 'minimal'` preset

`createAgent({ scaffold })` takes `'minimal' | 'full'`. `'full'` (the default) is exactly the behaviour every existing agent already has. `'minimal'` composes the cheap posture:

```ts
import { createAgent } from '@graphorin/agent';
import type { Provider } from '@graphorin/core';

declare const provider: Provider; // your cheap model of choice
declare const memoryReadTools: Parameters<typeof createAgent>[0]['tools'];

const heartbeatRunner = createAgent({
  name: 'heartbeat-runner',
  instructions: 'Work through the checklist. Reply HEARTBEAT_OK when nothing needs attention.',
  provider,
  scaffold: 'minimal',
  tools: memoryReadTools,
});
```

What `'minimal'` changes:

- **Instructions-only system prompt.** The prompt is your `instructions` verbatim - no memory context assembly. An explicit `autoAssembleContext: true` alongside `'minimal'` is a config error (fail-fast at `createAgent`), not a silent override.
- **Deferred tool loading by default.** Every registered tool that does not declare `defer_loading` itself is withheld from the per-step catalogue; the catalogue starts at `tool_search` alone and tools surface through promotion when the model searches for them. An explicit `defer_loading: false` on a tool keeps it eager (the per-tool declaration is the stronger signal), and runtime built-ins (`tool_search`, `read_result`) are exempt - deferring the discovery surface itself would be self-defeating.
- **No plan tool, no attention recitation.** `plan: true` alongside `'minimal'` is a config error.

What `'minimal'` deliberately does **not** change: the security layers. Permission mode, sandbox enforcement, taint tracking and the Rule-of-Two evaluate exactly as they do under `'full'` - a cheap run is not a less-guarded run.

Known limitation: the code-mode API projection covers **eager** tools only, so a defer-heavy minimal agent projects a near-empty `code_search` surface (see [Tools](/guide/tools#code-mode)). Prefer direct tool calls over code-mode under the minimal scaffold.

### Curating the toolset

The preset controls the scaffolding, not the tool list - curation is composition. For proactive runners the recommended set is the read-only subset of the memory tools (`fact_search`, `recall_episodes`, `conversation_search`, `fact_history`, `fact_validate`): the run can consult memory but cannot write it, which composes with the [memory-writes-after-guardrails invariant](/guide/security#memory-writes-strictly-after-guardrails-b3). A dedicated `buildMemoryTools` profile option ships with the memory wave; until then pass the read tools explicitly.

## Lean install path

The minimal profile pairs with a minimal dependency footprint. The default embedder (`@graphorin/embedder-transformersjs`) pulls roughly 350 MB of native runtime (`onnxruntime-node`, `sharp`) for fully in-process embeddings; both alternatives keep the install near the 58 MB framework baseline:

- **`@graphorin/embedder-ollama`** - if a local [Ollama](https://ollama.com) daemon runs anyway, embeddings ride it and the native stack never installs.
- **Embedder-less** - a bot that only needs the agent loop, sessions and FTS-backed recall can skip the embedder entirely: `createSqliteStore` works without `sqlite-vec` (`skipSqliteVec: true`), and memory search degrades to FTS5.

See [Installation](/guide/installation#quickest-install-memory-backed-local-assistant) for the package matrix.

## Skill pattern: a CLI tool with a README on demand

A recurring minimal-profile need: the agent wraps a CLI tool whose full manual is long, but the manual only matters in the rare run that actually uses the tool. The pattern:

1. The skill declares the tool with a **one-line description** - that is all the model sees in the catalogue (and under the minimal scaffold, only after `tool_search` promotes it).
2. The full manual rides as a **skill resource** (for example `resources/MANUAL.md` next to `SKILL.md`).
3. Nothing reads the manual at load time: `Skill.resources()` returns **lazy accessors** - listing reads zero file bytes; the content loads only at `readText()`.

```ts
import { loadSkillFromSource } from '@graphorin/skills';

const skill = await loadSkillFromSource({ kind: 'folder', path: './skills/backup-cli' });

// Lazy listing - no file bodies are read here.
const resources = await skill.resources();
const manual = resources.find((r) => r.relativePath.endsWith('MANUAL.md'));

// The bytes load only when a run actually needs the reference -
// typically inside a tool the model calls on demand.
const manualText = await manual?.readText();
```

Wire the on-demand read as a tool (`read_manual`), or fold it into the CLI tool's error path ("on unknown flag, return the relevant manual section"). Either way the manual costs zero context until the run genuinely needs it.

The [`tools-harness-tour` example](https://github.com/o-stepper/graphorin/tree/main/examples/tools-harness-tour) demonstrates the pattern end to end: its `offline-notes` skill bundles `resources/MANUAL.md`, and stage 3 of the tour reads it through the lazy accessor.

## Where it is used

The proactivity primitives default to this posture: heartbeat runs execute on a cheap isolated profile, and the cron-leg composes its curated no-scheduling toolset with the minimal scaffold - see the [proactivity guide](/guide/proactivity).
