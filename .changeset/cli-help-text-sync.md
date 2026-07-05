---
'@graphorin/cli': patch
---

Help-text honesty sweep (W-040): `consolidator set-tier` / `consolidator stop` no longer promise persistence they never had (both report UNSUPPORTED with exit 2 and now say so, pointing at `consolidator.tier` in the config per the existing IP-4 note); `tools lint` and its module header describe the discovery as the text-based static scan it actually is, not "AST analysis". The CLI guide's `migrate-export` row/example gained the mandatory `--to <file>` (copy-paste no longer dies on "required option not specified"), the phantom `tools lint <path>` positional is gone, and the `pricing diff`/`lookup`/`missing` examples now carry their required options. The `check-cli-docs` gate grew a requiredOption pass (alias-aware, `--flag=value` aware) so this drift class fails CI from now on - it caught the three pricing examples immediately.
