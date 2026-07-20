[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseAuthority

# Function: parseAuthority()

```ts
function parseAuthority(authority): 
  | {
  host: string;
  port?: number;
  userinfo?: string;
}
  | undefined;
```

Defined in: packages/security/src/secrets/secret-ref.ts:451

**`Stable`**

Split an authority string of the form `[userinfo@]host[:port]` into
its components. `host` is lowercased per RFC 3986; userinfo and port
are returned verbatim. Returns `undefined` if the authority is empty.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `authority` | `string` |

## Returns

  \| \{
  `host`: `string`;
  `port?`: `number`;
  `userinfo?`: `string`;
\}
  \| `undefined`
