[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerAgentLike

# Interface: ServerAgentLike

Defined in: packages/server/src/registry/index.ts:21

Minimal shape the server needs from an `Agent`. Compatible with
the `Agent` interface from `@graphorin/agent` but kept
structurally so we avoid the peer dependency.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/server/src/registry/index.ts:22 |

## Methods

### run()

```ts
run(input, options?): Promise<unknown>;
```

Defined in: packages/server/src/registry/index.ts:23

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |
| `options?` | \{ `sessionId?`: `string`; `signal?`: `AbortSignal`; `userId?`: `string`; \} |
| `options.sessionId?` | `string` |
| `options.signal?` | `AbortSignal` |
| `options.userId?` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;
