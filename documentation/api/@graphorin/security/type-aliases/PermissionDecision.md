[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PermissionDecision

# Type Alias: PermissionDecision

```ts
type PermissionDecision = 
  | {
  effect: "allow";
}
  | {
  effect: "deny" | "ask" | "defer";
  reason: string;
};
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L117)

Four-value decision returned by [evaluatePermissionDecision](/api/@graphorin/security/functions/evaluatePermissionDecision.md)
(E1). Non-`allow` effects always carry a reason.

## Stable
