[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / stripSensitiveOutputs

# Function: stripSensitiveOutputs()

```ts
function stripSensitiveOutputs(): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L227)

Strip tool messages whose `content` carries the literal token
`[REDACTED:secret]` or whose `secret` annotation marks the body as
sensitive. Conservative-by-design: the agent runtime tags
sensitive tool outputs at session-write time so this filter has
stable bytes to scan against.

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
