[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CodeModeRunner

# Type Alias: CodeModeRunner

```ts
type CodeModeRunner = (options) => Promise<BridgedSourceResult>;
```

Defined in: packages/security/src/sandbox/bridged-source.ts:128

**`Stable`**

E3 (item 13, step 1): the code-mode RUNTIME contract - the seam
through which a harness substitutes WHERE model-written code
executes (a different worker pool, a subprocess, a remote runner).
[runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md) is the built-in `worker_threads`
implementation; a provider conforms by accepting the same options
and settling with the same result union.

Invariant (fixed): the options carry ONLY the script source, the
allowed tool names, the host `dispatch` bridge, the cancellation
signal and resource limits. Credentials, `RunState` and policy stay
on the harness side - every in-script `tools.<name>(args)` call
routes back through `dispatch` into the host's tool executor, where
ACL / sanitization / taint / permission governance applies. A
provider therefore never needs (and must never be handed) secret
material or run internals.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BridgedSourceOptions`](/api/@graphorin/security/interfaces/BridgedSourceOptions.md) |

## Returns

`Promise`\&lt;[`BridgedSourceResult`](/api/@graphorin/security/type-aliases/BridgedSourceResult.md)\&gt;
