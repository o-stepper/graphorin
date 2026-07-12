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
 * Reads the TypeDoc-generated sidebar (when present) and returns a
 * VitePress sidebar block. The file is emitted by `typedoc-vitepress-theme`
 * into `api/typedoc-sidebar.json` on every `pnpm build:typedoc` run.
 *
 * Returns an empty list when the API has not been generated yet (e.g.
 * during `pnpm dev` before the first TypeDoc run).
 */
function loadTypedocSidebar(): DefaultTheme.SidebarItem[] {
  const sidebarPath = resolve(here, '..', 'api', 'typedoc-sidebar.json');
  if (!existsSync(sidebarPath)) {
    return [
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
    ];
  }
  try {
    const raw = readFileSync(sidebarPath, 'utf8');
    const parsed = JSON.parse(raw) as DefaultTheme.SidebarItem[];
    return [
      {
        text: 'API reference',
        collapsed: false,
        items: parsed,
      },
    ];
  } catch (err) {
    console.warn(
      '[graphorin/docs] Failed to read typedoc-sidebar.json:',
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export const sidebar: DefaultTheme.Sidebar = {
  '/guide/': guideSidebar,
  '/reference/': referenceSidebar,
  '/contributing/': contributingSidebar,
  '/api/': loadTypedocSidebar(),
};
