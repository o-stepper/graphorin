import type { DefaultTheme } from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
  { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
  { text: 'Reference', link: '/reference/packages', activeMatch: '/reference/' },
  { text: 'API', link: '/api/', activeMatch: '/api/' },
  {
    text: 'Community',
    items: [
      { text: 'Contributing', link: '/contributing/' },
      { text: 'Code of Conduct', link: '/contributing/code-of-conduct' },
      { text: 'Security policy', link: '/contributing/security' },
      { text: 'Third-party notices', link: '/contributing/third-party-notices' },
    ],
  },
  { text: 'Website', link: 'https://graphorin.com' },
];
