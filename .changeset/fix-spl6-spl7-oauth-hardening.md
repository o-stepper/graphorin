---
'@graphorin/security': minor
---

fix(security): OAuth callback requires state; discovery is https-only with issuer consistency (SPL-6, SPL-7)

- **SPL-6**: the authorization-code callback compared `state` only when the
  callback INCLUDED one — a drive-by request to the loopback callback could
  deliver an attacker-chosen `code` by simply omitting it. The client always
  sends `state`, so a callback without it is now rejected with
  `OAuthCallbackError`.
- **SPL-7**: discovery metadata could name plain-http endpoints (refresh
  tokens and Basic client secrets get POSTed to whatever it says) and an
  issuer unrelated to the discovery URL. Now: endpoints must be https
  (loopback hosts exempt for local development); the metadata `issuer` must
  equal the discovery URL (RFC 8414 §3.3); and well-known URLs are built via
  RFC 8414 path-insertion for path-bearing issuers, with the suffix-append
  form as a fallback. Test fixtures that relied on a resource serving AS
  metadata under a mismatched issuer now route resource → AS via an RFC 9728
  protected-resource document.
