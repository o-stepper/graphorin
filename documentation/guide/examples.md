---
title: Examples
description: End-to-end example apps that exercise Graphorin against a deterministic stub provider so CI never needs a live LLM. Every example is shipped in the repository.
---

# Examples

Thirteen end-to-end example apps live in [`examples/`](https://github.com/o-stepper/graphorin/tree/main/examples) inside the repository. Every example builds, tests, and runs against a deterministic in-tree **stub provider** so CI never depends on a live LLM.

::: tip Run any example
From the repository root:

```bash
pnpm install
pnpm --filter ./examples/<name> build
pnpm --filter ./examples/<name> test
GRAPHORIN_LLM_RECIPE=stub pnpm --filter ./examples/<name> dev
```
:::

`pnpm smoke-examples` runs the whole set (including the security-flavoured
`secure-replay-agent`). Audits that must not execute security samples can skip
named examples officially: `pnpm smoke-examples --exclude secure-replay-agent`
(repeatable / comma-separated, or `GRAPHORIN_SMOKE_EXCLUDE=a,b`); every
exclusion is printed so a partial run never reads as full coverage.

## `assistant-bot`

The official whole-bot recipe: one long-living personal assistant composed from every framework leg. Facts ingested into memory answer a later question arriving through the channels front door (pairing challenge included), a REST run parks on a `needsApproval: true` tool and resumes through `POST /v1/runs/:runId/resume`, a heartbeat beat delivers a `notify` outcome, and one session exports the whole conversation as JSONL - all against the in-process hono app (`skipListen: true`), no sockets.

- Demonstrates: the composition of `createAgent` + typed tools (HITL gate), `createMemory` auto-recall (`autoAssembleContext` + `factsAutoRecall`), sessions + JSONL export, the server HITL loop over REST with token auth, `createHeartbeat` proactivity, and the channels front door (pairing, sanitization, taint seed, identity routing).
- Source: [`examples/assistant-bot/`](https://github.com/o-stepper/graphorin/tree/main/examples/assistant-bot).

## `personal-assistant-cli`

A 30-minute hands-on tour through Graphorin - wire `createAgent({...})` to a six-tier `Memory` backed by SQLite + local embeddings, hook it up to one of three opt-in local-LLM stacks, and stream a real conversation through your terminal.

- Recipes: `stub`, `ollama`, `llamacpp-server`, `llamacpp-node`.
- Demonstrates: agent loop, per-turn memory persistence + consolidator turn triggers, `factsAutoRecall` + `autoAssembleContext`, sensitivity gating, the `GRAPHORIN_OFFLINE=1` contract.
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

A server-mode acceptance demo that mounts Graphorin as the brain behind a Slack bot - without making channel adapters part of the framework. `startSlackBotApp` binds a real HTTP listener; inbound webhook payloads are HMAC-verified before they reach the agent, the reply streams back to Slack as typed agent events turned into `chat.postMessage` calls, and a high-amount expense suspends the run on a durable HITL approval that survives a process restart.

- Demonstrates: real webhook listener, HMAC-SHA256 signature verification, typed-event streaming replies, durable HITL approval across restart.
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

## `structured-verifier`

The structured-output contract end-to-end: one extraction agent declares a CLOSED wire `jsonSchema` (mapped to strict `response_format: json_schema` by native adapters), a zod `schema` parse gate that fails a violating draft with the typed `output-validation-failed` error, and a deterministic `ResponseVerifier` that bounces a placeholder draft back to the model for exactly one bounded continuation round - the smoke tests also pin that the schema is forwarded on EVERY provider call.

- Demonstrates: `outputType: { kind: 'structured' }` (wire schema + local parse gate), `verifiers` + `maxVerifierRounds`, both typed failure modes.
- Source: [`examples/structured-verifier/`](https://github.com/o-stepper/graphorin/tree/main/examples/structured-verifier).

## `local-stack-cli`

A fully-local REPL assistant: an Ollama-served LLM, an Ollama-served embedder, and SQLite + sqlite-vec on disk - zero non-loopback packets, provable with `GRAPHORIN_OFFLINE=1`. Every turn is persisted through `memory.session.push(...)` and a consolidator turn trigger distills facts in the background, so a fact taught in one session is recalled in the next.

- Demonstrates: Ollama provider + embedder, per-turn session persistence, consolidator turn triggers, `factsAutoRecall` + `autoAssembleContext`, the `GRAPHORIN_OFFLINE=1` contract.
- Source: [`examples/local-stack-cli/`](https://github.com/o-stepper/graphorin/tree/main/examples/local-stack-cli).

## Tracing across every example

Set `GRAPHORIN_TRACE=console` to print finished spans from `@graphorin/observability` to your terminal:

```bash
GRAPHORIN_TRACE=console GRAPHORIN_LLM_RECIPE=stub \
  pnpm --filter ./examples/personal-assistant-cli dev
```

The shared helper `examples/example-trace-helper/` wires the console exporter consistently across the thirteen apps.

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

