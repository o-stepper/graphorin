[**Graphorin API reference v0.13.13**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / RUN\_STATE\_SCHEMA\_VERSION

# Variable: RUN\_STATE\_SCHEMA\_VERSION

```ts
const RUN_STATE_SCHEMA_VERSION: "graphorin-run-state/1.2";
```

Defined in: packages/agent/src/run-state/index.ts:43

**`Stable`**

Canonical schema id for serialized [RunState](/api/@graphorin/core/interfaces/RunState.md) payloads.

1.2 encodes binary message/tool-outcome payloads (`Uint8Array | URL`)
through the core `WireRunState` projection (base64 / href envelopes)
instead of letting `JSON.stringify` corrupt them. 1.0/1.1 payloads
remain readable; their corrupted numeric-key byte objects are
repaired best-effort on rehydration.
