[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / privacyDecide

# Function: privacyDecide()

```ts
function privacyDecide(recordSensitivity, context): {
  decision: PrivacyDecision;
  reason: PrivacyDecisionReason;
};
```

Defined in: packages/memory/src/context-engine/privacy-filter.ts:115

Decide whether a single record is safe to send to the active
provider. The decision logic mirrors the DoD spec:

- `'public'` always passes.
- `'secret'` passes only when the provider explicitly accepts
  `'secret'` AND the trust class is `'loopback'`.
- `'internal'` passes when the provider accepts `'internal'`
  AND `cloudUploadConsent === true` (or the trust class is
  `'loopback'` / `'private'`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `recordSensitivity` | \| [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) \| `undefined` |
| `context` | [`PrivacyFilterContext`](/api/@graphorin/memory/interfaces/PrivacyFilterContext.md) |

## Returns

```ts
{
  decision: PrivacyDecision;
  reason: PrivacyDecisionReason;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `decision` | [`PrivacyDecision`](/api/@graphorin/memory/type-aliases/PrivacyDecision.md) | packages/memory/src/context-engine/privacy-filter.ts:118 |
| `reason` | [`PrivacyDecisionReason`](/api/@graphorin/memory/type-aliases/PrivacyDecisionReason.md) | packages/memory/src/context-engine/privacy-filter.ts:118 |

## Stable
