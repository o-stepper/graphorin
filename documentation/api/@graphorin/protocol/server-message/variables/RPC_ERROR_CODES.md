[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / RPC\_ERROR\_CODES

# Variable: RPC\_ERROR\_CODES

```ts
const RPC_ERROR_CODES: Readonly<{
  AUTH_INVALID: -32002;
  AUTH_REQUIRED: -32001;
  INTERNAL_ERROR: -32603;
  INVALID_PARAMS: -32602;
  INVALID_REQUEST: -32600;
  METHOD_NOT_FOUND: -32601;
  PARSE_ERROR: -32700;
  PROTOCOL_VIOLATION: -32005;
  RATE_LIMITED: -32004;
  RUN_NOT_FOUND: -32010;
  SCOPE_DENIED: -32003;
  SUBSCRIPTION_NOT_FOUND: -32011;
}>;
```

Defined in: [packages/protocol/src/server-message.ts:262](https://github.com/o-stepper/graphorin/blob/main/packages/protocol/src/server-message.ts#L262)

Stable JSON-RPC error code catalogue used by the server when
surfacing routine failures (per JSON-RPC 2.0 § 5.1 + Graphorin
extensions). Application-level errors use codes in the
implementation-defined range (`-32000` … `-32099`).

## Stable
