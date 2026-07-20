# @graphorin/secret-1password

## 0.13.8

### Patch Changes

- [#233](https://github.com/o-stepper/graphorin/pull/233) [`82f332f`](https://github.com/o-stepper/graphorin/commit/82f332fa4c6ea4dc47436dc52e8a00f5a7415238) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the 1Password CLI invocation: `op read` has no `--reveal` flag (that flag belongs to `op item get`), so every resolve failed with `unknown flag: --reveal` against the real CLI (verified on op 2.35.0). The wrapper now spawns `op read --no-color '<uri>'`, argv-shape tests pin the exact spawn contract, and a real-binary integration leg (`GRAPHORIN_RUN_OP_INTEGRATION=1`, wired into the weekly `integration-real` workflow with a pinned op 2.35.0) proves the flags parse without any 1Password account. The `no accounts configured` stderr of op CLI 2.35+ is now classified `signed-out` with an actionable setup hint (desktop-app CLI integration, `op account add`, `OP_SERVICE_ACCOUNT_TOKEN`, or Connect) instead of `unknown`.

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/security@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/security@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/security@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/security@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/security@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/security@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/security@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/security@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/security@0.13.0
  - @graphorin/core@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/security@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/security@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/security@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.2
  - @graphorin/security@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/security@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/security@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/security@0.9.0

## 0.8.0

### Patch Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Recognize the 1Password CLI v2 signed-out message (E-15, S-17/6): `classifyExitError` now matches `not (currently )?signed in`, so the canonical op v2 stderr line "you are not currently signed in. Please run `op signin --help` for instructions" classifies as `kind: 'signed-out'` with the actionable signin / `OP_SERVICE_ACCOUNT_TOKEN` hint instead of degrading to `unknown` with the generic hint. Adds classifier regression tests driven by realistic op stderr lines (v2 signed-out, legacy signed-out, session expired, v2 not-found, unknown).

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/security@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

### Patch Changes

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/security@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1
  - @graphorin/security@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627)]:
  - @graphorin/core@0.6.0
  - @graphorin/security@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release of the reference 1Password secret-resolver adapter for the
  Graphorin framework. Registers the `op://` scheme on top of the
  `@graphorin/security` resolver registry, shells out to the official
  1Password CLI, and serves as the canonical template community packages
  should follow when wiring HashiCorp Vault, AWS Secrets Manager, GCP
  Secret Manager, Azure Key Vault, Bitwarden, or Unix `pass`.
