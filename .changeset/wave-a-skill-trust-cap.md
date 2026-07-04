---
'@graphorin/skills': patch
---

Cap self-declared skill trust for npm and git sources (mcp-skills-01). The RP-9 rule - trust is granted by the integrator, never the artifact - previously applied only to `folder` sources: an npm/git skill without an operator `trustLevel` took its SKILL.md's self-declared `graphorin-trust-level: trusted` verbatim, and because the signature trust root allows an inline key in the same SKILL.md, a malicious package could self-sign, declare trusted, and load unsandboxed. The cap now applies to every source kind; an explicit operator `trustLevel` on the source still wins.
