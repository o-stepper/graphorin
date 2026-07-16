[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [commentary](/api/@graphorin/server/commentary/index.md) / commentaryDecisionToAuditInput

# Function: commentaryDecisionToAuditInput()

```ts
function commentaryDecisionToAuditInput(decision): AuditEntryInput;
```

Defined in: [packages/server/src/commentary/audit-bridge.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/audit-bridge.ts#L33)

Translate a sanitizer decision into an audit entry. The digests + matched
pattern bucket land in `metadata`; raw payloads never do (the sanitizer only
ever exposes SHA-256s of the before/after bodies).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `decision` | [`DeliveryCommentaryDecision`](/api/@graphorin/server/interfaces/DeliveryCommentaryDecision.md) |

## Returns

[`AuditEntryInput`](/api/@graphorin/security/interfaces/AuditEntryInput.md)
