[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / AgentRegistry

# Class: AgentRegistry

Defined in: packages/server/src/registry/index.ts:129

Read/write registry for agents the server should expose. Every
mutation is synchronous and the lookup is `O(1)`.

The class is intentionally tiny — extension points (e.g. lazy
factory loading, per-tenant scoping) live in higher-level packages
and consume this surface as a primitive.

## Stable

## Constructors

### Constructor

```ts
new AgentRegistry(): AgentRegistry;
```

#### Returns

`AgentRegistry`

## Methods

### describe()

```ts
describe(id): 
  | AgentSummary
  | undefined;
```

Defined in: packages/server/src/registry/index.ts:165

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`AgentSummary`](/api/@graphorin/server/registry/interfaces/AgentSummary.md)
  \| `undefined`

***

### get()

```ts
get(id): 
  | ServerAgentLike
  | undefined;
```

Defined in: packages/server/src/registry/index.ts:145

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`ServerAgentLike`](/api/@graphorin/server/registry/interfaces/ServerAgentLike.md)
  \| `undefined`

***

### has()

```ts
has(id): boolean;
```

Defined in: packages/server/src/registry/index.ts:149

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`

***

### list()

```ts
list(): readonly AgentSummary[];
```

Defined in: packages/server/src/registry/index.ts:153

#### Returns

readonly [`AgentSummary`](/api/@graphorin/server/registry/interfaces/AgentSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: packages/server/src/registry/index.ts:132

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`AgentRegistration`](/api/@graphorin/server/registry/interfaces/AgentRegistration.md) |

#### Returns

`void`

***

### size()

```ts
size(): number;
```

Defined in: packages/server/src/registry/index.ts:175

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: packages/server/src/registry/index.ts:141

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
