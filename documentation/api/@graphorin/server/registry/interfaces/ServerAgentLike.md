[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerAgentLike

# Interface: ServerAgentLike

Defined in: [packages/server/src/registry/index.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L28)

Minimal shape the server needs from an `Agent`. Compatible with
the `Agent` interface from `@graphorin/agent` but kept
structurally so we avoid the peer dependency.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/server/src/registry/index.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L29) |

## Methods

### run()

```ts
run(input, options?): Promise<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L30)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `unknown` | - |
| `options?` | \{ `directive?`: \{ `approvals?`: readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[]; \}; `sessionId?`: `string`; `signal?`: `AbortSignal`; `userId?`: `string`; \} | - |
| `options.directive?` | \{ `approvals?`: readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[]; \} | C3/W-119: HITL resume directive forwarded by `POST /runs/:runId/resume`. Mirrors the agent package's `ResumeDirective` structurally. |
| `options.directive.approvals?` | readonly \{ `granted`: `boolean`; `reason?`: `string`; `subRunToolCallId?`: `string`; `toolCallId`: `string`; \}[] | - |
| `options.sessionId?` | `string` | - |
| `options.signal?` | `AbortSignal` | - |
| `options.userId?` | `string` | - |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### stream()?

```ts
optional stream(input, options?): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L57)

Streaming surface (IP-2). `@graphorin/agent` agents satisfy this
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
