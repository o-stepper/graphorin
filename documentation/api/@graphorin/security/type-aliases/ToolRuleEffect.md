[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolRuleEffect

# Type Alias: ToolRuleEffect

```ts
type ToolRuleEffect = 
  | PermissionEffect
  | "forbid";
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L79)

Effect accepted on a [ToolArgumentRule](/api/@graphorin/security/interfaces/ToolArgumentRule.md): the four-value
vocabulary plus `'forbid'`, the pre-E1 spelling kept as a back-compat
alias of `'deny'` (existing policies keep working byte-for-byte).

## Stable
