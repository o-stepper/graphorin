[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / Agent

# Interface: Agent\&lt;TDeps, TOutput\&gt;

Defined in: packages/agent/src/types.ts:321

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
| <a id="property-config"></a> `config` | `readonly` | [`AgentConfig`](/api/@graphorin/agent/interfaces/AgentConfig.md)\&lt;`TDeps`, `TOutput`\&gt; | - | packages/agent/src/types.ts:323 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/agent/src/types.ts:322 |
| <a id="property-progress"></a> `progress` | `readonly` | `AgentProgressIO` | Structured handoff-artifact APIs. Persists / reads UTF-8 text artifacts under the configured artifact root; cross-run reads require an explicit `runId` cursor on the read options. | packages/agent/src/types.ts:352 |

## Methods

### abort()

```ts
abort(options?): void;
```

Defined in: packages/agent/src/types.ts:334

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

Defined in: packages/agent/src/types.ts:336

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

Defined in: packages/agent/src/types.ts:344

Convenience wrapper around the standalone `runFanOut(...)`. The
returned `FanOutResult` carries per-child status + the merged
output. Per-child failures are captured in `children[].status`
— this method never throws on a child failure (the merge
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

Defined in: packages/agent/src/types.ts:333

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) |

#### Returns

`void`

***

### run()

```ts
run(input, options?): Promise<AgentResult<TOutput>>;
```

Defined in: packages/agent/src/types.ts:328

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

Defined in: packages/agent/src/types.ts:332

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

Defined in: packages/agent/src/types.ts:324

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

Defined in: packages/agent/src/types.ts:335

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`AgentToToolOptions`](/api/@graphorin/agent/interfaces/AgentToToolOptions.md) |

#### Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `input`: `string`;
\}, `TOutput`, `TDeps`\>
