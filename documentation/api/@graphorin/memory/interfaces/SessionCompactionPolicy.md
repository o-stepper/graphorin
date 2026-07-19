[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SessionCompactionPolicy

# Interface: SessionCompactionPolicy

Defined in: packages/memory/src/tiers/session-memory.ts:23

**`Stable`**

Per-session compaction policy. The default `0.9` matches DEC-104:
compaction kicks in once cached message tokens exceed
`0.9 * contextWindow`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-compactatratio"></a> `compactAtRatio?` | `readonly` | `number` | Default `0.9`. | packages/memory/src/tiers/session-memory.ts:25 |
| <a id="property-contextwindowtokens"></a> `contextWindowTokens?` | `readonly` | `number` | Default `8192`. | packages/memory/src/tiers/session-memory.ts:27 |
