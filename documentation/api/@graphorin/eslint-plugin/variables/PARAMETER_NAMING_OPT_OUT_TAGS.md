[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / PARAMETER\_NAMING\_OPT\_OUT\_TAGS

# Variable: PARAMETER\_NAMING\_OPT\_OUT\_TAGS

```ts
const PARAMETER_NAMING_OPT_OUT_TAGS: ReadonlyArray<string>;
```

Defined in: tool-discovery.ts:154

Tag values that, when present in a tool's `tags: [...]` literal,
suppress the parameter-naming rule for that tool. The opt-out
exists so operators can defer the rename for a long tail of
pre-RB-49 tools while the framework migrates without breaking
calling code.

## Stable
