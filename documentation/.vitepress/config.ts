import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { nav } from './nav.js';
import { graphorinDark, graphorinLight } from './shiki-themes.js';
import { sidebar } from './sidebar.js';

const here = dirname(fileURLToPath(import.meta.url));

const rootPkg = JSON.parse(readFileSync(resolve(here, '..', '..', 'package.json'), 'utf8')) as {
  version: string;
};

const VERSION = rootPkg.version;
const SITE_URL = 'https://docs.graphorin.com';
const REPO_URL = 'https://github.com/o-stepper/graphorin';
const HOME_URL = 'https://graphorin.com';

const baseConfig = defineConfig({
  lang: 'en-US',
  title: 'Graphorin',
  titleTemplate: ':title - Graphorin',
  description:
    'TypeScript framework for building long-living personal AI assistants - six-tier memory, durable workflow, observability, secrets, and an optional standalone runtime.',
  cleanUrls: true,
  lastUpdated: true,
  // The TypeDoc-generated tree links to per-package README anchors and
  // `_media/` artefacts that we deliberately omit (`readme: "none"` in
  // `typedoc.json`). Ignore dead links only inside `/api/**` plus the
  // relative forms TypeDoc emits; narrative pages still fail the build
  // on a real broken link.
  ignoreDeadLinks: [/^\/api\//, /_media\//, /\/README$/, /\/LICENSE$/, 'localhostLinks'],
  metaChunk: true,
  appearance: 'dark',
  srcDir: '.',
  srcExclude: ['README.md', 'node_modules/**'],
  outDir: '.vitepress/dist',
  cacheDir: '.vitepress/cache',

  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Oleksiy Stepurenko' }],
    ['meta', { name: 'theme-color', content: '#E8590C' }],
    ['meta', { name: 'color-scheme', content: 'dark' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Graphorin' }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    ['meta', { property: 'og:title', content: 'Graphorin documentation' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'TypeScript framework for building long-living personal AI assistants - local-first, vendor-neutral, durable, observable, type-safe.',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Graphorin documentation' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          'TypeScript framework for building long-living personal AI assistants. MIT License. © 2026 Oleksiy Stepurenko.',
      },
    ],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
        crossorigin: '',
      },
    ],
  ],

  sitemap: {
    hostname: SITE_URL,
    // The root page is only a redirect stub (`index.md` + `public/_redirects`
    // send `/` to `/guide/`); keep it out of the sitemap so crawlers index
    // the guide directly.
    transformItems: (items) => items.filter((item) => item.url !== '' && item.url !== '/'),
  },

  markdown: {
    // Custom themes keyed to the graphite/terracotta site palette; the
    // stock github pair is blue-dominant and reads off-brand next to it.
    theme: { light: graphorinLight, dark: graphorinDark },
    lineNumbers: false,
    codeTransformers: [transformerTwoslash()],
    languages: ['ts', 'tsx', 'js', 'jsx', 'bash', 'json', 'yaml', 'md', 'mermaid'],
    image: { lazyLoading: true },
  },

  themeConfig: {
    siteTitle: 'Graphorin',
    logo: { src: '/logo.svg', alt: 'Graphorin' },
    // `/` is a redirect stub; send the navbar logo/title straight to the
    // guide so in-app navigation never bounces through it.
    logoLink: '/guide/',

    nav,
    sidebar,

    socialLinks: [{ icon: 'github', link: REPO_URL, ariaLabel: 'GitHub repository' }],

    editLink: {
      pattern: `${REPO_URL}/edit/main/documentation/:path`,
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
        translations: {
          button: { buttonText: 'Search docs', buttonAriaLabel: 'Search docs' },
          modal: {
            displayDetails: 'Display detailed list',
            resetButtonTitle: 'Reset search',
            backButtonTitle: 'Close search',
            noResultsText: 'No results for',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close',
            },
          },
        },
      },
    },

    outline: { level: [2, 3], label: 'On this page' },
    docFooter: { prev: 'Previous page', next: 'Next page' },

    footer: {
      message: `Released under the <a href="${REPO_URL}/blob/main/LICENSE">MIT License</a>. Graphorin · v${VERSION} · created and maintained by <a href="mailto:step.oleksiy@gmail.com">Oleksiy Stepurenko</a>.`,
      copyright: `© 2026 Oleksiy Stepurenko · <a href="${HOME_URL}">graphorin.com</a> · <a href="${REPO_URL}">github.com/o-stepper/graphorin</a>`,
    },
  },
});

export default withMermaid({
  ...baseConfig,
  vite: {
    resolve: {
      alias: {
        'vitepress-plugin-mermaid/Mermaid.vue': resolve(here, 'theme/components/DocsMermaid.vue'),
      },
    },
  },
  mermaid: {
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1A1A1E',
      primaryTextColor: '#F4F4F6',
      primaryBorderColor: '#36363D',
      lineColor: '#76767E',
      secondaryColor: '#131316',
      tertiaryColor: '#0B0B0D',
      mainBkg: '#131316',
      nodeTextColor: '#F4F4F6',
      edgeLabelBackground: '#0B0B0D',
    },
  },
  mermaidPlugin: {
    class: 'mermaid graphorin-mermaid',
  },
});
