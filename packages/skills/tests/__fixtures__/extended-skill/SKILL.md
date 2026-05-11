---
name: research-helper
description: |
  Run untrusted research workflows. Use when the user asks for web research that
  must be sandboxed away from local credentials.
graphorin-trust-level: untrusted
graphorin-handoff-input-filter: lastUser
graphorin-runtime-compat: ^0.1.0
graphorin-sensitivity: internal
graphorin-tools:
  - name: search_web
    description: Look up a query on the public web.
    tags: ['research']
  - name: extract_url
    description: Extract the readable text from a URL.
---

# Research Helper

This skill exercises every Graphorin namespaced extension. It is
loaded as `graphorin-trust-level: untrusted` and declares an explicit
`graphorin-handoff-input-filter` so the runtime has a deterministic
filter to apply.
