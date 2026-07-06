[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: [packages/server/src/registry/index.ts:229](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L229)

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

Defined in: [packages/server/src/registry/index.ts:265](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L265)

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

Defined in: [packages/server/src/registry/index.ts:245](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L245)

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

Defined in: [packages/server/src/registry/index.ts:249](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L249)

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

Defined in: [packages/server/src/registry/index.ts:253](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L253)

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: [packages/server/src/registry/index.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L232)

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

Defined in: [packages/server/src/registry/index.ts:275](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L275)

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: [packages/server/src/registry/index.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L241)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
