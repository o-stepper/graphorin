[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / Agent

# Interface: Agent\&lt;TDeps, TOutput\&gt;

Defined in: [packages/agent/src/types.ts:758](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L758)

Public agent surface returned by [createAgent](/api/@graphorin/agent/factory/functions/createAgent.md).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`AgentConfig`](/api/@graphorin/agent/interfaces/AgentConfig.md)\&lt;`TDeps`, `TOutput`\&gt; | - | [packages/agent/src/types.ts:760](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L760) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/agent/src/types.ts:759](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L759) |
| <a id="property-progress"></a> `progress` | `readonly` | `AgentProgressIO` | Structured handoff-artifact APIs. Persists / reads UTF-8 text artifacts under the configured artifact root; cross-run reads require an explicit `runId` cursor on the read options. | [packages/agent/src/types.ts:796](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L796) |
| <a id="property-registry"></a> `registry?` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | The unified tool registry assembled at `createAgent(...)` warm-up (Principle #12): every first-party + skill tool, with cross-source name collisions resolved deterministically. Read-only and exposed for inspection; the run loop and `tool_search` consume it. Always present on agents built by `createAgent(...)`. | [packages/agent/src/types.ts:804](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L804) |

## Methods

### abort()

```ts
abort(options?): void;
```

Defined in: [packages/agent/src/types.ts:771](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L771)

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

Defined in: [packages/agent/src/types.ts:780](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L780)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`CompactOptions`](/api/@graphorin/agent/interfaces/CompactOptions.md) |

#### Returns

`Promise`\&lt;[`CompactionApiResult`](/api/@graphorin/agent/interfaces/CompactionApiResult.md)\&gt;

***

### fanOut()

```ts
fanOut<TFanOutOutput>(options): Promise<FanOutResult<TFanOutOutput>>;
```

Defined in: [packages/agent/src/types.ts:788](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L788)

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

Defined in: [packages/agent/src/types.ts:770](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L770)

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

Defined in: [packages/agent/src/types.ts:778](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L778)

C1: `true` while this instance has a run in flight (the same
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

Defined in: [packages/agent/src/types.ts:765](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L765)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| [`RunState`](/api/@graphorin/core/interfaces/RunState.md) \| [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |
| `options?` | [`AgentCallOptions`](/api/@graphorin/agent/interfaces/AgentCallOptions.md)\&lt;`TDeps`\&gt; |

#### Returns

`Promise`\<[`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`TOutput`\&gt;\>

***

### steer()

```ts
steer(message): void;
```

Defined in: [packages/agent/src/types.ts:769](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L769)

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

Defined in: [packages/agent/src/types.ts:761](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L761)

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

Defined in: [packages/agent/src/types.ts:779](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L779)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`AgentToToolOptions`](/api/@graphorin/agent/interfaces/AgentToToolOptions.md) |

#### Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `input`: `string`;
\}, `TOutput`, `TDeps`\>
