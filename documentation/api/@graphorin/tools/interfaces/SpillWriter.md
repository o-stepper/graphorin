[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / SpillWriter

# Interface: SpillWriter

Defined in: packages/tools/src/result/truncate.ts:111

**`Stable`**

Pluggable spill-to-file writer. The runtime injects an implementation
that knows the per-tool sandbox FS view (see DEC-148 sandbox tier
defaults).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-artifactroot"></a> `artifactRoot` | `readonly` | `string` | packages/tools/src/result/truncate.ts:112 |

## Methods

### clear()?

```ts
optional clear(runId): Promise<void>;
```

Defined in: packages/tools/src/result/truncate.ts:155

Remove every artifact of one run. The agent calls this when
a run ends `completed`/`failed`; `awaiting_approval` and `aborted`
runs keep theirs (handles must survive resume). Optional - custom
writers without it rely on the TTL sweep / external rotation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### sweep()?

```ts
optional sweep(ttlMs): Promise<number>;
```

Defined in: packages/tools/src/result/truncate.ts:161

Remove run directories older than `ttlMs`. Returns the
number of run directories removed. The default writer fires one
best-effort sweep at construction (7-day TTL) to collect orphans.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ttlMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### write()

```ts
write(opts): Promise<{
  bytes: number;
  path: string;
}>;
```

Defined in: packages/tools/src/result/truncate.ts:113

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `body`: `string`; `extension`: `string`; `imperativePatternsPresent?`: `boolean`; `producerSource?`: `unknown`; `producerTrustClass?`: `string`; `runId`: `string`; `sensitivityTier?`: `string`; `toolCallId`: `string`; \} | - |
| `opts.body` | `string` | - |
| `opts.extension` | `string` | - |
| `opts.imperativePatternsPresent?` | `boolean` | Whether the framework's single whole-artifact scan found at least one catalogued imperative pattern in the FULL body (including patterns a future `read_result` page boundary would split, invisible to the per-page strip pass). The scan runs framework-side in `spillToFile` for EVERY writer; PERSISTING the flag is the writer's job, mirroring `producerTrustClass` / `sensitivityTier` (the default writer stores it in the taint sidecar). A custom writer that ignores this field loses only the read-side flag (the operator counter on later page reads) - the scan itself and the load-bearing defenses (per-page untrusted-content envelope, producer taint) are unaffected. Absent when the scan timed out (unknown is not `false`). |
| `opts.producerSource?` | `unknown` | Source of the producing tool (a JSON-serializable `ToolSource` value), persisted alongside the trust class. |
| `opts.producerTrustClass?` | `string` | Trust class of the tool that produced this body. Writers persist it (the default writer stores a `<file>.meta.json` sidecar) so a reader in ANOTHER executor or a resumed process can re-taint the content - without it, an untrusted spill read back through the trusted `read_result` built-in launders to trusted. |
| `opts.runId` | `string` | - |
| `opts.sensitivityTier?` | `string` | - |
| `opts.toolCallId` | `string` | - |

#### Returns

`Promise`\<\{
  `bytes`: `number`;
  `path`: `string`;
\}\>
