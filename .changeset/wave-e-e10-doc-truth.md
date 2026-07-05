---
'@graphorin/cli': patch
'@graphorin/mcp': patch
'@graphorin/store-sqlite': patch
'@graphorin/store-sqlite-encrypted': patch
'@graphorin/memory': patch
'@graphorin/tools': patch
'@graphorin/skills': patch
---

Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).
