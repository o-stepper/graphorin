[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / CreateProactiveCronTaskOptions

# Interface: CreateProactiveCronTaskOptions\&lt;TDeps\&gt;

Defined in: [packages/proactive/src/cron-task.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L109)

Options for [createProactiveCronTask](/api/@graphorin/proactive/functions/createProactiveCronTask.md).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activehours"></a> `activeHours?` | `readonly` | [`ActiveHours`](/api/@graphorin/proactive/interfaces/ActiveHours.md) | Daily window in which fires may run. Absent = always. | [packages/proactive/src/cron-task.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L145) |
| <a id="property-agent"></a> `agent` | `readonly` | [`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `string`\&gt; | The dedicated agent every fire runs on. BY-CONSTRUCTION contract: its toolset must not carry trigger-registering tools (see `schedulingToolNames`), and it should be a separate instance from the interactive agent (one run per instance). | [packages/proactive/src/cron-task.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L118) |
| <a id="property-allowrecursivescheduling"></a> `allowRecursiveScheduling?` | `readonly` | `boolean` | Explicit recursive-scheduling grant. Default `false`. | [packages/proactive/src/cron-task.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L163) |
| <a id="property-budget"></a> `budget?` | `readonly` | `Pick`\&lt;[`RunBudget`](/api/@graphorin/agent/interfaces/RunBudget.md), `"maxCostUsd"` \| `"maxTokens"`\&gt; | Per-fire run budget (C5). `onExceed` is pinned to `'stop'`. | [packages/proactive/src/cron-task.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L143) |
| <a id="property-grant"></a> `grant?` | `readonly` | [`ProactiveOutcomeKind`](/api/@graphorin/core/type-aliases/ProactiveOutcomeKind.md) | Maximum escalation rung (default `'notify'`). `'notify'` / `'question'` fires run `capability: 'read-only'` - side effects are impossible by construction. `'act'` additionally requires `memory` with an ACTIVE ingest gate (B3) - fail-closed config check. | [packages/proactive/src/cron-task.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L135) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Task identity: the trigger id and the outcome `taskId`. | [packages/proactive/src/cron-task.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L111) |
| <a id="property-memory"></a> `memory?` | `readonly` | [`MemoryIngestGateEvidence`](/api/@graphorin/proactive/interfaces/MemoryIngestGateEvidence.md) | Evidence for the `'act'` grant: the memory facade whose `ingestGate` is non-null (`createMemory({ ingestGate })`). Ignored for lower grants. | [packages/proactive/src/cron-task.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L141) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | [packages/proactive/src/cron-task.ts:183](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L183) |
| <a id="property-onoutcome"></a> `onOutcome?` | `readonly` | (`outcome`) => `void` \| `Promise`\&lt;`void`\&gt; | Observer for ladder outcomes. Errors are caught + WARNed. | [packages/proactive/src/cron-task.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L151) |
| <a id="property-prompt"></a> `prompt` | `readonly` | `string` \| (() => `string` \| `Promise`\&lt;`string`\&gt;) | The instruction each fire runs with. | [packages/proactive/src/cron-task.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L122) |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | REQUIRED fail-closed model pin: every fire resolves to exactly this provider and never consults the agent's fallback chain. | [packages/proactive/src/cron-task.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L127) |
| <a id="property-registryagentid"></a> `registryAgentId?` | `readonly` | `string` | Registry id the dedicated agent is registered under for REST resume (see `suspendedRuns`). Default `proactive-<id>`. Avoid ':' in the id - it is the scope-segment separator (`agents:invoke:<id>`). | [packages/proactive/src/cron-task.ts:181](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L181) |
| <a id="property-reviewoptions"></a> `reviewOptions?` | `readonly` | readonly [`ProactiveOutcomeOption`](/api/@graphorin/core/interfaces/ProactiveOutcomeOption.md)[] | Approve / deny button labels for review-rung outcomes. | [packages/proactive/src/cron-task.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L165) |
| <a id="property-schedule"></a> `schedule` | `readonly` | [`ProactiveCronSchedule`](/api/@graphorin/proactive/interfaces/ProactiveCronSchedule.md) | - | [packages/proactive/src/cron-task.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L120) |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | - | [packages/proactive/src/cron-task.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L119) |
| <a id="property-schedulingtoolnames"></a> `schedulingToolNames?` | `readonly` | readonly `string`[] | Names of trigger-registering tools that must NOT be reachable from this task. Checked against the dedicated agent's registry at creation time; a hit throws [ProactiveConfigError](/api/@graphorin/proactive/classes/ProactiveConfigError.md) unless `allowRecursiveScheduling` grants it explicitly. Default `[]` - the by-construction contract (a curated toolset without scheduling tools) stays the primary enforcement; E1's deny-by-name rules (shipped in 0.9.0) compose on top as a policy layer. | [packages/proactive/src/cron-task.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L161) |
| <a id="property-sessions"></a> `sessions?` | `readonly` | [`SessionManager`](/api/@graphorin/sessions/facade/interfaces/SessionManager.md) | Session manager: when present, each fire creates a real session. | [packages/proactive/src/cron-task.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L147) |
| <a id="property-suspendedruns"></a> `suspendedRuns?` | `readonly` | [`SuspendedRunRegistryLike`](/api/@graphorin/proactive/interfaces/SuspendedRunRegistryLike.md) | C3 messenger bridge: register a parked fire's resumable state with the server's run tracker so `POST /v1/runs/:runId/resume` can find it. Structural (`GraphorinServer.runs` satisfies it); pair with registering the dedicated agent under `registryAgentId` in the server's agent registry. Absent, question/review outcomes are still delivered - resolution then happens library-side. | [packages/proactive/src/cron-task.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L174) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | User the created sessions belong to. Default `'proactive'`. | [packages/proactive/src/cron-task.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L149) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | WARN sink. Default `console.warn`. | [packages/proactive/src/cron-task.ts:185](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L185) |
