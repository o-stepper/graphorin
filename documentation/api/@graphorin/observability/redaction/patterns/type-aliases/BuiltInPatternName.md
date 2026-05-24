[**Graphorin API reference v0.3.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / BuiltInPatternName

# Type Alias: BuiltInPatternName

```ts
type BuiltInPatternName = 
  | "graphorin-token"
  | "openai-key"
  | "anthropic-key"
  | "aws-access-key"
  | "gcp-service-account"
  | "github-pat"
  | "jwt"
  | "bearer-header"
  | "basic-auth"
  | "private-key-pem"
  | "email"
  | "creditcard"
  | "us-ssn"
  | "phone-e164"
  | "iban"
  | "ipv4"
  | "ipv6";
```

Defined in: packages/observability/src/redaction/patterns.ts:26

Stable pattern identifier. The catalogue is curated; user-supplied
patterns can use any identifier they want and will be passed through
the validator in addition to the built-ins.

## Stable
