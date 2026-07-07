[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / authorize

# Function: authorize()

```ts
function authorize(result, required): 
  | {
  ok: true;
  token: VerifiedToken;
}
  | {
  ok: false;
  reason: "unauthenticated" | "insufficient-scope";
};
```

Defined in: [packages/security/src/auth/verify.ts:454](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L454)

Helper that authorises a parsed verify result against a required
scope. Keeps the scope plumbing close to the rest of the auth
surface so callers do not have to import from two places.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `result` | [`VerifyResult`](/api/@graphorin/security/type-aliases/VerifyResult.md) |
| `required` | \| `string` \| [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md) |

## Returns

  \| \{
  `ok`: `true`;
  `token`: [`VerifiedToken`](/api/@graphorin/security/interfaces/VerifiedToken.md);
\}
  \| \{
  `ok`: `false`;
  `reason`: `"unauthenticated"` \| `"insufficient-scope"`;
\}

## Stable
