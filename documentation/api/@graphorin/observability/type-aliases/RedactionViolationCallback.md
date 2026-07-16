[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionViolationCallback

# Type Alias: RedactionViolationCallback

```ts
type RedactionViolationCallback = (violation) => void;
```

Defined in: [packages/observability/src/redaction/types.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/types.ts#L21)

Optional sink invoked every time the validator drops a value or
masks a pattern. Useful for emitting custom metrics, audit entries,
or alert hooks. The callback receives only sanitized data - secret
values are never forwarded.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `violation` | [`RedactionViolation`](/api/@graphorin/observability/interfaces/RedactionViolation.md) |

## Returns

`void`

## Stable
