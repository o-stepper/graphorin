[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / COMMENTARY\_WRAP\_OPEN

# Variable: COMMENTARY\_WRAP\_OPEN

```ts
const COMMENTARY_WRAP_OPEN: "<<<commentary>>>" = '<<<commentary>>>';
```

Defined in: packages/tools/src/outbound/commentary-patterns.ts:77

**`Stable`**

Default wrap-envelope open delimiter shared by all outbound
sanitizers, so a fragment wrapped at one boundary is recognized
(and never re-wrapped) at every other boundary.
