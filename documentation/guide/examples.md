---
title: Examples
description: End-to-end example apps that exercise Graphorin against a deterministic stub provider so CI never needs a live LLM. Every example is shipped in the repository.
---

# Examples

Eleven end-to-end example apps live in [`examples/`](https://github.com/o-stepper/graphorin/tree/main/examples) inside the repository. Every example builds, tests, and runs against a deterministic in-tree **stub provider** so CI never depends on a live LLM.

::: tip Run any example
From the repository root:

```bash
pnpm install
pnpm --filter ./examples/<name> build
pnpm --filter ./examples/<name> test
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/<name> dev
```
:::

## `personal-assistant-cli`

A 30-minute hands-on tour through Graphorin - wire `createAgent({...})` to a six-tier `Memory` backed by SQLite + local embeddings, hook it up to one of three opt-in local-LLM stacks, and stream a real conversation through your terminal.

- Recipes: `stub`, `ollama`, `llamacpp-server`, `llamacpp-node`.
- Demonstrates: agent loop, memory, sensitivity gating, durable HITL, the `GRAPHORIN_OFFLINE=1` contract.
- Source: [`examples/personal-assistant-cli/`](https://github.com/o-stepper/graphorin/tree/main/examples/personal-assistant-cli).

## `multi-agent-crew`

A supervisor + two-workers acceptance demo. Wires `createAgent({ handoffs: [...] })` so the agent runtime auto-generates `transfer_to_<worker>` tools, emits a `HandoffRecord` per transfer, and lets one shared session reconstruct the full multi-agent conversation from JSONL export.

- Demonstrates: handoffs, agent registry, multi-agent attribution, JSONL export, replay.
- Source: [`examples/multi-agent-crew/`](https://github.com/o-stepper/graphorin/tree/main/examples/multi-agent-crew).

## `three-agent-harness`

A three-agent crew driving the `evaluatorOptimizer({...})` loop with a typed Zod rubric. Runs the generator → evaluator iteration with a strict iteration cap and a deterministic stub.

- Demonstrates: evaluator-optimizer, rubric kinds, iteration capping.
- Source: [`examples/three-agent-harness/`](https://github.com/o-stepper/graphorin/tree/main/examples/three-agent-harness).

## `approval-workflow`

A durable HITL workflow built on `@graphorin/workflow`. The flow validates an order, pauses for human approval (`pause(...)`), and ships once the approver resumes the thread - even on a different process. A second, compact settlement workflow shows the durable primitives: the thread parks on a `sleepFor(...)` timer, `createTimerDriver` fires it, the thread parks again on an `awaitExternal(...)` awakeable, and `resolveAwakeable(...)` completes it - every park crossing a simulated restart.

- Demonstrates: durable workflow, `pause(value)` / `resume(directive)`, checkpoint store, durable timers (`sleepFor` + `createTimerDriver`), awakeables (`awaitExternal` / `resolveAwakeable`).
- Source: [`examples/approval-workflow/`](https://github.com/o-stepper/graphorin/tree/main/examples/approval-workflow).

## `document-pipeline`

A document-ingestion pipeline that fans out work via `Dispatch(...)` across parallel workflow tasks and merges the results into the semantic memory tier.

- Demonstrates: dynamic parallelism, `Dispatch`, channel kinds, memory writes.
- Source: [`examples/document-pipeline/`](https://github.com/o-stepper/graphorin/tree/main/examples/document-pipeline).

## `background-consolidator`

Drives `@graphorin/memory`'s background consolidator across a long-running session. Demonstrates the per-tier ceiling and the `tier: 'cheap'` upgrade.

- Demonstrates: consolidator phases, cost budget, `CONSOLIDATOR_TIER_DEFAULTS`.
- Source: [`examples/background-consolidator/`](https://github.com/o-stepper/graphorin/tree/main/examples/background-consolidator).

## `slack-bot-integration`

An adapter sketch showing how to mount Graphorin as the brain behind a Slack bot - without making channel adapters part of the framework. The Slack bot is the consumer; Graphorin emits typed events the bot turns into messages.

- Demonstrates: library-mode embedding, event-driven UI, sensitivity-aware payload filtering.
- Source: [`examples/slack-bot-integration/`](https://github.com/o-stepper/graphorin/tree/main/examples/slack-bot-integration).

## `tools-harness-tour`

A guided tour of the tools harness, fully offline: an in-process MCP server adapted through `@graphorin/mcp` into the tool registry, a folder skill loaded and stamped with untrusted defaults, a deferred tool found via the built-in `tool_search`, one `code_execute` call chaining tools inside the sandbox, and a >100 KB result spilling to a handle that `read_result` pages back byte-exact.

- Demonstrates: MCP client + `toTools`, skills loader, `defer_loading` + `tool_search`, code mode, spill + `read_result` paging.
- Source: [`examples/tools-harness-tour/`](https://github.com/o-stepper/graphorin/tree/main/examples/tools-harness-tour).

## `memory-graph-recall`

The memory deep-dive: an entity graph over SQLite recalls a fact reachable only through an entity hop (`expandHops: 1`), iterative deep recall grades its own evidence and abstains on an unanswerable question, a synthesized fact lands quarantined and becomes recallable after `validate`, and the insights read tier surfaces a reflection-shaped insight - all on a scripted stub provider and a deterministic hash embedder.

- Demonstrates: entity graph + hop recall, graded deep recall with abstention, quarantine / `validate`, insights read tier.
- Source: [`examples/memory-graph-recall/`](https://github.com/o-stepper/graphorin/tree/main/examples/memory-graph-recall).

## `secure-replay-agent`

The security and replay showcase: the same scripted agent flow runs three times to show `dataFlowPolicy` in shadow (sink allowed, violation audited), enforce (sink blocked with `dataflow_policy_blocked`), and enforce with a declassified sink; prompt-cache anchors flow through `Usage` cache legs; `recordProviderResponses` + `createReplayProvider` re-drive the run offline with an identical transcript; and a `toTool` sub-agent under `capability: 'read-only'` blocks its writer tool.

- Demonstrates: `dataFlowPolicy` shadow -> enforce -> declassify, `cachePolicy` anchors, deterministic replay, read-only sub-agents.
- Source: [`examples/secure-replay-agent/`](https://github.com/o-stepper/graphorin/tree/main/examples/secure-replay-agent).

## `local-stack-cli`

A single-binary CLI that wires the standalone server, the triggers daemon, the encrypted-file secrets store, and a couple of skills into a turnkey local stack - useful as a starting point for production-shaped local deployments.

- Demonstrates: standalone server, `graphorin doctor`, `graphorin secrets`, triggers, skills.
- Source: [`examples/local-stack-cli/`](https://github.com/o-stepper/graphorin/tree/main/examples/local-stack-cli).

## Tracing across every example

Set `GRAPHORIN_TRACE=console` to print finished spans from `@graphorin/observability` to your terminal:

```bash
GRAPHORIN_TRACE=console GRAPHORIN_LLM_RECIPE=stub \
  pnpm --filter ./examples/personal-assistant-cli dev
```

The shared helper `examples/example-trace-helper/` wires the console exporter consistently across the eleven apps.

## Production deployment templates

Four deployment templates live alongside the examples - they're not standalone apps, but reference manifests for shipping the standalone server:

- [`examples/systemd/`](https://github.com/o-stepper/graphorin/tree/main/examples/systemd) - hardened systemd unit.
- [`examples/docker/`](https://github.com/o-stepper/graphorin/tree/main/examples/docker) - hardened multi-stage Dockerfile.
- [`examples/k8s/`](https://github.com/o-stepper/graphorin/tree/main/examples/k8s) - Kubernetes manifest set.
- [`examples/github-actions/`](https://github.com/o-stepper/graphorin/tree/main/examples/github-actions) - release + security workflow templates for downstream apps.

## Next steps

- [Quickstart](/guide/quickstart) - the 20-line minimum end-to-end script.
- [Standalone server](/guide/standalone-server) - promote your assistant to a daemon.
- [Deployment](/guide/deployment) - production checklists.

