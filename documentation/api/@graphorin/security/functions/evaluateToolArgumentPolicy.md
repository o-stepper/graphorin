[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / evaluateToolArgumentPolicy

# Function: evaluateToolArgumentPolicy()

```ts
function evaluateToolArgumentPolicy(policy, facts): ToolPolicyDecision;
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:200](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L200)

Evaluate a policy against one tool call, projected onto the binary
pre-E1 vocabulary. Delegates to [evaluatePermissionDecision](/api/@graphorin/security/functions/evaluatePermissionDecision.md)
and maps every non-`allow` effect to `'forbid'`: a consumer that
cannot ask or defer must not run the call (fail-closed). Policies
written before E1 contain only `allow`/`forbid` rules, for which this
is byte-identical to the original forbid-before-allow semantics.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `policy` | [`ToolArgumentPolicy`](/api/@graphorin/security/interfaces/ToolArgumentPolicy.md) |
| `facts` | [`ToolCallFacts`](/api/@graphorin/security/interfaces/ToolCallFacts.md) |

## Returns

[`ToolPolicyDecision`](/api/@graphorin/security/type-aliases/ToolPolicyDecision.md)

## Stable
