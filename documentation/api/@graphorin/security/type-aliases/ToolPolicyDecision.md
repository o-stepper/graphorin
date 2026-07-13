[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/security/src/policy/tool-argument-policy.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L107)

Decision returned by [evaluateToolArgumentPolicy](/api/@graphorin/security/functions/evaluateToolArgumentPolicy.md).
