[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / checkSystemd

# Function: checkSystemd()

```ts
function checkSystemd(opts): Promise<CheckResult[]>;
```

Defined in: packages/security/src/hardening/doctor.ts:208

**`Stable`**

Linux-only systemd hardening check. Returns a `'skip'` row on
non-Linux hosts. The body parses the structured output of
`systemd-analyze security <unit>`; the parser is intentionally
thin so deployments without systemd report a clean skip.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `run?`: (`command`) => `Promise`\&lt;`string`\&gt;; `unit?`: `string`; \} |
| `opts.run?` | (`command`) => `Promise`\&lt;`string`\&gt; |
| `opts.unit?` | `string` |

## Returns

`Promise`\&lt;[`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[]\&gt;
