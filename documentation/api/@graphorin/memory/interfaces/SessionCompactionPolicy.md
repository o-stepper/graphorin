[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionCompactionPolicy

# Interface: SessionCompactionPolicy

Defined in: [packages/memory/src/tiers/session-memory.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L22)

Per-session compaction policy. The default `0.9` matches DEC-104:
compaction kicks in once cached message tokens exceed
`0.9 * contextWindow`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-compactatratio"></a> `compactAtRatio?` | `readonly` | `number` | Default `0.9`. | [packages/memory/src/tiers/session-memory.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L24) |
| <a id="property-contextwindowtokens"></a> `contextWindowTokens?` | `readonly` | `number` | Default `8192`. | [packages/memory/src/tiers/session-memory.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/session-memory.ts#L26) |
