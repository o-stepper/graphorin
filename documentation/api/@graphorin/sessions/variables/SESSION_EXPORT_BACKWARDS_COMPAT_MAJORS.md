[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SESSION\_EXPORT\_BACKWARDS\_COMPAT\_MAJORS

# Variable: SESSION\_EXPORT\_BACKWARDS\_COMPAT\_MAJORS

```ts
const SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS: 2 = 2;
```

Defined in: [packages/sessions/src/export/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L42)

Reader compatibility band: the writer accepts the current MAJOR
minus 0..N inclusive, where N is set by this constant. v0.1 only
emits MAJOR `1` (there is no prior schema), but the value is `2` so
the import path honours the N-2 backwards-compat discipline once
`2.x` and `3.x` writers exist.

## Stable
