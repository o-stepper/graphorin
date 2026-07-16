[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / ChannelAccessDecision

# Type Alias: ChannelAccessDecision

```ts
type ChannelAccessDecision = 
  | {
  kind: "allow";
}
  | {
  kind: "deny";
  reason: "disabled" | "not-allowlisted" | "pairing-limit";
}
  | {
  code: string;
  expiresAt: string;
  issued: boolean;
  kind: "pairing-challenge";
};
```

Defined in: [packages/channels/src/access.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/access.ts#L78)

Outcome of an access check.

 - `'allow'` - proceed to routing.
 - `'deny'` - drop the message (`reason` says why).
 - `'pairing-challenge'` - the peer is unpaired; `code` is the
   (new or still-pending) pairing code. `issued` is true only when
   THIS check created the code - render the challenge to the peer
   once, not on every message.

## Stable
