[**Graphorin API reference v0.15.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [scorers](/api/@graphorin/evals/scorers/index.md) / SchemaLike

# Interface: SchemaLike

Defined in: packages/evals/src/scorers/trajectory/argument-validity.ts:20

**`Stable`**

Structural view of a JSON-Schema-bearing tool definition accepted by
[ArgumentValidityOptions](/api/@graphorin/evals/interfaces/ArgumentValidityOptions.md).

## Methods

### safeParse()

```ts
safeParse(value): {
  success: boolean;
};
```

Defined in: packages/evals/src/scorers/trajectory/argument-validity.ts:21

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

```ts
{
  success: boolean;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `success` | `boolean` | packages/evals/src/scorers/trajectory/argument-validity.ts:21 |
