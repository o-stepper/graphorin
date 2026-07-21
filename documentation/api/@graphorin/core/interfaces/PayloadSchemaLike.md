[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PayloadSchemaLike

# Interface: PayloadSchemaLike\&lt;T\&gt;

Defined in: packages/core/src/channels/durable.ts:156

**`Stable`**

Structural schema slice `awaitExternal({ schema })` validates the
resolved payload against. Matches zod v3 and v4 (and anything else
exposing the same `safeParse`) without a zod dependency in core -
the same structural stance as the tools-layer schema seam.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### safeParse()

```ts
safeParse(value): 
  | {
  data: T;
  success: true;
}
  | {
  error: {
     message: string;
  };
  success: false;
};
```

Defined in: packages/core/src/channels/durable.ts:157

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

  \| \{
  `data`: `T`;
  `success`: `true`;
\}
  \| \{
  `error`: \{
     `message`: `string`;
  \};
  `success`: `false`;
\}
