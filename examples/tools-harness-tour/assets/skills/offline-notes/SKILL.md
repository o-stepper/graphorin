---
name: offline-notes
description: |
  Look up short bundled release notes about the Graphorin tools harness.
  Use when the user asks what tool_search, read_result, or spill handles do.
license: MIT
graphorin-trust-level: untrusted
graphorin-handoff-input-filter: lastUser
graphorin-tools:
  - name: note_lookup
    description: Return the bundled harness release note for a topic (tool-search, read-result, or spill).
    tags: ['offline', 'notes']
---

# Offline Notes

A tiny offline skill used by the `tools-harness-tour` example. It ships one
tool declaration (`note_lookup`); the example materialises the matching
implementation in TypeScript and registers it through `stampSkillTool(...)`,
so the tool carries the skill-untrusted trust class, the forced sandbox
tier, and the untrusted-source inbound-sanitization default.

## Topics

- `tool-search` - how deferred tools are discovered mid-run.
- `read-result` - how spilled results are paged back on demand.
- `spill` - why large results leave the conversation buffer.
