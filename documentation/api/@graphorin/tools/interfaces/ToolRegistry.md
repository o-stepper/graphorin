[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolRegistry

# Interface: ToolRegistry

Defined in: [packages/tools/src/registry/registry.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L73)

Strategy-aware tool registry.

## Stable

## Methods

### assertNoDuplicates()

#### Call Signature

```ts
assertNoDuplicates(): void;
```

Defined in: [packages/tools/src/registry/registry.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L99)

Pure-detection collision check. Throws
[DuplicateToolNameError](/api/@graphorin/tools/errors/classes/DuplicateToolNameError.md) on first-party / inline collisions
(programming errors). Bytes-equal back-compat for callers that
never wired a strategy.

##### Returns

`void`

#### Call Signature

```ts
assertNoDuplicates(strategy, ctx): readonly CollisionResolution[];
```

Defined in: [packages/tools/src/registry/registry.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L106)

Strategy-aware collision overload. Returns the
[CollisionResolution](/api/@graphorin/tools/type-aliases/CollisionResolution.md) records for the audit emitter +
counter increments. Throws [ToolCollisionError](/api/@graphorin/tools/errors/classes/ToolCollisionError.md) on the
`'manual'` strategy with no automatic resolution.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `strategy` | [`CollisionStrategy`](/api/@graphorin/tools/type-aliases/CollisionStrategy.md) |
| `ctx` | [`CollisionContext`](/api/@graphorin/tools/interfaces/CollisionContext.md) |

##### Returns

readonly [`CollisionResolution`](/api/@graphorin/tools/type-aliases/CollisionResolution.md)[]

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/tools/src/registry/registry.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L119)

Tear down the registry - clears every entry.

#### Returns

`void`

***

### get()

```ts
get<TInput, TOutput, TDeps>(name): 
  | RegistryEntry<TInput, TOutput, TDeps>
  | undefined;
```

Defined in: [packages/tools/src/registry/registry.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L79)

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

  \| [`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt;
  \| `undefined`

***

### list()

```ts
list(): readonly RegistryEntry[];
```

Defined in: [packages/tools/src/registry/registry.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L82)

#### Returns

readonly [`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)[]

***

### listByTag()

```ts
listByTag(tag): readonly RegistryEntry[];
```

Defined in: [packages/tools/src/registry/registry.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L92)

Filter the registry by `tag`. Each registered tool's `tags` array is
inspected; tools that include `tag` are returned in registration
order. Empty array when no tool matches. Used by the deferred-tool
lookup path AND by operator queries (e.g. `tool({ tags:
['experimental'] })` for opt-out from per-tool lint rules).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | `string` |

#### Returns

readonly [`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)[]

***

### listDeferred()

```ts
listDeferred(): readonly RegistryEntry[];
```

Defined in: [packages/tools/src/registry/registry.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L84)

#### Returns

readonly [`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)[]

***

### listEager()

```ts
listEager(): readonly RegistryEntry[];
```

Defined in: [packages/tools/src/registry/registry.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L83)

#### Returns

readonly [`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)[]

***

### register()

```ts
register<TInput, TOutput, TDeps>(tool, source?): RegistryEntry<TInput, TOutput, TDeps>;
```

Defined in: [packages/tools/src/registry/registry.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L74)

#### Type Parameters

| Type Parameter |
| ------ |
| `TInput` |
| `TOutput` |
| `TDeps` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; |
| `source?` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) |

#### Returns

[`RegistryEntry`](/api/@graphorin/tools/type-aliases/RegistryEntry.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt;

***

### searchDeferred()

```ts
searchDeferred(query, k?): Promise<readonly ToolSearchMatch[]>;
```

Defined in: [packages/tools/src/registry/registry.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L115)

Search the deferred pool for tools matching `query`. Three-tier
composable chain: semantic (embedder-backed) ⟶ BM25 fallback ⟶
regex name-match final fallback.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `k?` | `number` |

#### Returns

`Promise`\&lt;readonly [`ToolSearchMatch`](/api/@graphorin/tools/interfaces/ToolSearchMatch.md)[]\&gt;

***

### size()

```ts
size(): number;
```

Defined in: [packages/tools/src/registry/registry.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L117)

Snapshot for tests.

#### Returns

`number`

***

### unregister()

```ts
unregister(name): boolean;
```

Defined in: [packages/tools/src/registry/registry.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/registry.ts#L78)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`
