[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / CreateHeartbeatOptions

# Interface: CreateHeartbeatOptions\&lt;TDeps\&gt;

Defined in: packages/proactive/src/heartbeat.ts:117

**`Stable`**

Options for [createHeartbeat](/api/@graphorin/proactive/functions/createHeartbeat.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activehours"></a> `activeHours?` | `readonly` | [`ActiveHours`](/api/@graphorin/proactive/interfaces/ActiveHours.md) | Daily window in which beats may run. Absent = always. | packages/proactive/src/heartbeat.ts:147 |
| <a id="property-agent"></a> `agent` | `readonly` | [`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `string`\&gt; | The agent every beat runs on. Dedicate an instance to the heartbeat: `Agent.isBusy()` guards THIS instance's in-flight run, and a shared instance would make beats and interactive turns collide on the one-run-per-instance invariant. | packages/proactive/src/heartbeat.ts:124 |
| <a id="property-checklist"></a> `checklist` | `readonly` | () => `string` \| `Promise`\&lt;`string` \| `null`\&gt; \| `null` | The beat's agenda. `null` / empty / whitespace skips the beat before any model call - an empty checklist must cost nothing. | packages/proactive/src/heartbeat.ts:132 |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | packages/proactive/src/heartbeat.ts:176 |
| <a id="property-deferms"></a> `deferMs?` | `readonly` | `number` | Deferral cadence while the gate is busy. Default 30s. | packages/proactive/src/heartbeat.ts:169 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Trigger id + outcome `taskId`. Default `'heartbeat'`. | packages/proactive/src/heartbeat.ts:134 |
| <a id="property-maxdefers"></a> `maxDefers?` | `readonly` | `number` | Give up after this many consecutive defers. Default 10. | packages/proactive/src/heartbeat.ts:171 |
| <a id="property-minoutcomelength"></a> `minOutcomeLength?` | `readonly` | `number` | Replies shorter than this (after sentinel stripping) are dropped as noise. Default `8` characters. | packages/proactive/src/heartbeat.ts:144 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | packages/proactive/src/heartbeat.ts:173 |
| <a id="property-onoutcome"></a> `onOutcome?` | `readonly` | (`outcome`) => `void` \| `Promise`\&lt;`void`\&gt; | Observer for delivered findings. Errors are caught + WARNed. | packages/proactive/src/heartbeat.ts:158 |
| <a id="property-onskip"></a> `onSkip?` | `readonly` | (`skip`) => `void` | Observer for skipped fires. Errors are caught + WARNed. | packages/proactive/src/heartbeat.ts:160 |
| <a id="property-profile"></a> `profile?` | `readonly` | [`HeartbeatProfile`](/api/@graphorin/proactive/interfaces/HeartbeatProfile.md) | - | packages/proactive/src/heartbeat.ts:145 |
| <a id="property-rungate"></a> `runGate?` | `readonly` | () => `boolean` | External busy gate: `true` defers the beat. Default `() => agent.isBusy()`. A naive internal mutex would only defer against runs the heartbeat itself started - this gate exists so the composition root can point it at the real interactive runner. | packages/proactive/src/heartbeat.ts:167 |
| <a id="property-schedule"></a> `schedule` | `readonly` | [`HeartbeatSchedule`](/api/@graphorin/proactive/interfaces/HeartbeatSchedule.md) | - | packages/proactive/src/heartbeat.ts:127 |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | The trigger scheduler the beat schedule registers on. | packages/proactive/src/heartbeat.ts:126 |
| <a id="property-sentinel"></a> `sentinel?` | `readonly` | `string` | The all-quiet marker. A reply that carries nothing beyond the sentinel is suppressed, never delivered. Default `'HEARTBEAT_OK'`. | packages/proactive/src/heartbeat.ts:139 |
| <a id="property-sessions"></a> `sessions?` | `readonly` | [`SessionManager`](/api/@graphorin/sessions/facade/interfaces/SessionManager.md) | Session manager for isolated beats: when present (and the profile is isolated), each beat creates a real session (`tags: ['heartbeat']`). Absent, beats still run isolated under fresh session IDS without session bookkeeping. | packages/proactive/src/heartbeat.ts:154 |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout` / `clearTimeout` - used by tests. | packages/proactive/src/heartbeat.ts:175 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | User the created sessions belong to. Default `'heartbeat'`. | packages/proactive/src/heartbeat.ts:156 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | WARN sink. Default `console.warn`. | packages/proactive/src/heartbeat.ts:178 |
