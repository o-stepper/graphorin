# Graphorin documentation site

This workspace builds the public documentation site published at <https://docs.graphorin.com>. The site is built with [VitePress](https://vitepress.dev), with API reference auto-generated from TypeScript by [TypeDoc](https://typedoc.org), Mermaid diagrams via [`vitepress-plugin-mermaid`](https://github.com/emersonbottero/vitepress-plugin-mermaid), and type-aware code samples via [Twoslash](https://shiki.style/packages/twoslash).

- **Project owner:** Oleksiy Stepurenko (<step.oleksiy@gmail.com>)
- **License:** [MIT](../LICENSE) — © 2026 Oleksiy Stepurenko
- **Website:** <https://graphorin.com>
- **Repository:** <https://github.com/o-stepper/graphorin>

## Local development

From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @graphorin/docs dev
```

The dev server starts at <http://localhost:5173>. Hot reload covers Markdown, Vue components, and the VitePress config.

To produce a production build (sync → TypeDoc → VitePress → `llms.txt`):

```bash
pnpm --filter @graphorin/docs build:site

# or, from the repo root, the convenience alias:
pnpm docs:build
```

The output is written to [`.vitepress/dist`](./.vitepress/dist).

## Structure

```text
documentation/
  .vitepress/        VitePress config + theme + sidebar/nav
  public/            static assets (logo, favicon, llms.txt, robots.txt)
  guide/             narrative documentation
  reference/         packages list, design principles, glossary, FAQ
  contributing/      mirrored project Markdown (CONTRIBUTING / SECURITY / …)
  api/               TypeDoc-generated API reference (gitignored)
  scripts/           sync + llms.txt + helper scripts
```

## Deployment

The [`docs`](../.github/workflows/docs.yml) GitHub Actions workflow builds the site on every pull request and deploys to Cloudflare Pages on every push to `main`. The deploy job is gated on the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets — when they are not yet provisioned, the job emits a warning and exits cleanly, matching the existing `release.yml` `NPM_TOKEN` pattern.

## License

Distributed under the [MIT License](../LICENSE). © 2026 Oleksiy Stepurenko.
