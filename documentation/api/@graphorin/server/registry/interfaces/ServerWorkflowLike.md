[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerWorkflowLike

# Interface: ServerWorkflowLike

Defined in: packages/server/src/registry/index.ts:53

Minimal shape the server needs from a `Workflow`. Mirrors the
`Workflow` surface from `@graphorin/workflow`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/server/src/registry/index.ts:54 |

## Methods

### execute()

```ts
execute(input, options?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:55

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |
| `options?` | \{ `signal?`: `AbortSignal`; `threadId?`: `string`; \} |
| `options.signal?` | `AbortSignal` |
| `options.threadId?` | `string` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;

***

### getState()?

```ts
optional getState(threadId): Promise<unknown>;
```

Defined in: packages/server/src/registry/index.ts:60

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### listCheckpoints()?

```ts
optional listCheckpoints(threadId): Promise<readonly unknown[]>;
```

Defined in: packages/server/src/registry/index.ts:61

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### resume()?

```ts
optional resume(threadId, directive?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:59

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `directive?` | \{ `resume?`: `unknown`; \} |
| `directive.resume?` | `unknown` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;
