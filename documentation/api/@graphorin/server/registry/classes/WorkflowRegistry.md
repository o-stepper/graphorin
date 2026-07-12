[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: [packages/server/src/registry/index.ts:242](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L242)

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

Defined in: [packages/server/src/registry/index.ts:278](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L278)

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

Defined in: [packages/server/src/registry/index.ts:258](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L258)

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

Defined in: [packages/server/src/registry/index.ts:262](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L262)

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

Defined in: [packages/server/src/registry/index.ts:266](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L266)

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: [packages/server/src/registry/index.ts:245](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L245)

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

Defined in: [packages/server/src/registry/index.ts:288](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L288)

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: [packages/server/src/registry/index.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L254)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
