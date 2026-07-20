[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ZodLikeSchema

# Interface: ZodLikeSchema\&lt;TOutput, TInput\&gt;

Defined in: packages/core/src/utils/validation.ts:10

**`Stable`**

Type-only Zod compatibility shim. We declare a structural type for the
subset of `zod` we depend on so that `@graphorin/core` can be type-
checked without importing zod directly. Consumers that do `import {
  z } from 'zod'` get the real types via the user's `zod` install (the
peer dependency).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |
| `TInput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_input"></a> `_input?` | `readonly` | `TInput` | - | packages/core/src/utils/validation.ts:15 |
| <a id="property-_output"></a> `_output?` | `readonly` | `TOutput` | Internal phantom used by Zod for inference. We don't dereference it. | packages/core/src/utils/validation.ts:14 |

## Methods

### parse()

```ts
parse(data): TOutput;
```

Defined in: packages/core/src/utils/validation.ts:11

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`TOutput`

***

### safeParse()

```ts
safeParse(data): ZodLikeSafeParseResult<TOutput, TInput>;
```

Defined in: packages/core/src/utils/validation.ts:12

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

[`ZodLikeSafeParseResult`](/api/@graphorin/core/type-aliases/ZodLikeSafeParseResult.md)\&lt;`TOutput`, `TInput`\&gt;
