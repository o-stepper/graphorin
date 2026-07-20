import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DefaultTheme } from 'vitepress';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The narrative `/guide/` sidebar - one entry per public-facing topic.
 *
 * Sourced exclusively from the public surface of the framework (package
 * READMEs, top-level project files, source-level TSDoc, public CHANGELOG,
 * and the landing page).
 */
const guideSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Introduction',
    collapsed: false,
    items: [
      { text: 'What is Graphorin?', link: '/guide/' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'Quickstart', link: '/guide/quickstart' },
      { text: 'Minimal profile', link: '/guide/minimal-profile' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Privacy & no-phone-home', link: '/guide/privacy' },
    ],
  },
  {
    text: 'Core subsystems',
    collapsed: false,
    items: [
      { text: 'Agent runtime', link: '/guide/agent-runtime' },
      { text: 'Memory system', link: '/guide/memory-system' },
      { text: 'Workflow engine', link: '/guide/workflow-engine' },
      { text: 'Proactivity', link: '/guide/proactivity' },
      { text: 'Sessions', link: '/guide/sessions' },
      { text: 'Persistence', link: '/guide/persistence' },
      { text: 'Storage backends', link: '/guide/storage' },
    ],
  },
  {
    text: 'External surface',
    collapsed: false,
    items: [
      { text: 'Tools', link: '/guide/tools' },
      { text: 'Skills', link: '/guide/skills' },
      { text: 'MCP client', link: '/guide/mcp-client' },
      { text: 'Channels', link: '/guide/channels' },
      { text: 'Providers', link: '/guide/providers' },
      { text: 'Embedders', link: '/guide/embedders' },
      { text: 'Rerankers', link: '/guide/rerankers' },
    ],
  },
  {
    text: 'Operations',
    collapsed: false,
    items: [
      { text: 'Observability', link: '/guide/observability' },
      { text: 'Evals & benchmarks', link: '/guide/evals' },
      { text: 'Performance & scale', link: '/guide/performance' },
      { text: 'Benchmarks', link: '/guide/benchmarks' },
      { text: 'Security', link: '/guide/security' },
      { text: 'Secrets', link: '/guide/secrets' },
      { text: 'Standalone server', link: '/guide/standalone-server' },
      { text: 'CLI', link: '/guide/cli' },
      { text: 'Deployment', link: '/guide/deployment' },
      { text: 'Troubleshooting', link: '/guide/troubleshooting' },
      { text: 'Migration (pre-1.0)', link: '/guide/migration' },
    ],
  },
  {
    text: 'Examples',
    collapsed: false,
    items: [{ text: 'Example apps', link: '/guide/examples' }],
  },
];

const referenceSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Reference',
    collapsed: false,
    items: [
      { text: 'Packages', link: '/reference/packages' },
      { text: 'Design principles', link: '/reference/design-principles' },
      { text: 'Glossary', link: '/reference/glossary' },
      { text: 'Pricing snapshot', link: '/reference/pricing' },
      { text: 'Changelog', link: '/reference/changelog' },
      { text: 'FAQ', link: '/reference/faq' },
      { text: 'Troubleshooting', link: '/guide/troubleshooting' },
      { text: 'Migration (pre-1.0)', link: '/guide/migration' },
    ],
  },
];

const contributingSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Contributing',
    collapsed: false,
    items: [
      { text: 'Contributing guide', link: '/contributing/' },
      { text: 'Code of Conduct', link: '/contributing/code-of-conduct' },
      { text: 'Security policy', link: '/contributing/security' },
      { text: 'Third-party notices', link: '/contributing/third-party-notices' },
    ],
  },
];

/**
 * Prunes the TypeDoc sidebar tree to package / module level.
 *
 * VitePress server-renders the ENTIRE sidebar DOM into every `/api/**`
 * page. The full symbol tree (~780 nodes) weighed ~320 KB per page -
 * 90% of a typical 357 KB API page - which multiplied across ~3200
 * pages into ~1 GB of the dist. Category nodes ("Classes",
 * "Interfaces", ...) carry no link of their own, so dropping every
 * linkless node prunes exactly the symbol tier while keeping the
 * linked package and module index pages; symbols stay reachable
 * through the member tables on each module page and via
 * `llms-api.txt`. Guarded by the docs-dist budget gate in docs.yml.
 */
function pruneToModuleLevel(items: DefaultTheme.SidebarItem[]): DefaultTheme.SidebarItem[] {
  const pruned: DefaultTheme.SidebarItem[] = [];
  for (const item of items) {
    if (item.link === undefined) continue;
    const children = item.items === undefined ? [] : pruneToModuleLevel(item.items);
    pruned.push({
      text: item.text,
      link: item.link,
      ...(children.length > 0 ? { items: children, collapsed: true } : {}),
    });
  }
  return pruned;
}

/** A bare package link without its module children. */
function packageLinkOnly(item: DefaultTheme.SidebarItem): DefaultTheme.SidebarItem {
  return { text: item.text, ...(item.link !== undefined ? { link: item.link } : {}) };
}

/**
 * Builds one sidebar entry per package path prefix. Every `/api/**` page
 * lists all packages as bare links, and ONLY the current package (the
 * longest matching prefix, which VitePress resolves first) carries its
 * module children. Combined with {@link pruneToModuleLevel} this keeps
 * the per-page sidebar DOM at "29 links + a handful of modules" instead
 * of the full symbol forest, while the reader always sees the tree that
 * matters for the page they are on.
 */
function buildApiSidebar(
  tree: DefaultTheme.SidebarItem[],
): Record<string, DefaultTheme.SidebarItem[]> {
  const map: Record<string, DefaultTheme.SidebarItem[]> = {
    '/api/': [
      {
        text: 'API reference',
        collapsed: false,
        items: tree.map(packageLinkOnly),
      },
    ],
  };
  for (const pkg of tree) {
    if (pkg.link === undefined) continue;
    map[pkg.link] = [
      {
        text: 'API reference',
        collapsed: false,
        items: tree.map((p) =>
          p === pkg
            ? {
                text: p.text,
                ...(p.link !== undefined ? { link: p.link } : {}),
                ...(p.items !== undefined && p.items.length > 0
                  ? { items: p.items, collapsed: false }
                  : {}),
              }
            : packageLinkOnly(p),
        ),
      },
    ];
  }
  return map;
}

/**
 * Reads the TypeDoc-generated sidebar (when present) and returns the
 * per-prefix `/api/**` sidebar map. The source file is emitted by
 * `typedoc-vitepress-theme` into `api/typedoc-sidebar.json` on every
 * `pnpm build:typedoc` run.
 *
 * Returns a stub when the API has not been generated yet (e.g. during
 * `pnpm dev` before the first TypeDoc run).
 */
function loadTypedocSidebar(): Record<string, DefaultTheme.SidebarItem[]> {
  const sidebarPath = resolve(here, '..', 'api', 'typedoc-sidebar.json');
  if (!existsSync(sidebarPath)) {
    return {
      '/api/': [
        {
          text: 'API reference',
          collapsed: false,
          items: [
            {
              text: 'Run `pnpm build:typedoc` to generate',
              link: '/api/',
            },
          ],
        },
      ],
    };
  }
  try {
    const raw = readFileSync(sidebarPath, 'utf8');
    const parsed = JSON.parse(raw) as DefaultTheme.SidebarItem[];
    return buildApiSidebar(pruneToModuleLevel(parsed));
  } catch (err) {
    console.warn(
      '[graphorin/docs] Failed to read typedoc-sidebar.json:',
      err instanceof Error ? err.message : err,
    );
    return {};
  }
}

export const sidebar: DefaultTheme.Sidebar = {
  '/guide/': guideSidebar,
  '/reference/': referenceSidebar,
  '/contributing/': contributingSidebar,
  ...loadTypedocSidebar(),
};
