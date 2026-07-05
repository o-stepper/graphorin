---
'@graphorin/cli': patch
---

Release-flow hardening (W-015, repo-level): the root `version` script now chains `changeset version && node scripts/bump-version.mjs --sync`, so any Version Packages pass (bot or maintainer) leaves the private workspaces and every text version site synchronized and self-verified by `check-version-consistency` in one step. `release.yml` reads `secrets.RELEASE_PAT || secrets.GITHUB_TOKEN`, giving the maintainer two documented paths (fine-grained PAT or the repo setting allowing Actions to create PRs) to restore the fully-automatic Version Packages PR; without either, the documented manual flow is unchanged. CONTRIBUTING lists the four remaining manual follow-ups.
