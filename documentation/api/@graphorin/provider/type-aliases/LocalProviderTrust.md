[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / LocalProviderTrust

# Type Alias: LocalProviderTrust

```ts
type LocalProviderTrust = "loopback" | "private" | "public-tls" | "public-cleartext";
```

Defined in: [packages/core/dist/contracts/local-provider-trust.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/local-provider-trust.d.ts)

**`Stable`**

Trust class assigned to a local-LLM provider based on the
configured `baseUrl`. The classifier dispatcher lives in
`@graphorin/provider/trust/classify-local-provider.ts`; the literal
union is hoisted here so consumers (security policy, observability,
prompt redaction) can type-check against it without depending on
`@graphorin/provider`.

Tier semantics:

- `'loopback'`         - `localhost` / `127.0.0.0/8` / `::1` /
  `unix:///path` (or any in-process adapter that has no `baseUrl`).
  Same trust boundary as the host process.
- `'private'`          - RFC 1918 (`10/8`, `172.16/12`,
  `192.168/16`); RFC 6598 CGNAT (`100.64/10`); link-local
  (`169.254/16`, `fe80::/10`); `*.local` / `*.lan` / `*.internal` /
  `*.home.arpa`.
- `'public-tls'`       - public IP / hostname AND `https://`.
- `'public-cleartext'` - public IP / hostname AND `http://`. Adapters
  refuse to start unless explicitly overridden.
