import type { Message } from './message.js';

/**
 * Filter applied to the parent's message history when handing off control
 * to a target agent. Implementations live in `@graphorin/agent` (e.g.
 * `filters.lastN(10)`); the contract type lives here so every package
 * (server, sessions, observability, …) can type a parameter as
 * `HandoffFilter` without an agent dependency.
 *
 * The default for the agent runtime is `lastN(10)` (per the security-first
 * compose policy). Filters should be **pure** — they receive a frozen
 * history and return a fresh array.
 *
 * @stable
 */
export type HandoffFilter = (history: readonly Message[]) => readonly Message[];

/**
 * Declarative handoff target. The value carries a reference to the target
 * agent (`agentId` — looked up at runtime via the `AgentRegistry`) plus
 * optional metadata used by the runtime when constructing the
 * `transfer_to_<agentName>` virtual tool.
 *
 * @stable
 */
export interface Handoff {
  /** ID of the target agent (looked up via `AgentRegistry`). */
  readonly targetAgentId: string;
  /** Optional human-readable name, surfaced in the virtual tool name. */
  readonly targetAgentName?: string;
  /** Optional input filter applied to the parent's history. */
  readonly inputFilter?: HandoffFilter;
  /** Optional human-readable reason rendered in the audit log. */
  readonly reason?: string;
}

/**
 * Stable, serializable description of the input filter applied to a
 * handoff. Persisted alongside `HandoffRecord` and round-tripped through
 * the JSONL session export so a replay can re-construct the filter
 * stack even after the runtime filter implementations evolve.
 *
 * The discriminator `kind` is an open string union — well-known kinds
 * include `'full' | 'last-n' | 'last-user' | 'summary' |
 * 'sensitivity-filter' | 'compose' | 'custom'`. The accompanying `meta`
 * carries kind-specific data (for example `{ n: 10 }` for `'last-n'`,
 * `{ summary: '...' }` for `'summary'`, or
 * `{ messagesPassedCount, strippedReasoningCount, ... }` summary stats
 * for `'compose'`). New kinds may be added freely; consumers must not
 * assume an exhaustive switch.
 *
 * @stable
 */
export interface HandoffInputFilterDescriptor {
  readonly kind: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * How the parent's secrets surface is propagated to the sub-agent
 * during a handoff. The default — `'inherit-allowlist'` with an empty
 * inherited list — applies the principle of least authority: the sub-
 * agent inherits only the keys the operator has explicitly named.
 *
 * - `'inherit-allowlist'` — inherit the keys named in
 *   `inheritedSecrets`. Empty list = no inheritance.
 * - `'isolated'` — the sub-agent runs with an empty secrets surface.
 * - `'forward-explicit'` — every secret access on the sub-agent's side
 *   must be explicitly broadened by the operator with a recorded
 *   `secretsOverrideReason`.
 *
 * @stable
 */
export type HandoffSecretsInheritance = 'inherit-allowlist' | 'isolated' | 'forward-explicit';

/**
 * Recorded handoff event captured on `RunState.handoffs` and replayed by
 * the JSONL session export. The shape is wire-stable.
 *
 * @stable
 */
export interface HandoffRecord {
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly stepNumber: number;
  readonly at: string;
  readonly reason?: string;
  /**
   * Serializable input-filter descriptor applied at handoff time. When
   * undefined the runtime defaults applied (commonly
   * `compose(lastN(10), stripReasoning, stripSensitiveOutputs)`); the
   * concrete filter implementations live in `@graphorin/agent`.
   */
  readonly inputFilter?: HandoffInputFilterDescriptor;
  /**
   * Sub-agent secrets propagation policy. Defaults to
   * `'inherit-allowlist'` with empty `inheritedSecrets`.
   */
  readonly secretsInheritance?: HandoffSecretsInheritance;
  /**
   * Keys inherited by the sub-agent under the
   * `'inherit-allowlist'` / `'forward-explicit'` policies. Never the
   * secret values themselves — only the public key names.
   */
  readonly inheritedSecrets?: ReadonlyArray<string>;
  /**
   * Operator-supplied justification for broadening or narrowing the
   * default secrets surface. Surfaced in audit logs.
   */
  readonly secretsOverrideReason?: string;
}
