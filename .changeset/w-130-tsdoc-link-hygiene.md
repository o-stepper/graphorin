---
'@graphorin/core': patch
'@graphorin/agent': patch
'@graphorin/memory': patch
'@graphorin/sessions': patch
'@graphorin/workflow': patch
'@graphorin/tools': patch
'@graphorin/security': patch
'@graphorin/mcp': patch
'@graphorin/provider': patch
'@graphorin/store-sqlite': patch
'@graphorin/observability': patch
'@graphorin/server': patch
'@graphorin/client': patch
'@graphorin/evals': patch
---

TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.
