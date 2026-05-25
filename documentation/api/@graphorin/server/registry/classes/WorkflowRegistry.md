[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: packages/server/src/registry/index.ts:183

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

Defined in: packages/server/src/registry/index.ts:219

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

Defined in: packages/server/src/registry/index.ts:199

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

Defined in: packages/server/src/registry/index.ts:203

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

Defined in: packages/server/src/registry/index.ts:207

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: packages/server/src/registry/index.ts:186

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

Defined in: packages/server/src/registry/index.ts:229

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: packages/server/src/registry/index.ts:195

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
