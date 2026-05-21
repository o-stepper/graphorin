# GitHub Actions templates

CI/CD workflow templates you can copy into a **downstream app** that builds on
Graphorin. These are *templates*, not runnable example apps and not part of the
examples smoke test.

| File | Purpose |
|---|---|
| `release.yml` | Changesets-based version & publish pipeline, gated on `NPM_TOKEN`, with npm provenance. |
| `security.yml` | `pnpm audit`, license allowlist, and CodeQL scanning on push/PR + a weekly schedule. |
| `renovate.json` | Renovate config for npm dependency updates. |
| `audit-ignore.json` | Allowlist of reviewed/accepted `pnpm audit` advisories. |

## Use

Copy the files you want into your app's `.github/workflows/` (and repo root for
`renovate.json`):

```bash
cp examples/github-actions/release.yml   .github/workflows/release.yml
cp examples/github-actions/security.yml  .github/workflows/security.yml
cp examples/github-actions/renovate.json renovate.json
```

Then provision the referenced secrets (e.g. `NPM_TOKEN`) and adjust branch
names / package globs for your repo.

::: tip Pin actions by SHA
Graphorin's own workflows pin every action to a commit SHA (with a `# vX`
comment) rather than a mutable tag. Do the same in copied workflows to harden
against tag-mutation supply-chain attacks.
:::

Related templates: [`../docker`](../docker), [`../k8s`](../k8s),
[`../systemd`](../systemd).
