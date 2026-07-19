---
title: Proactivity
description: Heartbeat and cron-leg primitives, the notify/question/review/act escalation ladder, act grants, budgets and active hours.
---

# Proactivity

`@graphorin/proactive` is the layer that lets a personal assistant act on a schedule instead of only answering. It ships two deliberately separate primitives - a **heartbeat** and **cron-leg tasks** - both emitting the same typed escalation ladder, both riding the durable [trigger scheduler](/guide/standalone-server#triggers), and both built around a cheap-run cost posture.

Single-process by design: schedules persist in the SQLite trigger store, which is single-process. Run one proactive process per store.

## Heartbeat vs cron-leg

The two primitives answer different questions and are deliberately not merged:

| | Heartbeat | Cron-leg task |
|---|---|---|
| Question | "Is anything worth telling the user *right now*?" | "Run this specific job on this schedule." |
| Agenda | A live `checklist()` the bot recomputes per beat | A fixed `prompt` per task |
| Empty agenda | Skips before any model call | Always fires |
| All-quiet reply | Sentinel-suppressed (`HEARTBEAT_OK`) | A completed fire delivers its text |
| Outcome rungs | `notify` only | The full ladder, capped by the task's `grant` |
| Session | Isolated per beat (configurable) | Always fresh per fire |

## Heartbeat

```ts no-check
import { createHeartbeat } from '@graphorin/proactive';

const heartbeat = createHeartbeat({
  agent: heartbeatAgent, // a DEDICATED cheap agent (scaffold: 'minimal')
  scheduler,
  schedule: { every: 30 * 60 * 1000, jitterMs: 60_000 },
  checklist: async () => (await listDueReminders()).join('\n') || null,
  sentinel: 'HEARTBEAT_OK',
  profile: {
    provider: cheapModel, // fail-closed per-beat model pin
    budgetUsd: 0.05, // per-beat run budget
    isolatedSession: true, // fresh session per beat (default)
  },
  activeHours: { from: '08:00', to: '23:00', timezone: 'Europe/Kyiv' },
  runGate: () => interactiveAgent.isBusy(),
  onOutcome: async (o) =>
    gateway.deliver({ identity: owner, text: o.text }),
});
await heartbeat.start();
```

Semantics, in evaluation order per fire:

1. **Active hours** - outside the window the beat skips (`inactive-hours`). The window is a daily wall-clock range in an IANA timezone (default UTC - deliberately not the server's local zone); `from > to` crosses midnight.
2. **Busy deferral** - when the gate reports busy, the beat defers and retries every `deferMs` (default 30s), giving up with a WARN after `maxDefers` (default 10) consecutive deferrals. The default gate is `agent.isBusy()` on the heartbeat's own agent; point `runGate` at the interactive runner so a beat never talks over a live conversation - an internal mutex could only see runs the heartbeat itself started.
3. **Checklist** - `null` / empty / whitespace skips before any model call. An empty agenda must cost nothing.
4. **The run** - executes on the beat profile: fresh session id (or a real session when a `SessionManager` is supplied), the pinned provider, and the per-beat [run budget](/guide/agent-runtime#run-budget) with `onExceed: 'stop'` (a budget-cut beat is counted as a failure, never delivered as a finding).
5. **Sentinel suppression** - every occurrence of the sentinel is stripped; when what remains is shorter than `minOutcomeLength` (default 8), nothing is delivered (`sentinel` / `below-min-length` skips). A real finding becomes a `notify` outcome.

`heartbeat.status()` surfaces counters (beats, outcomes, failures, defers, per-reason skips) for health wiring, and `heartbeat.beat()` fires one beat manually.

## Cron-leg tasks

```ts no-check
import { createProactiveCronTask } from '@graphorin/proactive';

const nightly = createProactiveCronTask({
  id: 'nightly-review',
  agent: taskAgent, // DEDICATED agent; toolset curated by construction
  scheduler,
  schedule: { cron: '0 3 * * *', timezone: 'Europe/Kyiv', jitterMs: 120_000 },
  prompt: 'Review yesterday and draft the morning brief.',
  provider: cheapModel, // REQUIRED fail-closed pin
  grant: 'review',
  budget: { maxCostUsd: 0.1 },
  onOutcome: async (o) =>
    gateway.deliver(outcomeToDelivery(o, owner)),
});
await nightly.start();
```

Every fire creates a **fresh session** and runs on a **required, fail-closed model pin**: the run resolves to exactly the task's `provider`, winning over `prepareStep` overrides and the whole preference ladder, and the agent-level fallback chain is never consulted - a 03:00 fire must not silently escalate to a more expensive model because the cheap one rate-limited.

**No recursive scheduling.** A proactive run must not register triggers or schedules. The primary enforcement is by construction - dedicate an agent whose toolset simply has no scheduling tools - and `schedulingToolNames` adds a deterministic creation-time check: any listed name reachable from the task's agent registry throws `ProactiveConfigError` unless `allowRecursiveScheduling: true` grants it explicitly. [Deny-by-name rules](/guide/security#deny-by-name-three-surfaces) (shipped in 0.9.0) compose as a third, policy-driven layer on top.

## The escalation ladder

Every fire ends in exactly one rung of the typed `ProactiveOutcome` union from `@graphorin/core` - `notify < question < review < act` (the frozen `PROACTIVE_OUTCOME_LADDER`):

- **`notify`** - fire-and-forget delivery. The default and the floor.
- **`question`** - the task needs user input; the run parked on a read-only gated tool.
- **`review`** - the task proposes an action and parked on a **writer** gated tool (`needsApproval`); nothing has happened yet.
- **`act`** - side effects already happened inside the run, on the task's own authority.

A task declares its maximum rung once: `grant` (default `'notify'`). The grant maps onto existing deterministic machinery rather than new enforcement code:

| Grant | Mechanism |
|---|---|
| `notify` / `question` | The fire runs `capability: 'read-only'` - writer tools are never advertised and the executor blocks fabricated writer calls. Acting is impossible by construction. |
| `review` | Full capability; writer tools carry `needsApproval` (bot config), so proposals park on the existing durable HITL instead of executing. |
| `act` | Full capability, plus the fail-closed config gate below. |

A run that escalates **above** its grant (e.g. a `notify` task parks on a gated tool) is settled fail-closed: every pending approval is auto-denied, nothing is delivered, and the fire reports `escalationBlocked`.

### The `act` grant is gated on the ingest gate

`grant: 'act'` requires evidence that the [memory ingest gate](/guide/memory-system#the-ingest-gate-memory-writes-strictly-after-guardrails) is active: pass the memory facade and the runner checks `memory.ingestGate !== null` (`createMemory({ ingestGate })`). Without it, task creation throws `ProactiveConfigError` (`act-requires-ingest-gate`). The rule exists because an auto-acting task writes its own consequences back into memory - exactly the loop the ingest gate breaks for guardrail-blocked turns; see the [security guide](/guide/security#memory-writes-strictly-after-guardrails). Enable `act` only after the ladder has run on notify-only for a while.

### Routing outcomes

`outcomeToDelivery(outcome, identity)` shapes any outcome into a [channel gateway](/guide/channels) delivery payload: `notify` / `act` become plain text; `question` / `review` carry the HITL question block (`prompt`, keyboard `options`, and the opaque resolve `ref`) that a messenger renders as buttons.

Two ref families ride the same callback-data slot:

- **`run:<runId>:<toolCallId>`** (`serializeApprovalRef` / `parseApprovalRef`) - an agent run parked on approvals. The messenger resolves it through `POST /v1/runs/:runId/resume` with `{ approvals: [{ toolCallId, granted }] }` - the endpoint re-enters the real agent loop (see the [server reference](/guide/standalone-server#rest-surface)).
- **`wf:<workflowId>:<threadId>:<name>`** (`serializeAwakeableRef` from `@graphorin/workflow`) - a task parked inside a durable workflow (`workflowAwakeableOutcome` builds these). Resolved through the existing `POST /v1/workflows/:id/resume`; the [workflow timer daemon](/guide/workflow-engine) keeps ticking parked threads - the proactive layer composes with it, never re-hosts it.

For the agent family, bridge parked fires into the server so REST can find them: pass `suspendedRuns: server.runs` to the task and register the dedicated agent under `registryAgentId` (default `proactive-<taskId>`) in `server.agents`. Avoid `:` inside registry agent ids - it is the scope-segment separator in `agents:invoke:<id>`.

## Budgets

Proactive spend is bounded at three layers:

1. **Per-fire run budget** - `profile.budgetUsd` / `budget.maxCostUsd` (+ `maxTokens`) pass through to the agent's [run-level budget](/guide/agent-runtime#run-budget) with `onExceed: 'stop'`; sub-agent usage counts. The cost leg needs USD-priced usage (pricing middleware); `maxTokens` works everywhere.
2. **Fail-closed model pin** - the fire cannot silently escalate to a pricier model through fallback.
3. **Scheduler harness** - the [interval floor, declaration cap, deterministic jitter and auto-expiry](/guide/standalone-server#scheduler-harness-for-proactive-fleets) bound how often anything fires at all; heartbeat and cron schedules pass `jitterMs` / `expiresAt` straight through. Note the floor also applies to the heartbeat example above: with the harness enabled, a dev-speed beat faster than the floor (for example `every: 300` in a test) makes `scheduler.register` throw `TriggerLimitError('interval-floor')` - pass `intervalFloorMs: 0` in the harness limits for tests, or keep dev beats at or above the floor.

## Cost posture

Pair the runners with [`scaffold: 'minimal'`](/guide/minimal-profile) on the dedicated agents: instructions-only prompt, defer-loaded tools, no plan recitation. A beat that finds nothing then costs one short model call - and an empty checklist costs zero.

## Limitations

- **Single-process** - the SQLite trigger store supports one scheduler process; run one proactive host per store.
- **Durable resume** - `POST /v1/runs/:runId/resume` resumes suspensions retained by the server tracker (including bridged proactive fires). Since migration 038 an agent park survives a server restart: the tracker mirrors it into the `suspended_runs` sidecar and boot hydration re-registers it, so the messenger's approve button keeps working after a redeploy. The library-side path (`agent.run(savedState, { directive })` over the agent's own `CheckpointStore`) remains for custom agents that ship no `serializeState`/`deserializeState` codec.
- **One run per instance** - dedicate agent instances to the heartbeat and to each task; `Agent.isBusy()` and the busy gate exist precisely because instances are single-run.
