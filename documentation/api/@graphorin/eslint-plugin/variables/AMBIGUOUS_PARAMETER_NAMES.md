[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / AMBIGUOUS\_PARAMETER\_NAMES

# Variable: AMBIGUOUS\_PARAMETER\_NAMES

```ts
const AMBIGUOUS_PARAMETER_NAMES: ReadonlyArray<string>;
```

Defined in: src/tool-discovery.ts:156

**`Stable`**

Generic identifiers the parameter-naming rule flags as ambiguous.
Tools whose `inputSchema` references only specific identifiers
(e.g. `userId`, `recipientEmail`, `apiKey`) get full credit on
the naming axis.
