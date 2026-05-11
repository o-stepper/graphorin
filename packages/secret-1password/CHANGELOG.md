# @graphorin/secret-1password

## 0.1.0

### Minor Changes

- Initial release of the reference 1Password secret-resolver adapter for the
  Graphorin framework. Registers the `op://` scheme on top of the
  `@graphorin/security` resolver registry, shells out to the official
  1Password CLI, and serves as the canonical template community packages
  should follow when wiring HashiCorp Vault, AWS Secrets Manager, GCP
  Secret Manager, Azure Key Vault, Bitwarden, or Unix `pass`.
