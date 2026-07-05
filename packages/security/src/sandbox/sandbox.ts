/**
 * `@graphorin/security` sandbox interface - the layered execution
 * surface tools and skills run inside.
 *
 * The framework's policy is **defence in depth**. Even when a tool
 * author forgets to set `sandboxPolicy`, the resolver picks a sane
 * default per DEC-148; even when an untrusted skill is loaded, the
 * resolver overrides any user choice with the mandatory tier. The
 * `Sandbox` interface is the polymorphic bottom of that pipeline.
 *
 * The interface intentionally extends the `Sandbox` contract from
 * `@graphorin/core` so downstream callers can keep the narrow
 * `SandboxRunOptions` / `SandboxResult` shape they already type
 * against, without having to import this package.
 *
 * @packageDocumentation
 */

import type {
  SandboxCode,
  Sandbox as SandboxContract,
  SandboxResult,
  SandboxRunOptions,
} from '@graphorin/core/contracts';

/**
 * Discriminator for the four built-in sandbox kinds. Custom adapters
 * may register additional kinds by declaring `(string & {})` literals
 * in user code.
 *
 * @stable
 */
export type SandboxKind = 'none' | 'worker-threads' | 'isolated-vm' | 'docker' | (string & {});

/**
 * Capability self-description. Each adapter advertises whether it
 * supports network blocking, filesystem blocking, and process-level
 * memory limits so the dispatcher can fall back gracefully when a
 * deployment requests a feature an adapter cannot satisfy.
 *
 * @stable
 */
export interface SandboxCapabilities {
  /** Adapter can block outgoing network calls. */
  readonly canBlockNetwork: boolean;
  /** Adapter can block filesystem access. */
  readonly canBlockFilesystem: boolean;
  /** Adapter can enforce a hard wall-clock timeout via signal/terminate. */
  readonly canEnforceTimeout: boolean;
  /** Adapter can enforce a memory limit (MB) on the executed code. */
  readonly canEnforceMemoryLimit: boolean;
}

/**
 * Concrete `Sandbox` implementation contract. Extends the core
 * interface with a discriminator + capability advertisement.
 *
 * @stable
 */
export interface SandboxImpl extends SandboxContract {
  /** Discriminator. */
  readonly kind: SandboxKind;
  /** What the adapter can enforce; surfaced through `resolveSandbox(...)`. */
  readonly capabilities: SandboxCapabilities;
}

export type { SandboxCode, SandboxResult, SandboxRunOptions };

/**
 * Per-tool / per-skill sandbox policy. The dispatcher resolves the
 * effective policy from the trust tier, the source, and any operator
 * overrides; downstream code consumes the resolved object verbatim.
 *
 * @stable
 */
export interface ResolvedSandboxPolicy {
  readonly kind: SandboxKind;
  /** Block outbound network calls. */
  readonly noNetwork: boolean;
  /** Block filesystem access. */
  readonly noFilesystem: boolean;
  /** Hard wall-clock timeout in milliseconds. */
  readonly timeoutMs: number;
  /** Memory ceiling in MB. */
  readonly maxMemoryMb: number;
  /** Whether the resolver mandated this policy regardless of operator preference. */
  readonly forced: boolean;
  /** Human-readable explanation surfaced through traces / WARN logs. */
  readonly reason: string;
}

/**
 * Default per-tier policies, per the canonical sandbox tier table.
 * Operator overrides are merged into these defaults inside
 * `resolveSandbox(...)`.
 *
 * @stable
 */
export const DEFAULT_TIMEOUTS_MS: Readonly<Record<SandboxKind, number>> = Object.freeze({
  none: 0,
  'worker-threads': 5_000,
  'isolated-vm': 5_000,
  docker: 30_000,
});

/**
 * Default per-tier memory limits (MB). The defaults follow the
 * canonical sandbox tier table - `worker-threads` 256 MB; mandatory
 * untrusted-skill tier 128 MB; `isolated-vm` 128 MB.
 *
 * @stable
 */
export const DEFAULT_MEMORY_LIMITS_MB: Readonly<Record<SandboxKind, number>> = Object.freeze({
  none: 0,
  'worker-threads': 256,
  'isolated-vm': 128,
  docker: 512,
});
