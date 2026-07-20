[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / deriveTaintLabel

# Function: deriveTaintLabel()

```ts
function deriveTaintLabel(input): TaintLabel;
```

Defined in: packages/security/src/dataflow/derive.ts:51

**`Stable`**

Derive the provenance label for a tool's output from its resolved
trust class, source, and declared sensitivity.

- `untrusted` is keyed off the [ToolTrustClass](/api/@graphorin/core/type-aliases/ToolTrustClass.md): `mcp-derived`,
  `web-search`, and `skill-untrusted` produce untrusted output.
- `sensitive` is `true` only for the `'secret'` tier. `'internal'` is
  the default tier for ordinary user content, so counting it would make
  the lethal-trifecta gate fire on essentially every run; operators who
  want a broader gate widen it via policy, not here.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `sensitiveTiers?`: readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[]; `sensitivity?`: [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md); `source?`: [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md); `trustClass`: [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md); \} | - |
| `input.sensitiveTiers?` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity tiers that count as "sensitive" for the lethal-trifecta leg. Default `['secret']` - out of the box only secret-tagged content arms the trifecta, so the gate does not fire on every run. Widen to e.g. `['secret', 'internal']` to also treat ordinary user/PII content (which defaults to `'internal'`) as sensitive. |
| `input.sensitivity?` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - |
| `input.source?` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - |
| `input.trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - |

## Returns

[`TaintLabel`](/api/@graphorin/security/interfaces/TaintLabel.md)
