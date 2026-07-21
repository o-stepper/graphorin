[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerAgentLike

# Interface: ServerAgentLike

Defined in: packages/server/src/registry/index.ts:28

**`Stable`**

Minimal shape the server needs from an `Agent`. Compatible with
the `Agent` interface from `@graphorin/agent` but kept
structurally so we avoid the peer dependency.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/registry/index.ts:29 |

## Methods

### deserializeState()?

```ts
optional deserializeState(serialized): unknown;
```

Defined in: packages/server/src/registry/index.ts:72

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `serialized` | `string` |

#### Returns

`unknown`

***

### run()

```ts
run(input, options?): Promise<unknown>;
```

Defined in: packages/server/src/registry/index.ts:30

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `unknown` | - |
| `options?` | \{ `directive?`: \{ `approvals?`: readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[]; \}; `sessionId?`: `string`; `signal?`: `AbortSignal`; `userId?`: `string`; \} | - |
| `options.directive?` | \{ `approvals?`: readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[]; \} | HITL resume directive forwarded by `POST /runs/:runId/resume`. Mirrors the agent package's `ResumeDirective` structurally. |
| `options.directive.approvals?` | readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[] | - |
| `options.sessionId?` | `string` | - |
| `options.signal?` | `AbortSignal` | - |
| `options.userId?` | `string` | - |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### serializeState()?

```ts
optional serializeState(state): string;
```

Defined in: packages/server/src/registry/index.ts:71

Durable-suspension codec (migration 038). `@graphorin/agent`
agents always carry both; optional here so plain run-only fixtures
keep working - without them a suspended run stays in-memory only
(no restart survival) and a hydrated string state cannot resume.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `unknown` |

#### Returns

`string`

***

### stream()?

```ts
optional stream(input, options?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:57

Streaming surface. `@graphorin/agent` agents satisfy this
structurally; `POST /agents/:id/stream` consumes it and emits
every event onto the run's WS subject. Optional so plain
run-only fixtures keep working (they emit a single terminal frame).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |
| `options?` | \{ `sessionId?`: `string`; `signal?`: `AbortSignal`; `userId?`: `string`; \} |
| `options.sessionId?` | `string` |
| `options.signal?` | `AbortSignal` |
| `options.userId?` | `string` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;
