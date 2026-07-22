[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretValueAuditEvent

# Type Alias: SecretValueAuditEvent

```ts
type SecretValueAuditEvent = {
  action: "reveal" | "use" | "use-buffer" | "dispose" | "construct";
  caller?: string;
  length: number;
  scopeId?: string;
  source?: {
     ref?: string;
     resolver?: string;
  };
  ts: number;
};
```

Defined in: packages/security/src/secrets/secret-value.ts:33

**`Stable`**

Hook signature subscribed by the audit log. The audit log is wired up
by a sibling sub-package; this module merely calls every registered
listener on `.reveal()` and `.use(...)` so the audit log can attribute
each unwrap event.

## Properties

### action

```ts
readonly action: "reveal" | "use" | "use-buffer" | "dispose" | "construct";
```

Defined in: packages/security/src/secrets/secret-value.ts:34

***

### caller?

```ts
readonly optional caller?: string;
```

Defined in: packages/security/src/secrets/secret-value.ts:39

Best-effort caller name (set by `withSecret(...)` if active).

***

### length

```ts
readonly length: number;
```

Defined in: packages/security/src/secrets/secret-value.ts:41

Length of the underlying buffer in bytes. Safe to log.

***

### scopeId?

```ts
readonly optional scopeId?: string;
```

Defined in: packages/security/src/secrets/secret-value.ts:37

Best-effort caller scope (set by `withSecret(...)` if active).

***

### source?

```ts
readonly optional source?: {
  ref?: string;
  resolver?: string;
};
```

Defined in: packages/security/src/secrets/secret-value.ts:35

#### ref?

```ts
readonly optional ref?: string;
```

#### resolver?

```ts
readonly optional resolver?: string;
```

***

### ts

```ts
readonly ts: number;
```

Defined in: packages/security/src/secrets/secret-value.ts:43

Epoch milliseconds at the moment of the event.
