---
'@graphorin/eslint-plugin': patch
---

fix(eslint-plugin): ship a flat-config recommended preset (PS-17)

`configs.recommended` used the legacy `.eslintrc` shape (`plugins:
['@graphorin']`) while the package declares `eslint >= 9` as a peer — where flat
config is the default and the string-array `plugins` form is unusable. Flat-config
consumers couldn't apply the preset and had to hand-wire all ten rules; the
README even documented the broken spread.

A new `configs['flat/recommended']` maps the `@graphorin` namespace to the plugin
object (`plugins: { '@graphorin': plugin }`) with the same severities. The legacy
`recommended` is retained for ESLint 8. The README's flat-config example now
points at `flat/recommended`.

Red-first: a smoke test spreads `flat/recommended` into a `Linter` flat-config
array and asserts a fixture triggers `@graphorin/no-implicit-network-call`.
