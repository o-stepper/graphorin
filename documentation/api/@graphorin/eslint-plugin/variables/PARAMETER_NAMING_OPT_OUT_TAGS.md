[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / PARAMETER\_NAMING\_OPT\_OUT\_TAGS

# Variable: PARAMETER\_NAMING\_OPT\_OUT\_TAGS

```ts
const PARAMETER_NAMING_OPT_OUT_TAGS: ReadonlyArray<string>;
```

Defined in: src/tool-discovery.ts:180

**`Stable`**

Tag values that, when present in a tool's `tags: [...]` literal,
suppress the parameter-naming rule for that tool. The opt-out
exists so operators can defer the rename for a long tail of
pre-existing tools while the framework migrates without breaking
calling code.
