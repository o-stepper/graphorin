[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CausalityMonitor

# Class: CausalityMonitor

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:82

**`Stable`**

In-memory primitive instantiated per `RunContext`. Bounded-depth
append discipline keeps the memory footprint trivial even on long
runs.

## Constructors

### Constructor

```ts
new CausalityMonitor(cfg): CausalityMonitor;
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:89

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cfg` | [`CausalityMonitorConfig`](/api/@graphorin/agent/interfaces/CausalityMonitorConfig.md) |

#### Returns

`CausalityMonitor`

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditallchains"></a> `auditAllChains` | `readonly` | `boolean` | packages/agent/src/lateral-leak/causality-monitor.ts:86 |
| <a id="property-denialpatterns"></a> `denialPatterns` | `readonly` | readonly `RegExp`[] | packages/agent/src/lateral-leak/causality-monitor.ts:85 |
| <a id="property-maxchaindepth"></a> `maxChainDepth` | `readonly` | `number` | packages/agent/src/lateral-leak/causality-monitor.ts:84 |
| <a id="property-strictness"></a> `strictness` | `readonly` | [`CausalityMonitorStrictness`](/api/@graphorin/agent/type-aliases/CausalityMonitorStrictness.md) | packages/agent/src/lateral-leak/causality-monitor.ts:83 |

## Accessors

### chain

#### Get Signature

```ts
get chain(): readonly string[];
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:99

Snapshot the current causality chain.

##### Returns

readonly `string`[]

## Methods

### checkMessage()

```ts
checkMessage(content): CausalityMonitorCheck;
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:129

Inspect a candidate assistant-visible string and return whether
the lateral-leak defense should fire. Pure decision based on
the current chain + the operator-extensible denial patterns.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`CausalityMonitorCheck`](/api/@graphorin/agent/interfaces/CausalityMonitorCheck.md)

***

### flush()

```ts
flush(reason): {
  chain: readonly string[];
  reason: "agent.run.complete" | "agent.abort";
};
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:215

Drain the chain to the audit log on `agent.run` completion or
`agent.abort`. The runtime supplies the audit emitter - the
primitive itself is storage-agnostic.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | `"agent.run.complete"` \| `"agent.abort"` |

#### Returns

```ts
{
  chain: readonly string[];
  reason: "agent.run.complete" | "agent.abort";
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `chain` | readonly `string`[] | packages/agent/src/lateral-leak/causality-monitor.ts:216 |
| `reason` | `"agent.run.complete"` \| `"agent.abort"` | packages/agent/src/lateral-leak/causality-monitor.ts:217 |

***

### recordCall()

```ts
recordCall(entry): void;
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:110

Append an entry to the causality chain, dropping the oldest
when the chain exceeds `maxChainDepth`. Bounded-length, no PII,
no secret values - entries are short opaque strings like
`tool:slack-notify`, `tool.error:SecretAccessDenied`,
`subagent:research-east`, `compaction:auto-trigger`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | `string` |

#### Returns

`void`

***

### reset()

```ts
reset(): void;
```

Defined in: packages/agent/src/lateral-leak/causality-monitor.ts:120

Reset the chain - e.g. on `agent.run` boundary.

#### Returns

`void`
