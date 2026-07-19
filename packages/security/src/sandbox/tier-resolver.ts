/**
 * `resolveSandbox(...)` - picks the effective sandbox policy for a
 * tool / skill / trust-level triple per DEC-148.
 *
 * Defaults follow the canonical sandbox tier table:
 *
 * | Source                              | Effective policy |
 * |-------------------------------------|------------------|
 * | Built-in trusted (`'built-in'`)     | `none`           |
 * | User-defined inline (default)       | `worker-threads` (5 s timeout, 256 MB) |
 * | Skill `graphorin-trust-level: trusted` | `worker-threads` per skill frontmatter |
 * | Skill `graphorin-trust-level: untrusted` | **`worker-threads + no-network + no-filesystem`** mandatory; user overrides ignored + WARN |
 * | High-security explicit opt-in       | `isolated-vm` (peer dep) with auto-fallback |
 * | Heavy / coding-agent tools          | `docker` (peer dep) |
 *
 * The resolver returns a `ResolvedSandboxPolicy` with `forced: true`
 * whenever the operator's choice was overridden, plus a
 * `reason` string surfaced through traces / WARN logs so deployments
 * can audit which choices the framework refused to honour.
 *
 * @packageDocumentation
 */

import {
  DEFAULT_MEMORY_LIMITS_MB,
  DEFAULT_TIMEOUTS_MS,
  type ResolvedSandboxPolicy,
  type SandboxKind,
} from './sandbox.js';

/**
 * Trust level discriminator. The union mirrors the
 * `graphorin-trust-level` frontmatter axis from the skills loader,
 * plus the synthetic `'built-in'` value used by trusted built-in tools.
 *
 * @stable
 */
export type SandboxTrustLevel = 'built-in' | 'user-defined' | 'trusted' | 'untrusted';

/**
 * Operator-supplied policy override. Mirrors `Tool.sandboxPolicy` from
 * `@graphorin/core`, plus optional override fields the operator can
 * tune per tool.
 *
 * @stable
 */
export interface SandboxPolicyOverride {
  readonly kind?: SandboxKind;
  readonly noNetwork?: boolean;
  readonly noFilesystem?: boolean;
  readonly timeoutMs?: number;
  readonly maxMemoryMb?: number;
}

/**
 * Input to `resolveSandbox(...)`. The fields are intentionally
 * decoupled from `Tool` / `Skill` types so the resolver can be reused
 * by the agent runtime, the skills loader, and the MCP client without
 * a circular dependency.
 *
 * @stable
 */
export interface ResolveSandboxInput {
  readonly trustLevel: SandboxTrustLevel;
  readonly toolName?: string;
  readonly skillName?: string;
  readonly override?: SandboxPolicyOverride;
}

/**
 * Resolve the effective sandbox policy. Pure function; side-effect
 * free (the caller is responsible for emitting any WARN / audit
 * entry).
 *
 * @stable
 */
export function resolveSandbox(input: ResolveSandboxInput): ResolvedSandboxPolicy {
  const override = input.override ?? {};

  if (input.trustLevel === 'built-in') {
    return Object.freeze({
      kind: 'none',
      noNetwork: false,
      noFilesystem: false,
      timeoutMs: 0,
      maxMemoryMb: 0,
      forced: false,
      reason: "trustLevel === 'built-in' → NoneSandbox per DEC-148",
    });
  }

  if (input.trustLevel === 'untrusted') {
    const operatorRequestedDifferent =
      override.kind !== undefined && override.kind !== 'worker-threads';
    const operatorRelaxedNetwork = override.noNetwork === false;
    const operatorRelaxedFs = override.noFilesystem === false;
    const forced = operatorRequestedDifferent || operatorRelaxedNetwork || operatorRelaxedFs;
    const reasonParts = [
      "trustLevel === 'untrusted' → mandatory `worker-threads + no-network + no-filesystem` per DEC-148",
    ];
    if (operatorRequestedDifferent) reasonParts.push(`override kind=${override.kind} ignored`);
    if (operatorRelaxedNetwork) reasonParts.push('override noNetwork=false ignored');
    if (operatorRelaxedFs) reasonParts.push('override noFilesystem=false ignored');
    // SDF-10: an untrusted (forced) tier must keep a positive wall-clock
    // limit - `timeoutMs:0` (meaning "unbounded") is ignored and falls
    // back to the tier default; the coercion is itself a forced action.
    const untrustedTimeout = clampForcedTimeout(
      override.timeoutMs,
      DEFAULT_TIMEOUTS_MS['worker-threads'],
    );
    if (override.timeoutMs !== undefined && override.timeoutMs <= 0) {
      reasonParts.push(`override timeoutMs=${override.timeoutMs} ignored (mandatory wall-clock)`);
    }
    return Object.freeze({
      kind: 'worker-threads',
      noNetwork: true,
      noFilesystem: true,
      timeoutMs: untrustedTimeout,
      maxMemoryMb: clampMemory(override.maxMemoryMb, 128),
      forced: forced || (override.timeoutMs !== undefined && override.timeoutMs <= 0),
      reason: reasonParts.join('; '),
    });
  }

  // 'user-defined' or 'trusted' - operator override wins.
  const kind = override.kind ?? 'worker-threads';
  return Object.freeze({
    kind,
    noNetwork: override.noNetwork ?? false,
    noFilesystem: override.noFilesystem ?? false,
    timeoutMs: clampTimeout(
      override.timeoutMs,
      DEFAULT_TIMEOUTS_MS[kind] ?? DEFAULT_TIMEOUTS_MS['worker-threads'],
    ),
    maxMemoryMb: clampMemory(
      override.maxMemoryMb,
      DEFAULT_MEMORY_LIMITS_MB[kind] ?? DEFAULT_MEMORY_LIMITS_MB['worker-threads'],
    ),
    forced: false,
    reason:
      input.trustLevel === 'trusted'
        ? "trustLevel === 'trusted' → honour operator policy (default worker-threads)"
        : "trustLevel === 'user-defined' → honour operator policy (default worker-threads)",
  });
}

function clampTimeout(value: number | undefined, fallback: number): number {
  if (value === undefined || value < 0) return fallback;
  return value;
}

/**
 * Like `clampTimeout` but for forced (untrusted) tiers - a
 * non-positive value means "no limit", which is never acceptable here:
 * coerce it to the tier default instead.
 */
function clampForcedTimeout(value: number | undefined, fallback: number): number {
  if (value === undefined || value <= 0) return fallback;
  return value;
}

function clampMemory(value: number | undefined, fallback: number): number {
  if (value === undefined || value <= 0) return fallback;
  return value;
}
