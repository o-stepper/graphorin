/**
 * Typed error classes raised by `@graphorin/memory`. Every memory
 * subsystem throws one of these instead of plain `Error` so consumers
 * can pattern-match on `kind` and `name` without parsing the message.
 *
 * @packageDocumentation
 */

/**
 * Base class for every error raised by `@graphorin/memory`. Carries a
 * stable lowercase `kind` discriminator and an optional `hint`
 * surfaced to operators (CLI command / docs link to fix the issue).
 *
 * @stable
 */
export abstract class GraphorinMemoryError extends Error {
  /** Stable lowercase discriminator. */
  abstract readonly kind: string;
  /** Optional actionable hint surfaced to operators. */
  readonly hint?: string;

  constructor(message: string, options?: { cause?: unknown; hint?: string }) {
    super(message, options !== undefined && 'cause' in options ? { cause: options.cause } : {});
    if (options?.hint !== undefined) {
      this.hint = options.hint;
    }
  }
}

/**
 * Raised when a memory write would reference an embedder that is not
 * registered in the storage layer's `embedding_meta` registry.
 *
 * @stable
 */
export class EmbedderRegistrationError extends GraphorinMemoryError {
  override readonly name = 'EmbedderRegistrationError';
  readonly kind = 'embedder-registration' as const;
  readonly embedderId: string;

  constructor(embedderId: string, options?: { cause?: unknown }) {
    super(
      `[graphorin/memory] embedder '${embedderId}' is not registered. ` +
        'createMemory({ embedder, ... }) registers the configured embedder; ' +
        'manual writes must reference an already-registered embedder_id.',
      {
        ...(options?.cause !== undefined ? { cause: options.cause } : {}),
        hint: 'Pass `embedder` to createMemory(...) so the registration runs at startup.',
      },
    );
    this.embedderId = embedderId;
  }
}

/**
 * Raised when a memory tool is invoked outside the per-tool ACL or the
 * memory-modification guard tier rejects the call.
 *
 * @stable
 */
export class MemoryToolDeniedError extends GraphorinMemoryError {
  override readonly name = 'MemoryToolDeniedError';
  readonly kind = 'memory-tool-denied' as const;
  readonly toolName: string;
  readonly reason: string;

  constructor(toolName: string, reason: string) {
    super(`[graphorin/memory] memory tool '${toolName}' was denied: ${reason}`, {
      hint: 'Check the tool authorisation matrix and the memory-modification guard tier policy.',
    });
    this.toolName = toolName;
    this.reason = reason;
  }
}

/**
 * Raised by `WorkingMemory` when a write would exceed the declared
 * `charLimit` and the overflow policy is `'reject'`.
 *
 * @stable
 */
export class WorkingBlockOverflowError extends GraphorinMemoryError {
  override readonly name = 'WorkingBlockOverflowError';
  readonly kind = 'working-block-overflow' as const;
  readonly label: string;
  readonly attempted: number;
  readonly charLimit: number;

  constructor(label: string, attempted: number, charLimit: number) {
    super(
      `[graphorin/memory] working block '${label}' overflow: attempted ${attempted} chars, limit is ${charLimit}.`,
      {
        hint: "Switch the block's overflow policy to 'truncate' or shorten the input.",
      },
    );
    this.label = label;
    this.attempted = attempted;
    this.charLimit = charLimit;
  }
}

/**
 * Raised by `WorkingMemory.replace(...)` when the supplied unique
 * substring is not present (or appears more than once) in the block
 * value.
 *
 * @stable
 */
export class WorkingBlockReplaceMismatchError extends GraphorinMemoryError {
  override readonly name = 'WorkingBlockReplaceMismatchError';
  readonly kind = 'working-block-replace-mismatch' as const;
  readonly label: string;
  readonly occurrences: number;

  constructor(label: string, occurrences: number) {
    super(
      `[graphorin/memory] block_replace on '${label}' expected exactly one occurrence of the unique substring, found ${occurrences}.`,
      {
        hint: 'Pass a longer unique substring or use block_rethink to replace the entire value.',
      },
    );
    this.label = label;
    this.occurrences = occurrences;
  }
}

/**
 * Raised by the embedder migration runner when the operator attempts a
 * silent embedder swap under the `lock-on-first` policy.
 *
 * @stable
 */
export class EmbedderMigrationLockedError extends GraphorinMemoryError {
  override readonly name = 'EmbedderMigrationLockedError';
  readonly kind = 'embedder-migration-locked' as const;
  readonly source: string;
  readonly target: string;

  constructor(source: string, target: string) {
    super(
      `[graphorin/memory] cannot swap embedder from '${source}' to '${target}' under the 'lock-on-first' policy. ` +
        'Run `graphorin memory migrate` (Phase 15) or pass `policy: "auto-migrate"` / "multi-active".',
      {
        hint: 'Plan an explicit migration before swapping the active embedder.',
      },
    );
    this.source = source;
    this.target = target;
  }
}

/**
 * Raised by `migrateEmbedder(...)` when the runner is interrupted via
 * `AbortSignal`. The surrounding `for-await` loop receives this error
 * so the operator can resume from the persisted cursor on the next
 * invocation.
 *
 * @stable
 */
export class EmbedderMigrationAbortedError extends GraphorinMemoryError {
  override readonly name = 'EmbedderMigrationAbortedError';
  readonly kind = 'embedder-migration-aborted' as const;
  readonly migrationId: string;

  constructor(migrationId: string) {
    super(
      `[graphorin/memory] embedder migration '${migrationId}' aborted before completion. ` +
        'The migration cursor is persisted in `migration_state`; resume by re-running `migrateEmbedder(...)`.',
      {
        hint: 'Re-invoke migrateEmbedder(...) to resume from the persisted cursor.',
      },
    );
    this.migrationId = migrationId;
  }
}

/**
 * Raised by the migration runner when the persisted `migration_state`
 * row references embedders that are no longer registered (e.g. the
 * operator removed the underlying tables manually).
 *
 * @stable
 */
export class EmbedderMigrationStateError extends GraphorinMemoryError {
  override readonly name = 'EmbedderMigrationStateError';
  readonly kind = 'embedder-migration-state' as const;

  constructor(message: string) {
    super(`[graphorin/memory] ${message}`, {
      hint: 'Inspect the migration_state table; abort the broken row before retrying.',
    });
  }
}

/**
 * Raised by {@link SemanticMemory.validate} (P1-4 / MRET-3) when a caller
 * tries to promote a fact whose quarantine was triggered by the offline
 * injection heuristics. Such a fact is a memory-poisoning candidate: the
 * agent's own `fact_validate` tool must never be able to admit it into
 * action-driving recall, so promotion is refused unless an operator
 * passes the explicit `force` flag through the programmatic API.
 *
 * @stable
 */
export class QuarantinePromotionRefusedError extends GraphorinMemoryError {
  override readonly name = 'QuarantinePromotionRefusedError';
  readonly kind = 'quarantine-promotion-refused' as const;
  readonly factId: string;
  /** Injection-rule labels that tripped on the fact's text. */
  readonly markers: ReadonlyArray<string>;

  constructor(factId: string, markers: ReadonlyArray<string>) {
    super(
      `[graphorin/memory] refusing to promote fact '${factId}' out of quarantine: ` +
        `its text trips the injection heuristics (${markers.join(', ')}). ` +
        'Promotion of an injection-flagged memory is an operator action — ' +
        'pass `{ force: true }` to validate(...) from a trusted (non-agent) caller after review.',
      {
        hint: 'Review the quarantined fact, then promote it with validate(scope, id, reason, { force: true }) from an operator context.',
      },
    );
    this.factId = factId;
    this.markers = Object.freeze([...markers]);
  }
}

/**
 * Raised when {@link ProceduralMemory.induce} (P2-2) is called but no
 * workflow inducer was configured. Induction abstracts concrete values into
 * variables, which needs a provider — so the capability is opt-in and the
 * default (offline) procedural tier never silently no-ops a requested
 * induction.
 *
 * @stable
 */
export class ProcedureInductionNotConfiguredError extends GraphorinMemoryError {
  override readonly name = 'ProcedureInductionNotConfiguredError';
  readonly kind = 'procedure-induction-not-configured' as const;

  constructor(options?: { cause?: unknown }) {
    super(
      '[graphorin/memory] procedure induction requires a provider. ' +
        'ProceduralMemory.induce(...) needs an inducer to abstract values into ' +
        'variables; enable it with createMemory({ procedureInduction: { provider } }).',
      {
        ...(options?.cause !== undefined ? { cause: options.cause } : {}),
        hint: 'Pass `procedureInduction: { provider }` to createMemory(...).',
      },
    );
  }
}
