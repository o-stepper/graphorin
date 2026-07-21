[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / CustomSpanType

# Type Alias: CustomSpanType

```ts
type CustomSpanType = `x.${string}`;
```

Defined in: packages/core/src/contracts/tracer.ts:76

**`Stable`**

Namespaced escape hatch for user-defined span kinds: any
string under the `x.` prefix, e.g. `'x.acme.rerank'`. The prefix
keeps typo-safety for the known literals - `'memory.serch.semantic'`
is still a compile error because it does not start with `x.` -
which is why this is a template-literal type and not `string & {}`.

Convention: `x.<vendor>.<operation>`. Backends and analytics must
tolerate unknown span-type strings (the same policy events already
follow). When a custom kind becomes common, promote it into
[KnownSpanType](/api/@graphorin/core/type-aliases/KnownSpanType.md) (additive minor).
