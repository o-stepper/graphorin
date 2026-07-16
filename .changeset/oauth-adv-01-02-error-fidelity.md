---
"@graphorin/security": patch
---

fix(security): OAUTH-ADV-01/02 surface RFC error codes on DCR + device-authorization failures

- OAUTH-ADV-01: Dynamic Client Registration failures throw the new
  `OAuthRegistrationError` (kind `registration-failed`) carrying the RFC 7591
  `error` / `error_description` body fields, not just the HTTP status.
- OAUTH-ADV-02: a device-authorization request failure preserves the RFC 8628
  spec error code from the body instead of collapsing to a generic
  `device_authorization_failed`.

Adds `OAuthRegistrationError` and `readOAuthErrorFields` to the public surface.
