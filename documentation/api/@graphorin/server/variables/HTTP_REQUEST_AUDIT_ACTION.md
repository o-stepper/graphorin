[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HTTP\_REQUEST\_AUDIT\_ACTION

# Variable: HTTP\_REQUEST\_AUDIT\_ACTION

```ts
const HTTP_REQUEST_AUDIT_ACTION: "http:request";
```

Defined in: packages/server/src/middleware/audit.ts:29

**`Stable`**

Canonical action discriminator emitted on every authenticated REST
request per the Phase 14a spec (`§ Audit middleware`). Exposed as
a constant so consumers (downstream filters, dashboards) can grep
for it without restating the literal everywhere.
