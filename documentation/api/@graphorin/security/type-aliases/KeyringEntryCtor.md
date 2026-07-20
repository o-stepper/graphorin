[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / KeyringEntryCtor

# Type Alias: KeyringEntryCtor

```ts
type KeyringEntryCtor = (service, account) => {
  deletePassword: boolean;
  getPassword: string | null;
  setPassword: void;
};
```

Defined in: packages/security/src/secrets/resolvers/keyring.ts:24

**`Stable`**

Constructor shape of `@napi-rs/keyring`'s `Entry` - swappable via
`_setKeyringEntryCtorForTesting`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `service` | `string` |
| `account` | `string` |

## Returns

```ts
{
  deletePassword: boolean;
  getPassword: string | null;
  setPassword: void;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `deletePassword()` | () => `boolean` | packages/security/src/secrets/resolvers/keyring.ts:30 |
| `getPassword()` | () => `string` \| `null` | packages/security/src/secrets/resolvers/keyring.ts:28 |
| `setPassword()` | (`value`) => `void` | packages/security/src/secrets/resolvers/keyring.ts:29 |
