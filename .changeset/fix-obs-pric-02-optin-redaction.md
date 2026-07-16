---
'@graphorin/observability': patch
---

Fix opt-in redaction patterns being unenablable via `validation.enabledPatterns` (e2e 2026-07-13, OBS-PRIC-02, major). `enabledPatterns` is documented as a per-name allow-list, but it filtered over the default-on catalogue only (the 14 built-in patterns), and the opt-in patterns (`ipv4`, `ipv6`, `gcp-service-account`) are not in that set - so naming them was a silent no-op and, for example, IP addresses flowed to exporters unmasked despite being requested. When `enabledPatterns` is set (and no custom catalogue is supplied) the validator now selects from the full built-in catalogue so the opt-in patterns can be enabled by name; with no allow-list the default stays the 14 default-on patterns. Regression tests pin that `enabledPatterns: ['ipv4']` masks an IPv4 address and that ipv4 stays off by default.
