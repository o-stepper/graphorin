[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ZodLikeSafeParseResult

# Type Alias: ZodLikeSafeParseResult\&lt;TOutput, TInput\&gt;

```ts
type ZodLikeSafeParseResult<TOutput, TInput> = 
  | {
  data: TOutput;
  success: true;
}
  | {
  error: ZodLikeError<TInput>;
  success: false;
};
```

Defined in: packages/core/src/utils/validation.ts:19

**`Stable`**

## Type Parameters

| Type Parameter |
| ------ |
| `TOutput` |
| `TInput` |
