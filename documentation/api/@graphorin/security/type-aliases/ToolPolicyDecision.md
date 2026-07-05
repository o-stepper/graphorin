[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolPolicyDecision

# Type Alias: ToolPolicyDecision

```ts
type ToolPolicyDecision = 
  | {
  effect: "allow";
}
  | {
  effect: "forbid";
  reason: string;
};
```

Defined in: packages/security/src/policy/tool-argument-policy.ts:68

Decision returned by [evaluateToolArgumentPolicy](/api/@graphorin/security/functions/evaluateToolArgumentPolicy.md).
