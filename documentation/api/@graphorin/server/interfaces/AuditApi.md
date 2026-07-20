[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AuditApi

# Interface: AuditApi

Defined in: packages/server/src/routes/audit.ts:23

**`Stable`**

## Methods

### export()

```ts
export(opts): Promise<{
  bytes: number;
  format?: "csv" | "jsonl";
}>;
```

Defined in: packages/server/src/routes/audit.ts:34

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `format?`: `"csv"` \| `"jsonl"`; `fromSeq?`: `number`; `toSeq?`: `number`; \} |
| `opts.format?` | `"csv"` \| `"jsonl"` |
| `opts.fromSeq?` | `number` |
| `opts.toSeq?` | `number` |

#### Returns

`Promise`\<\{
  `bytes`: `number`;
  `format?`: `"csv"` \| `"jsonl"`;
\}\>

***

### list()

```ts
list(opts): Promise<readonly unknown[]>;
```

Defined in: packages/server/src/routes/audit.ts:24

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `action?`: `string`; `fromSeq?`: `number`; `fromTs?`: `number`; `limit?`: `number`; `toTs?`: `number`; \} | - |
| `opts.action?` | `string` | Restrict to entries whose `action` matches the supplied id. |
| `opts.fromSeq?` | `number` | - |
| `opts.fromTs?` | `number` | Inclusive lower bound on the entry timestamp (epoch ms). |
| `opts.limit?` | `number` | - |
| `opts.toTs?` | `number` | Inclusive upper bound on the entry timestamp (epoch ms). |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### verify()?

```ts
optional verify(opts): Promise<{
  brokenAt?: number;
  count?: number;
  ok: boolean;
}>;
```

Defined in: packages/server/src/routes/audit.ts:45

Verify the chain integrity of every audit row in the inclusive
range. Phase 14c surfaces this through `POST /v1/audit/verify`.
Optional - operators that opt out of the audit chain should
leave this method off.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `fromSeq?`: `number`; `toSeq?`: `number`; \} |
| `opts.fromSeq?` | `number` |
| `opts.toSeq?` | `number` |

#### Returns

`Promise`\<\{
  `brokenAt?`: `number`;
  `count?`: `number`;
  `ok`: `boolean`;
\}\>
