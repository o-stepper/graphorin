[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / NameDenialDecision

# Type Alias: NameDenialDecision

```ts
type NameDenialDecision = 
  | {
  denied: false;
}
  | {
  denied: true;
  reason: string;
};
```

Defined in: [packages/security/src/policy/tool-argument-policy.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L210)

Result of [isToolDeniedByName](/api/@graphorin/security/functions/isToolDeniedByName.md).
