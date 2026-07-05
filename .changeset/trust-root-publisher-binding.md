---
'@graphorin/security': minor
---

W-026/W-102: the skill trust root's `publishers` leg is now cryptographically meaningful.

`publisher` comes from attacker-authored frontmatter and is EXCLUDED from the signed payload (`canonicalizeForSignature` strips the signature block), so a self-signed skill claiming `publisher: trusted.example.com` passed a publishers-only trust root. Now: (1) the `publishers` leg counts only for keys resolved through the `well-known` channel - an inline key can never satisfy it (pin fingerprints for those); (2) at resolve time the well-known key URL's host must equal the publisher or be its subdomain (`keys.vendor.example.com` for `vendor.example.com`), else `SkillSignatureInvalidError`; (3) the default key fetcher sets `redirect: 'error'` so an open redirect on the publisher's domain cannot substitute the key source. BREAKING for operators whose publisher ids are not DNS names or whose keys are hosted off-domain: align the publisher with the serving domain or switch that entry to the `fingerprints` leg.
