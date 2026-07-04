/**
 * @graphorin/security — security primitives for the Graphorin
 * framework. Ships the `SecretValue` runtime-safe wrapper, the strict
 * `SecretRef` URI parser, four `SecretsStore` implementations, the
 * pluggable resolver registry, the per-tool ACL primitives, the
 * `createSecretsStore({ kind: 'auto' })` factory, the server token-
 * auth surface (HMAC-SHA256 + pepper, scope grammar, token CRUD,
 * verify pipeline), and the tamper-evident audit log primitives.
 *
 * The full documentation lives in the package `README.md`. Sub-package
 * sub-paths (e.g. `@graphorin/security/secrets`,
 * `@graphorin/security/auth`, `@graphorin/security/audit`) are
 * available for downstream packages that prefer a narrower import
 * surface.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export * from './audit/index.js';
export * from './auth/index.js';
export * from './dataflow/index.js';
export * from './guard/index.js';
export * from './guardrails/index.js';
export * from './hardening/index.js';
export * from './oauth/index.js';
export * from './policy/index.js';
export * from './sandbox/index.js';
export * from './secrets/index.js';
export * from './supply-chain/index.js';
