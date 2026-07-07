[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / evaluateToolArgumentPolicy

# Function: evaluateToolArgumentPolicy()

```ts
function evaluateToolArgumentPolicy(policy, facts): ToolPolicyDecision;
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L95)

Evaluate a policy against one tool call. Forbid-before-allow: any
matching `forbid` rule wins immediately; otherwise a matching `allow`
permits the call; otherwise the `defaultDenySensitive` posture (for
sensitive tools) or a plain allow applies. Pure + deterministic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `policy` | [`ToolArgumentPolicy`](/api/@graphorin/security/interfaces/ToolArgumentPolicy.md) |
| `facts` | [`ToolCallFacts`](/api/@graphorin/security/interfaces/ToolCallFacts.md) |

## Returns

[`ToolPolicyDecision`](/api/@graphorin/security/type-aliases/ToolPolicyDecision.md)

## Stable
