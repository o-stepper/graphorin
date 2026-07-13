[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / evaluatePermissionDecision

# Function: evaluatePermissionDecision()

```ts
function evaluatePermissionDecision(policy, facts): PermissionDecision;
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L150)

Evaluate a policy against one tool call under the four-value
vocabulary (E1). Every matching rule contributes its (normalised)
effect; the strongest wins with priority `deny > defer > ask >
allow`, so a broad late `allow` can never re-open a denied call and
an `ask`/`defer` narrows an `allow` but yields to a `deny`. When no
rule matches, `defaultDenySensitive` denies sensitive tools; anything
else is allowed. Pure + deterministic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `policy` | [`ToolArgumentPolicy`](/api/@graphorin/security/interfaces/ToolArgumentPolicy.md) |
| `facts` | [`ToolCallFacts`](/api/@graphorin/security/interfaces/ToolCallFacts.md) |

## Returns

[`PermissionDecision`](/api/@graphorin/security/type-aliases/PermissionDecision.md)

## Stable
