[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / computeEffectiveAllowlist

# Function: computeEffectiveAllowlist()

```ts
function computeEffectiveAllowlist(parent, declared): readonly string[];
```

Defined in: packages/security/src/secrets/acl.ts:95

**`Stable`**

Compute the **effective** allowlist for a child scope: intersection
of the parent's allowlist and the child's declared list. The
intersection is the foundation of the deny-by-default sub-agent
inheritance contract - passing an additional key in a child only
works when the parent already permits it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `parent` | \| [`ToolSecretsContext`](/api/@graphorin/security/interfaces/ToolSecretsContext.md) \| `undefined` |
| `declared` | readonly `string`[] |

## Returns

readonly `string`[]
