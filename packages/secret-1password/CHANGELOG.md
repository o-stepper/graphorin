# @graphorin/secret-1password

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
