[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [migration](/api/@graphorin/skills/migration/index.md) / sortKeysAnthropicFirst

# Function: sortKeysAnthropicFirst()

```ts
function sortKeysAnthropicFirst(frontmatter): Record<string, unknown>;
```

Defined in: [packages/skills/src/migration/index.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/migration/index.ts#L171)

Stable key ordering: Anthropic-base fields first (in their snapshot
insertion order), then the `metadata` bucket, then the
`graphorin-*` fields, then anything else. The migrator emits in
this order so re-running the migrator on the same input yields
identical bytes (idempotence).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `Record`\&lt;`string`, `unknown`\&gt; |

## Returns

`Record`\&lt;`string`, `unknown`\&gt;

## Stable
