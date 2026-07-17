[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / DEFAULT\_APPROVAL\_TIMEOUT\_DECISION

# Variable: DEFAULT\_APPROVAL\_TIMEOUT\_DECISION

```ts
const DEFAULT_APPROVAL_TIMEOUT_DECISION: {
  granted: false;
  reason: string;
};
```

Defined in: [packages/core/src/channels/durable.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L84)

The decision a deadline-carrying approval resolves with when its
timeout fires and no explicit `timeoutDecision` was supplied: a
deny, so an unattended deferred permission fails closed.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-granted"></a> `granted` | `false` | [packages/core/src/channels/durable.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L85) |
| <a id="property-reason"></a> `reason` | `string` | [packages/core/src/channels/durable.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L86) |

## Stable
