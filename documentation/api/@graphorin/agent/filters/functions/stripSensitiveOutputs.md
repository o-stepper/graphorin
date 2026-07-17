[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / stripSensitiveOutputs

# Function: stripSensitiveOutputs()

```ts
function stripSensitiveOutputs(): DescribedFilter;
```

Defined in: [packages/agent/src/filters/index.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L232)

Strip tool messages whose `content` carries a literal
`[REDACTED:` redaction token - ANY redaction tier trips it, not
only `secret` (AGENT-FIL-02). There is no `secret` annotation on
the message surface in the current slice; the token stamped by the
redaction layer at session-write time is the only signal this
filter scans, so an output that was never redaction-stamped passes
through. Same weak-contract caveat as [bySensitivity](/api/@graphorin/agent/filters/functions/bySensitivity.md).

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)

## Stable
