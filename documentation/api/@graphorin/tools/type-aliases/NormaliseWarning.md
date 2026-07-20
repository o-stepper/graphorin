[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / NormaliseWarning

# Type Alias: NormaliseWarning

```ts
type NormaliseWarning = 
  | {
  kind: "classification:missing";
  toolName: string;
}
  | {
  kind: "classification:idempotency-key-missing";
  sideEffectClass: SideEffectClass;
  toolName: string;
}
  | {
  count: number;
  kind: "examples:overflow";
  toolName: string;
}
  | {
  kind: "result:cap-disabled";
  toolName: string;
}
  | {
  kind: "sandbox:advisory-inline";
  policy: string;
  toolName: string;
};
```

Defined in: packages/tools/src/registry/normalize.ts:72

Discriminator for the registration-time WARN family.
