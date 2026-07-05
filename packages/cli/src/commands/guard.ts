/**
 * `graphorin guard` - inspect the memory-modification guard tier
 * policy.
 *
 * Surface (per Phase 15 § Guard):
 *
 *  - `graphorin guard status` - print the four tiers + their guard
 *    variants (per DEC-153).
 *  - `graphorin guard explain <toolName>` - derive the tier the
 *    classifier would assign to a tool with the supplied trust class
 *    and tags. The CLI accepts the metadata via `--tags` /
 *    `--trust-level` / `--allowed-secrets` so the explain operation
 *    matches the runtime classifier without requiring the operator to
 *    boot the agent.
 *
 * @packageDocumentation
 */

import {
  type ClassifiableTool,
  classifyTool,
  guardVariantForTier,
  type MemoryGuardTier,
} from '@graphorin/security';

import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface GuardCommonOptions extends CommonOutputOptions {}

const TIERS: ReadonlyArray<MemoryGuardTier> = Object.freeze([
  'pure',
  'side-effecting-no-memory',
  'memory-aware',
  'unknown',
  'untrusted',
] as const);

/** @stable */
export interface GuardStatusEntry {
  readonly tier: MemoryGuardTier;
  readonly variant: ReturnType<typeof guardVariantForTier>;
  readonly description: string;
}

/** @stable */
export function runGuardStatus(options: GuardCommonOptions = {}): ReadonlyArray<GuardStatusEntry> {
  const rows: GuardStatusEntry[] = TIERS.map((tier) =>
    Object.freeze({
      tier,
      variant: guardVariantForTier(tier),
      description: descriptionFor(tier),
    }),
  );
  emitReport(options, rows, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand('memory-modification guard tiers (DEC-153):'));
    for (const row of rows) {
      print(`  ${statusMarker('info')} ${row.tier} -> ${row.variant} (${row.description})`);
    }
  });
  return rows;
}

/** @stable */
export interface GuardExplainOptions extends GuardCommonOptions {
  readonly toolName: string;
  readonly tags?: ReadonlyArray<string>;
  readonly secretsAllowed?: ReadonlyArray<string>;
  readonly trustLevel?: 'built-in' | 'user-defined' | 'trusted' | 'untrusted';
  readonly explicitTier?: MemoryGuardTier;
}

/** @stable */
export interface GuardExplainResult {
  readonly toolName: string;
  readonly tier: MemoryGuardTier;
  readonly variant: ReturnType<typeof guardVariantForTier>;
  readonly reason: string;
}

/** @stable */
export function runGuardExplain(options: GuardExplainOptions): GuardExplainResult {
  const tool: ClassifiableTool = {
    name: options.toolName,
    ...(options.tags !== undefined ? { tags: options.tags } : {}),
    ...(options.secretsAllowed !== undefined ? { secretsAllowed: options.secretsAllowed } : {}),
    ...(options.trustLevel !== undefined ? { trustLevel: options.trustLevel } : {}),
    ...(options.explicitTier !== undefined ? { memoryGuardTier: options.explicitTier } : {}),
  };
  const tier = classifyTool(tool);
  const variant = guardVariantForTier(tier);
  const reason = explainReason(tool, tier);
  const result: GuardExplainResult = Object.freeze({
    toolName: options.toolName,
    tier,
    variant,
    reason,
  });
  emitReport(options, result, () => {
    const print = options.print ?? defaultPrintSink;
    print(
      brand(
        `${statusMarker('info')} ${result.toolName} -> tier=${result.tier} (variant=${result.variant})`,
      ),
    );
    print(`  reason: ${result.reason}`);
  });
  return result;
}

function descriptionFor(tier: MemoryGuardTier): string {
  switch (tier) {
    case 'pure':
      return 'no side effects, no guard required';
    case 'side-effecting-no-memory':
      return 'side effects but no long-term memory writes';
    case 'memory-aware':
      return 'API-boundary guard around memory operations';
    case 'unknown':
      return 'audit-only guard (default for unclassified tools)';
    case 'untrusted':
      return 'strict full guard with xxhash integrity check';
  }
}

function explainReason(tool: ClassifiableTool, tier: MemoryGuardTier): string {
  if (tool.memoryGuardTier !== undefined) {
    return `operator-set memoryGuardTier='${tool.memoryGuardTier}' (precedence wins)`;
  }
  if (tool.trustLevel === 'untrusted') {
    return `trustLevel='untrusted' forces tier='untrusted'`;
  }
  if (tier === 'memory-aware') {
    return `tags / secretsAllowed / name match the default memory-tag patterns`;
  }
  return `default classification (no memory hints found in tags / secretsAllowed)`;
}
