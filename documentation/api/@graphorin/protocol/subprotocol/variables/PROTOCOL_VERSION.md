[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [subprotocol](/api/@graphorin/protocol/subprotocol/index.md) / PROTOCOL\_VERSION

# Variable: PROTOCOL\_VERSION

```ts
const PROTOCOL_VERSION: "1" = '1';
```

Defined in: [packages/protocol/src/subprotocol.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/src/subprotocol.ts#L31)

Wire-format major version literal carried on every message body.
The pair `(SUBPROTOCOL_NAME, PROTOCOL_VERSION)` is the binding
contract a client commits to when it receives a successful upgrade.

## Stable
