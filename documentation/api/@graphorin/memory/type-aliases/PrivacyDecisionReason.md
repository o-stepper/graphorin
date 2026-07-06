[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PrivacyDecisionReason

# Type Alias: PrivacyDecisionReason

```ts
type PrivacyDecisionReason = 
  | "provider-rejects-secret"
  | "provider-rejects-internal"
  | "no-cloud-upload-consent"
  | "allowed";
```

Defined in: [packages/memory/src/context-engine/privacy-filter.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/privacy-filter.ts#L60)

Reason the decision was made. Surfaced to the metadata block so
operators can audit per-tier drops.

## Stable
