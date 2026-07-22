---
'@graphorin/server': patch
'@graphorin/embedder-transformersjs': patch
'@graphorin/reranker-transformersjs': patch
---

Fourteenth deep retest P1: close the advisory batch published after 0.13.12. `@graphorin/server` moves to `@hono/node-server` 2.x (GHSA-frvp-7c67-39w9; the vulnerable `serve-static` entry point was never imported, and a tripwire test now keeps it that way), the workspace lockfile refreshes `fast-uri` (two highs) and `dompurify`, and the `sharp` high under `@huggingface/transformers` (image-input path, not reachable through the text-only adapters) gets the adm-zip treatment: a workspace override to `sharp@0.35.x`, a documented consumer override in both adapter READMEs and the security guide, and a reviewed published-peer-audit allowlist entry whose mitigation is verified against the live registry.
