[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / isToolDeniedByName

# Function: isToolDeniedByName()

```ts
function isToolDeniedByName(policy, toolName): NameDenialDecision;
```

Defined in: packages/security/src/policy/tool-argument-policy.ts:225

**`Stable`**

Name-level deny check (deny-by-name): does a PREDICATE-FREE
`deny`/`forbid` rule match this tool name? Used at advertise time -
the per-step catalogue, `tool_search` results/promotion and the
executor's early mirror all consult it BEFORE any args exist. A rule
with a `when` predicate is call-time only (its predicate reasons over
validated args) and never participates here, so the check stays
deterministic for a given policy + name.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `policy` | [`ToolArgumentPolicy`](/api/@graphorin/security/interfaces/ToolArgumentPolicy.md) |
| `toolName` | `string` |

## Returns

[`NameDenialDecision`](/api/@graphorin/security/type-aliases/NameDenialDecision.md)
