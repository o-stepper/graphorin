[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CustomSpanType

# Type Alias: CustomSpanType

```ts
type CustomSpanType = `x.${string}`;
```

Defined in: [packages/core/src/contracts/tracer.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/tracer.ts#L73)

Namespaced escape hatch for user-defined span kinds (W-126): any
string under the `x.` prefix, e.g. `'x.acme.rerank'`. The prefix
keeps typo-safety for the known literals - `'memory.serch.semantic'`
is still a compile error because it does not start with `x.` -
which is why this is a template-literal type and not `string & {}`.

Convention: `x.<vendor>.<operation>`. Backends and analytics must
tolerate unknown span-type strings (the same policy events already
follow). When a custom kind becomes common, promote it into
[KnownSpanType](/api/@graphorin/core/type-aliases/KnownSpanType.md) (additive minor).

## Stable
