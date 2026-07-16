[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / WorkflowRegistry

# Class: WorkflowRegistry

Defined in: [packages/server/src/registry/index.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L250)

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

Defined in: [packages/server/src/registry/index.ts:286](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L286)

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

Defined in: [packages/server/src/registry/index.ts:266](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L266)

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

Defined in: [packages/server/src/registry/index.ts:270](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L270)

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

Defined in: [packages/server/src/registry/index.ts:274](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L274)

#### Returns

readonly [`WorkflowSummary`](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md)[]

***

### register()

```ts
register(entry): void;
```

Defined in: [packages/server/src/registry/index.ts:253](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L253)

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

Defined in: [packages/server/src/registry/index.ts:296](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L296)

#### Returns

`number`

***

### unregister()

```ts
unregister(id): boolean;
```

Defined in: [packages/server/src/registry/index.ts:262](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L262)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`boolean`
