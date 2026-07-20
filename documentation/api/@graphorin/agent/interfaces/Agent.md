[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / Agent

# Interface: Agent\&lt;TDeps, TOutput\&gt;

Defined in: packages/agent/src/types.ts:847

**`Stable`**

Public agent surface returned by [createAgent](/api/@graphorin/agent/factory/functions/createAgent.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`AgentConfig`](/api/@graphorin/agent/interfaces/AgentConfig.md)\&lt;`TDeps`, `TOutput`\&gt; | - | packages/agent/src/types.ts:849 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/agent/src/types.ts:848 |
| <a id="property-progress"></a> `progress` | `readonly` | `AgentProgressIO` | Structured handoff-artifact APIs. Persists / reads UTF-8 text artifacts under the configured artifact root; cross-run reads require an explicit `runId` cursor on the read options. | packages/agent/src/types.ts:885 |
| <a id="property-registry"></a> `registry?` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | The unified tool registry assembled at `createAgent(...)` warm-up (Principle #12): every first-party + skill tool, with cross-source name collisions resolved deterministically. Read-only and exposed for inspection; the run loop and `tool_search` consume it. Always present on agents built by `createAgent(...)`. | packages/agent/src/types.ts:893 |

## Methods

### abort()

```ts
abort(options?): void;
```

Defined in: packages/agent/src/types.ts:860

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`AbortOptions`](/api/@graphorin/agent/interfaces/AbortOptions.md) |

#### Returns

`void`

***

### compact()

```ts
compact(options?): Promise<CompactionApiResult>;
```

Defined in: packages/agent/src/types.ts:869

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`CompactOptions`](/api/@graphorin/agent/interfaces/CompactOptions.md) |

#### Returns

`Promise`\&lt;[`CompactionApiResult`](/api/@graphorin/agent/interfaces/CompactionApiResult.md)\&gt;

***

### deserializeState()

```ts
deserializeState(serialized): RunState;
```

Defined in: packages/agent/src/types.ts:910

Rehydrate a `RunState` previously produced by
[Agent.serializeState](/api/@graphorin/agent/interfaces/Agent.md#serializestate) (or the exported `runStateToJSON`).
Throws `RunStateMalformedError` / `RunStateVersionUnsupportedError`
on an unreadable payload. The result feeds straight back into
`agent.run(state, { directive })`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `serialized` | `string` |

#### Returns

[`RunState`](/api/@graphorin/core/interfaces/RunState.md)

***

### fanOut()

```ts
fanOut<TFanOutOutput>(options): Promise<FanOutResult<TFanOutOutput>>;
```

Defined in: packages/agent/src/types.ts:877

Convenience wrapper around the standalone `runFanOut(...)`. The
returned `FanOutResult` carries per-child status + the merged
output. Per-child failures are captured in `children[].status`
- this method never throws on a child failure (the merge
strategy decides whether to propagate).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TFanOutOutput` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `AgentFanOutOptions`\&lt;`TFanOutOutput`\&gt; |

#### Returns

`Promise`\<[`FanOutResult`](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md)\&lt;`TFanOutOutput`\&gt;\>

***

### followUp()

```ts
followUp(message): void;
```

Defined in: packages/agent/src/types.ts:859

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |

#### Returns

`void`

***

### isBusy()

```ts
isBusy(): boolean;
```

Defined in: packages/agent/src/types.ts:867

`true` while this instance has a run in flight (the same
invariant that makes a second `run()` throw `ConcurrentRunError`).
The public busy signal for proactive coordination - a heartbeat
defers its beat instead of colliding with an interactive run.

#### Returns

`boolean`

***

### run()

```ts
run(input, options?): Promise<AgentResult<TOutput>>;
```

Defined in: packages/agent/src/types.ts:854

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| [`RunState`](/api/@graphorin/core/interfaces/RunState.md) \| [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |
| `options?` | [`AgentCallOptions`](/api/@graphorin/agent/interfaces/AgentCallOptions.md)\&lt;`TDeps`\&gt; |

#### Returns

`Promise`\<[`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`TOutput`\&gt;\>

***

### serializeState()

```ts
serializeState(state): string;
```

Defined in: packages/agent/src/types.ts:902

Render the canonical durable JSON form of a (typically suspended)
`RunState`: version-stamped (`graphorin-run-state/x.y`), binary
payloads projected to their wire envelopes, secret-named keys
redacted. The `@graphorin/server` run tracker persists
`awaiting_approval` runs through this codec so a resume survives a
process restart; pairs with [Agent.deserializeState](/api/@graphorin/agent/interfaces/Agent.md#deserializestate).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) |

#### Returns

`string`

***

### steer()

```ts
steer(message): void;
```

Defined in: packages/agent/src/types.ts:858

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |

#### Returns

`void`

***

### stream()

```ts
stream(input, options?): AsyncIterable<AgentEvent<TOutput>>;
```

Defined in: packages/agent/src/types.ts:850

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| [`RunState`](/api/@graphorin/core/interfaces/RunState.md) \| [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |
| `options?` | [`AgentCallOptions`](/api/@graphorin/agent/interfaces/AgentCallOptions.md)\&lt;`TDeps`\&gt; |

#### Returns

`AsyncIterable`\<[`AgentEvent`](/api/@graphorin/core/type-aliases/AgentEvent.md)\&lt;`TOutput`\&gt;\>

***

### toTool()

```ts
toTool(options?): Tool<{
  input: string;
}, TOutput, TDeps>;
```

Defined in: packages/agent/src/types.ts:868

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`AgentToToolOptions`](/api/@graphorin/agent/interfaces/AgentToToolOptions.md) |

#### Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `input`: `string`;
\}, `TOutput`, `TDeps`\>
