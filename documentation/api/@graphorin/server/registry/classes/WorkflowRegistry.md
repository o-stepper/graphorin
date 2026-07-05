[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: packages/server/src/registry/index.ts:197

## Stable

## Constructors

### Constructor

```ts
new WorkflowRegistry(): WorkflowRegistry;
```

#### Returns

`WorkflowRegistry`

## Methods

### describe()

```ts
describe(id): 
  | WorkflowSummary
  | undefined;
```

Defined in: packages/server/src/registry/index.ts:233

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)
  \| `undefined`

***

### get()

```ts
get(id): 
  | ServerWorkflowLike
  | undefined;
```

Defined in: packages/server/src/registry/index.ts:213

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

  \| [`ServerWorkflowLike`](/api/@graphorin/server/registry/interfaces/ServerWorkflowLike.md)
  \| `undefined`

***

### has()

```ts
has(id): boolean;
```

Defined in: packages/server/src/registry/index.ts:217

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`

***

### list()

```ts
list(): readonly WorkflowSummary[];
```

Defined in: packages/server/src/registry/index.ts:221

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: packages/server/src/registry/index.ts:200

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`WorkflowRegistration`](/api/@graphorin/server/registry/interfaces/WorkflowRegistration.md) |

#### Returns

`void`

***

### size()

```ts
size(): number;
```

Defined in: packages/server/src/registry/index.ts:243

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: packages/server/src/registry/index.ts:209

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
