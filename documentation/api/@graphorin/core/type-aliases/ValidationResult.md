[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ValidationResult

# Type Alias: ValidationResult\&lt;T\&gt;

```ts
type ValidationResult<T> = 
  | {
  ok: true;
  value: T;
}
  | {
  error: ZodLikeError;
  ok: false;
};
```

Defined in: [packages/core/src/utils/validation.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/validation.ts#L49)

Validate `data` against `schema` and return a `Result` instead of
throwing. Use this in code paths where you want explicit
pattern-matching over success / failure.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Stable
