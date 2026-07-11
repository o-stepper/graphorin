# secure-replay-agent

> A **security + replay** showcase for **graphorin** - one offline flow that walks `dataFlowPolicy` from shadow to enforce (and through the audited `declassifySinks` escape hatch), surfaces prompt-cache legs from `cachePolicy: { breakpoints: 'auto' }`, replays a recorded run deterministically via `createReplayProvider(state)`, and runs a read-only sub-agent through `Agent.toTool({ capability: 'read-only' })` - all driven by a hand-rolled scripted stub `Provider`.

This example demonstrates the part of an agent stack that is hardest to test against a live model: the *lethal trifecta*. When untrusted content (a prompt injection hidden in a fetched page), secret-tier data (a vault credential), and an exfiltration sink (`send_message`) meet in one run, an injected instruction can drive the sink. graphorin's provenance-based data-flow policy gates that flow at the tool-executor boundary - and because every stage here is scripted, the attack, the audit trail, the block, and the declassification are all reproduced byte-for-byte on every run.

CI exercises the whole flow against the deterministic stub provider - no API keys, no daemon, no network - so the smoke suite stays well under 30 seconds.

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).

No model, no daemon, no API key: the scripted stub provider is the only "LLM" this example ever talks to.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/secure-replay-agent build
pnpm --filter ./examples/secure-replay-agent test
```

Run the showcase:

```bash
pnpm --filter ./examples/secure-replay-agent dev
```

Expected output:

```
graphorin v0.8.0 secure-replay-agent - offline security+replay showcase (scripted stub provider, zero network).
stage 1 stub-provider: status=completed, turns=1, reply='scripted stub reply: zero network, fully deterministic.'
stage 2a dataflow shadow: sink ran=yes (audit-only), flagged=1, flow=untrusted-to-sink, counter-delta=1.
stage 2b dataflow enforce: sink blocked - send_message failed kind=dataflow_policy_blocked, flow=untrusted-to-sink, dispatched=0.
stage 2c dataflow declassify: sink allowed under enforce via declassifySinks, declassified=1, blocked=0.
stage 3 cache-anchors: anchored-requests=2, cacheWriteTokens=512, cachedReadTokens=512.
stage 4 replay: identical (recorded-steps=2, transcript-messages=5).
stage 5 read-only-child: writer delete_note blocked kind=capability_blocked ran=no, reader read_note ran=yes, parent=completed.
secure-replay-agent: OK shadowViolations=1 enforceBlocked=yes declassifiedPass=yes cacheRead=512 cacheWrite=512 replayIdentical=yes childBlocked=yes
```

---

## Stage 1 - the scripted stub provider

`src/scripted-provider.ts` is a hand-rolled `Provider` (both `stream(...)` and `generate(...)`) that serves pre-scripted turns - each turn is a tool-call batch and/or a text reply plus an optional `Usage` record:

```ts
const stub = createScriptedProvider([
  { toolCalls: [{ toolCallId: 'df-1', toolName: 'fetch_advisory', args: {} }] },
  { text: 'advisory processed.' },
]);

const agent = createAgent({
  name: 'demo',
  instructions: 'You are the demo agent.',
  provider: createProvider(stub, { acceptsSensitivity: ['public', 'internal', 'secret'] }),
  tools: [...],
});
```

Two details keep the stub honest:

1. **Transcript invariant.** Every request is checked for well-formedness (every announced `toolCallId` resolved by a later tool message, no orphan tool messages) - the same 400-class validation real providers enforce, so a loop regression fails loudly instead of silently.
2. **Request capture.** The stub records every `ProviderRequest` it serves, which is how stage 3 *proves* the agent forwarded `cachePolicy` on the wire instead of just asserting a config field.

---

## Stage 2 - dataFlowPolicy: shadow, enforce, declassify

Three fixture tools reproduce the trifecta:

| Tool                | Registration                                            | Role in the trifecta            |
| ------------------- | ------------------------------------------------------- | ------------------------------- |
| `fetch_advisory`    | `__source: { kind: 'mcp', ... }` => trust class `mcp-derived` | untrusted content (injection)   |
| `read_vault_secret` | `sensitivity: 'secret'`                                 | secret-tier data                |
| `send_message`      | `sideEffectClass: 'external-stateful'`                  | the sink                        |

The scripted "model" fetches the advisory, reads the secret, then forwards the injected span **verbatim** into the sink's arguments. The same script runs three times under different policies:

```ts
const agent = createAgent({
  // ...
  dataFlowPolicy: { mode: 'shadow' },                                    // 2a: audit-only
  dataFlowPolicy: { mode: 'enforce' },                                   // 2b: block
  dataFlowPolicy: { mode: 'enforce', declassifySinks: ['send_message'] }, // 2c: audited escape
});
```

- **Shadow (2a)** - the sink RUNS (a recorder proves it), but the flow is flagged: a `tool:dataflow:flagged` audit row (observed via `onToolAudit(...)` from `@graphorin/tools/audit`) and a `tool.dataflow.decision.total{decision=flag,...}` counter increment. Ship shadow first to size false positives against real traffic.
- **Enforce (2b)** - the sink is blocked: its body never executes and the call fails with `ToolError.kind === 'dataflow_policy_blocked'` (surfaced on the run state and as a `tool.execute.error` event). The run itself still completes - the model sees the tool error and moves on.
- **Declassify (2c)** - `declassifySinks: ['send_message']` is the explicit, audited operator override: the tainted flow into that specific sink is allowed even under enforce, and audited as `tool:dataflow:declassified`.

Because the sink arguments carry the untrusted span verbatim, the reported flow is the precise `untrusted-to-sink` signal; had the model paraphrased, the conservative `lethal-trifecta` leg (untrusted + secret both present) would still gate the call.

The untrusted fixture pins `inboundSanitization: 'pass-through'` so the injected span survives byte-intact; the subject under demo is the taint ledger, not the sanitizer (whose `mcp-derived` default would redact the imperative phrasing).

---

## Stage 3 - cachePolicy anchors + cache legs from Usage

The agent is created with `cachePolicy: { breakpoints: 'auto' }`, which graphorin forwards verbatim on every `ProviderRequest`. The stub reports a cache **write** leg on step 1 (stable prefix written) and a cache **read** leg on step 2 (prefix served from cache) - but only when the anchor policy actually arrives on the request:

```ts
const agent = createAgent({
  // ...
  cachePolicy: { breakpoints: 'auto' },
});
const result = await agent.run('what shipped in the latest release?');
result.usage.cacheWriteTokens; // 512 - accumulated across steps
result.usage.cachedReadTokens; // 512
```

With a real Anthropic-path adapter the same two `Usage` fields are filled by the provider; prompt-cache hit rate is the #1 production cost lever for multi-step agents.

---

## Stage 4 - deterministic replay

`recordProviderResponses: true` journals each step's raw model response onto `RunState.steps[].providerResponse`. `createReplayProvider(state)` then serves those journaled responses back in order - re-running the same input reproduces the run with **zero live model calls**:

```ts
const original = await recorder.run(input); // recorder: recordProviderResponses: true

const replayer = createAgent({
  // same instructions + tools ...
  provider: createReplayProvider(original.state),
});
const replayed = await replayer.run(input);
// transcripts match: role + content + tool calls, message for message
```

The example compares the provider-visible transcript projection (role, content, tool calls; the per-instance random `agentId` stamp is excluded) and prints `replay: identical`. The replay provider is strict by design: it throws if the state carries no journal, and emits an error event if the replayed run asks for more steps than were recorded - a divergence should fail loudly, not hallucinate.

---

## Stage 5 - read-only sub-agent

The parent invokes an `archivist` child through the sub-agent tool surface with a capability floor:

```ts
const parent = createAgent({
  // ...
  tools: [child.toTool({ name: 'fetch_note_via_child', capability: 'read-only' })],
});
```

`'read-only'` builds a side-effect-free child by construction: writer tools are never advertised to the child's model, and the executor deterministically blocks any writer call the model fabricates anyway. The scripted child calls its writer first - blocked with `ToolError.kind === 'capability_blocked'`, body never runs - then its read-only tool, which works. The parent observes the child's lifecycle through the forwarded `subagent.event` wrapper in its own stream. This is the single-writer constraint from multi-agent practice: fan out read-only workers while exactly one agent keeps write capability.

---

## Project layout

```
examples/secure-replay-agent/
├── src/
│   ├── main.ts               # five stages + runSecureReplayShowcase({...}) + CLI entry
│   ├── scripted-provider.ts  # hand-rolled deterministic Provider (stream + generate)
│   └── tools.ts              # fixture tools: untrusted mcp-derived, secret, sink, reader/writer
├── tests/
│   └── smoke.test.ts         # vitest coverage (exit code, audits, block kinds, replay, capability)
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

## Troubleshooting

- **`scripted provider exhausted after N turn(s)`** - the scripted turns and the agent loop fell out of lockstep; every tool-call turn must be followed by enough turns to finish the run.
- **`secure-replay-agent: FAIL ...`** - a stage invariant regressed; the per-stage lines above the summary identify which one (each prints its own evidence).
- **`replay exhausted after N recorded step(s)`** - the replayed run diverged from the journal; make sure the replay agent uses the same instructions, tools, and input as the recording run.
- **A `dataFlowPolicy` warning about the lethal-trifecta leg** - the policy is enabled but no registered tool declares `sensitivity: 'secret'`; tag your private-data tools or widen `sensitiveTiers`.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.8.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
