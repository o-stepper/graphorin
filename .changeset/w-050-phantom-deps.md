---
"@graphorin/agent": patch
"@graphorin/mcp": patch
"@graphorin/memory": patch
"@graphorin/server": patch
"@graphorin/sessions": patch
"@graphorin/skills": patch
"@graphorin/store-sqlite-encrypted": patch
"@graphorin/workflow": patch
---

Remove phantom workspace dependencies that no source file imports: agent no longer depends on provider and observability, mcp/workflow/server no longer depend on observability, sessions no longer depends on security (and its memory edge moves to devDependencies where the single test import lives), skills no longer depends on tools. Dead tsdown `external` entries for the removed edges are gone too, so a future import can no longer build as external without a declared dependency. Consumer install graphs shrink accordingly; a new repo-wide `check-phantom-deps` CI gate keeps the manifest graph honest from here on.
