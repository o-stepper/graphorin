[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / SESSION\_SCOPED\_PURGES

# Variable: SESSION\_SCOPED\_PURGES

```ts
const SESSION_SCOPED_PURGES: ReadonlyArray<SessionScopedPurge>;
```

Defined in: packages/store-sqlite/src/session-store.ts:450

**`Stable`**

Declarative registry of every session-scoped CONTENT surface the
session hard-delete cascade purges. The gate test in
`tests/erasure-cascade.test.ts` diffs this list (plus
[SESSION\_TABLE\_EXEMPTIONS](/api/@graphorin/store-sqlite/variables/SESSION_TABLE_EXEMPTIONS.md)) against the live schema: a new
table with a session column fails the suite until its author decides
how erasure covers it.
