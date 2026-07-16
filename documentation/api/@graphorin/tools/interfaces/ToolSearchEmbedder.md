[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchEmbedder

# Interface: ToolSearchEmbedder

Defined in: [packages/tools/src/registry/types.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L119)

Pluggable embedder hook used by the semantic stage of
[ToolRegistry.searchDeferred](/api/@graphorin/tools/interfaces/ToolRegistry.md#searchdeferred). The agent runtime supplies an
implementation backed by the configured embedder (default per the
memory subsystem); the registry falls through to the BM25 stage if
the hook is undefined OR returns `null` for a given query.

## Stable

## Methods

### dim()

```ts
dim(): number;
```

Defined in: [packages/tools/src/registry/types.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L123)

Output dimensionality.

#### Returns

`number`

***

### embed()

```ts
embed(texts, signal?): Promise<readonly Float32Array<ArrayBufferLike>[]>;
```

Defined in: [packages/tools/src/registry/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L125)

Embed a batch of strings.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | readonly `string`[] |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\<readonly `Float32Array`\&lt;`ArrayBufferLike`\&gt;[]\>

***

### id()

```ts
id(): string;
```

Defined in: [packages/tools/src/registry/types.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L121)

Stable identifier surfaced through the cache key.

#### Returns

`string`
