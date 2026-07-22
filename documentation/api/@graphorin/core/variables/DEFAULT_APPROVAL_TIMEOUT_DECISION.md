[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / DEFAULT\_APPROVAL\_TIMEOUT\_DECISION

# Variable: DEFAULT\_APPROVAL\_TIMEOUT\_DECISION

```ts
const DEFAULT_APPROVAL_TIMEOUT_DECISION: {
  granted: false;
  reason: string;
};
```

Defined in: packages/core/src/channels/durable.ts:84

**`Stable`**

The decision a deadline-carrying approval resolves with when its
timeout fires and no explicit `timeoutDecision` was supplied: a
deny, so an unattended deferred permission fails closed.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-granted"></a> `granted` | `false` | packages/core/src/channels/durable.ts:85 |
| <a id="property-reason"></a> `reason` | `string` | packages/core/src/channels/durable.ts:86 |
