[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: [packages/server/src/registry/index.ts:258](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L258)

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

Defined in: [packages/server/src/registry/index.ts:294](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L294)

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

Defined in: [packages/server/src/registry/index.ts:274](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L274)

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

Defined in: [packages/server/src/registry/index.ts:278](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L278)

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

Defined in: [packages/server/src/registry/index.ts:282](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L282)

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: [packages/server/src/registry/index.ts:261](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L261)

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

Defined in: [packages/server/src/registry/index.ts:304](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L304)

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: [packages/server/src/registry/index.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L270)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
