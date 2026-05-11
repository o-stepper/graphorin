/**
 * Helper functions that bridge skill-bundled `Tool` records into the
 * `@graphorin/tools` registry.
 *
 * The skills loader does not import the runtime registry directly —
 * downstream callers (the agent runtime in Phase 12, the test suite,
 * and any user-supplied bootstrap script) materialise the actual
 * `Tool[]` from the skill module surface and feed each one through
 * {@link stampSkillTool} to get a {@link Tool} + a {@link ToolSource}
 * pair the registry can register with the correct trust-class
 * derivation, sandbox tier propagation, and inbound-sanitization
 * defaults.
 *
 * @packageDocumentation
 */

import type { InboundSanitizationPolicy, SandboxPolicy, Tool, ToolSource } from '@graphorin/core';
import { resolveSandbox, type SandboxTrustLevel } from '@graphorin/security/sandbox';

import type { Skill, SkillMetadata } from '../types/index.js';

/** Result of {@link stampSkillTool}. */
export interface StampedSkillTool<TInput = unknown, TOutput = unknown, TDeps = unknown> {
  readonly tool: Tool<TInput, TOutput, TDeps>;
  readonly source: ToolSource;
  /** Resolved sandbox policy after the tier resolver ran. */
  readonly resolvedSandbox: ReturnType<typeof resolveSandbox>;
  /** `true` when the resolver overrode the operator's choice. */
  readonly sandboxForced: boolean;
  /** `true` when the inbound sanitization policy was upgraded to the untrusted default. */
  readonly inboundSanitizationForced: boolean;
}

/**
 * Stamp a skill-bundled tool with the metadata the
 * `@graphorin/tools` registry expects:
 *
 * 1. Derive a `ToolSource` of kind `'skill'` carrying the skill's
 *    name and trust level.
 * 2. Run `resolveSandbox(...)` so the resulting `Tool.sandboxPolicy`
 *    matches the mandatory tier for untrusted skills (DEC-148).
 * 3. Default the `inboundSanitization` policy to
 *    `'detect-and-strip-and-wrap'` for untrusted skills when the tool
 *    author left it unset; trusted skills inherit the operator's
 *    choice.
 *
 * The function returns a freshly-frozen `Tool` with the resolved
 * `sandboxPolicy` and `inboundSanitization` baked in so downstream
 * registries cannot accidentally re-inherit a relaxed policy.
 *
 * @stable
 */
export function stampSkillTool<TInput = unknown, TOutput = unknown, TDeps = unknown>(
  tool: Tool<TInput, TOutput, TDeps>,
  skill: Pick<Skill, 'metadata'>,
): StampedSkillTool<TInput, TOutput, TDeps> {
  return stampSkillToolFromMetadata(tool, skill.metadata);
}

/**
 * Lower-level variant accepting a raw {@link SkillMetadata} so
 * fixtures and tests do not have to materialise a full {@link Skill}.
 *
 * @stable
 */
export function stampSkillToolFromMetadata<TInput = unknown, TOutput = unknown, TDeps = unknown>(
  tool: Tool<TInput, TOutput, TDeps>,
  metadata: SkillMetadata,
): StampedSkillTool<TInput, TOutput, TDeps> {
  const trustLevel = mapTrustLevel(metadata.graphorinTrustLevel);
  const sandboxResolverArgs: Parameters<typeof resolveSandbox>[0] = {
    trustLevel,
  };
  if (tool.name !== undefined)
    (sandboxResolverArgs as Mutable<typeof sandboxResolverArgs>).toolName = tool.name;
  if (metadata.name !== undefined)
    (sandboxResolverArgs as Mutable<typeof sandboxResolverArgs>).skillName = metadata.name;
  const operatorOverride = sandboxOverrideFromTool(tool);
  if (operatorOverride !== undefined)
    (sandboxResolverArgs as Mutable<typeof sandboxResolverArgs>).override = operatorOverride;
  const resolvedSandbox = resolveSandbox(sandboxResolverArgs);
  const inboundSanitization = inboundSanitizationFor(tool, metadata.graphorinTrustLevel);
  const stamped: Mutable<Tool<TInput, TOutput, TDeps>> = {
    ...tool,
    sandboxPolicy: mapSandboxKindToPolicy(resolvedSandbox.kind),
    ...(inboundSanitization === undefined ? {} : { inboundSanitization }),
  };
  const source: ToolSource = Object.freeze({
    kind: 'skill' as const,
    skillName: metadata.name,
    // 'unknown' inherits the strict sandbox policy of 'untrusted', so
    // the agent runtime registers the source as untrusted too — that
    // forces the inbound-sanitization default
    // ('detect-and-strip-and-wrap') and the precedence ladder used by
    // collision resolution to demote it relative to first-party
    // / trusted-skill registrations.
    trustLevel:
      metadata.graphorinTrustLevel === 'untrusted' || metadata.graphorinTrustLevel === 'unknown'
        ? 'untrusted'
        : 'trusted',
  });
  return Object.freeze({
    tool: Object.freeze(stamped) as Tool<TInput, TOutput, TDeps>,
    source,
    resolvedSandbox,
    sandboxForced: resolvedSandbox.forced,
    inboundSanitizationForced:
      inboundSanitization !== undefined && tool.inboundSanitization === undefined,
  });
}

function mapTrustLevel(level: SkillMetadata['graphorinTrustLevel']): SandboxTrustLevel {
  switch (level) {
    case 'untrusted':
    case 'unknown':
      // Phase 08 § Risks & mitigations: 'unknown' enforces sandbox
      // without requiring signature, so the sandbox tier resolver
      // applies the same strict policy as 'untrusted'.
      return 'untrusted';
    case 'trusted':
    case 'trusted-with-scripts':
      return 'trusted';
    default: {
      const exhaustive: never = level;
      void exhaustive;
      return 'user-defined';
    }
  }
}

function mapSandboxKindToPolicy(kind: ReturnType<typeof resolveSandbox>['kind']): SandboxPolicy {
  if (kind === 'none') return 'none';
  if (kind === 'worker-threads') return 'sandboxed';
  if (kind === 'isolated-vm') return 'isolated';
  if (kind === 'docker') return 'docker';
  return 'sandboxed';
}

function inboundSanitizationFor(
  tool: Pick<Tool, 'inboundSanitization'>,
  trustLevel: SkillMetadata['graphorinTrustLevel'],
): InboundSanitizationPolicy | undefined {
  if (tool.inboundSanitization !== undefined) return tool.inboundSanitization;
  if (trustLevel === 'untrusted' || trustLevel === 'unknown') {
    return 'detect-and-strip-and-wrap';
  }
  return undefined;
}

function sandboxOverrideFromTool(
  tool: Pick<Tool, 'sandboxPolicy'>,
): { readonly kind?: ReturnType<typeof resolveSandbox>['kind'] } | undefined {
  switch (tool.sandboxPolicy) {
    case undefined:
      return undefined;
    case 'none':
      return { kind: 'none' };
    case 'sandboxed':
      return { kind: 'worker-threads' };
    case 'isolated':
      return { kind: 'isolated-vm' };
    case 'docker':
      return { kind: 'docker' };
    default:
      return undefined;
  }
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
