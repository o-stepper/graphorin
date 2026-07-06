[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowGuard

# Interface: DataFlowGuard

Defined in: [packages/tools/src/executor/types.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L195)

Provenance / data-flow guard the executor consults at the tool
boundary. Decisions and per-run taint state live in the
implementation; the executor only enforces the [DataFlowVerdict](/api/@graphorin/tools/type-aliases/DataFlowVerdict.md)
and audits it. See `@graphorin/security/dataflow`.

## Methods

### inspect()

```ts
inspect(input): DataFlowVerdict;
```

Defined in: [packages/tools/src/executor/types.ts:202](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L202)

Sink gate: decide whether a `side-effecting` / `external-stateful`
tool may run given what untrusted/sensitive content has entered the
run. Called only for sinks. Pure w.r.t. the executor (no I/O); the
executor emits the audit row and enforces a `'block'`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`DataFlowInspectInput`](/api/@graphorin/tools/interfaces/DataFlowInspectInput.md) |

#### Returns

[`DataFlowVerdict`](/api/@graphorin/tools/type-aliases/DataFlowVerdict.md)

***

### record()

```ts
record(input): void;
```

Defined in: [packages/tools/src/executor/types.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L207)

Record one successful output's provenance so later sink gates can
detect untrusted-to-sink flows. Called for every successful result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`DataFlowRecordInput`](/api/@graphorin/tools/interfaces/DataFlowRecordInput.md) |

#### Returns

`void`
