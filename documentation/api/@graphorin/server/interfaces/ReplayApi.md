[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayApi

# Interface: ReplayApi

Defined in: packages/server/src/replay/routes.ts:35

**`Stable`**

## Methods

### loadRunReplay()

```ts
loadRunReplay(input): Promise<ReplayResponse>;
```

Defined in: packages/server/src/replay/routes.ts:36

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `fromMessageId?`: `string`; `mode`: [`ReplayMode`](/api/@graphorin/server/type-aliases/ReplayMode.md); `provider?`: `string`; `runId`: `string`; \} |
| `input.fromMessageId?` | `string` |
| `input.mode` | [`ReplayMode`](/api/@graphorin/server/type-aliases/ReplayMode.md) |
| `input.provider?` | `string` |
| `input.runId` | `string` |

#### Returns

`Promise`\&lt;[`ReplayResponse`](/api/@graphorin/server/interfaces/ReplayResponse.md)\&gt;

***

### loadSessionReplay()

```ts
loadSessionReplay(input): Promise<ReplayResponse>;
```

Defined in: packages/server/src/replay/routes.ts:42

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `fromMessageId?`: `string`; `mode`: [`ReplayMode`](/api/@graphorin/server/type-aliases/ReplayMode.md); `provider?`: `string`; `sessionId`: `string`; \} |
| `input.fromMessageId?` | `string` |
| `input.mode` | [`ReplayMode`](/api/@graphorin/server/type-aliases/ReplayMode.md) |
| `input.provider?` | `string` |
| `input.sessionId` | `string` |

#### Returns

`Promise`\&lt;[`ReplayResponse`](/api/@graphorin/server/interfaces/ReplayResponse.md)\&gt;
