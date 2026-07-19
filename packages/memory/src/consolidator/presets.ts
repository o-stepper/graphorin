/**
 * Reviser preset - a ready-made consolidator configuration for the
 * sleep-time curation agent: a cheap provider
 * profile, an idle + cron cadence that actually reaches the deep phase
 * (deep runs only on cron / manual / budget triggers), the curated
 * blocks it maintains, and a HARD budget posture. The tier defaults for
 * `onExceed` at `standard`/`full` are `'log'` - acceptable for
 * interactive use, wrong for an unattended reviser, so this preset
 * REQUIRES `'pause' | 'throw'` and rejects `'log'` (the reviser
 * stays on the consolidator's own budget mechanism; the agent-level run
 * budget does not apply here).
 *
 * @packageDocumentation
 */

import type { Provider, SessionScope } from '@graphorin/core';
import type { CuratedBlockSpec } from './phases/learned-context.js';
import type { ConsolidatorCeilings, ConsolidatorTriggerSpec } from './types.js';

/** Options accepted by {@link reviserConsolidatorPreset}. */
export interface ReviserPresetOptions {
  /** The (cheap) provider the reviser's passes run on. */
  readonly provider: Provider;
  /** Scope the scheduled triggers fire under. */
  readonly defaultScope: SessionScope;
  /**
   * Curated blocks the reviser maintains. Default:
   * `[{ label: 'learned_context' }]`.
   */
  readonly curatedBlocks?: ReadonlyArray<CuratedBlockSpec>;
  /**
   * Cadence: the idle spec drives light+standard consolidation between
   * sessions; the cron spec is what reaches the DEEP phase (curated
   * blocks, reflection, conflict drain). Defaults:
   * `idle: 'idle:15m'`, `cron: 'cron:0 5 * * *'`.
   */
  readonly schedule?: {
    readonly idle?: ConsolidatorTriggerSpec;
    readonly cron?: ConsolidatorTriggerSpec;
  };
  /**
   * Budget posture. The preset refuses `'log'` (an unattended reviser
   * must stop, not narrate). Default `'pause'`.
   */
  readonly onExceed?: 'pause' | 'throw';
  /** Ceiling overrides on top of the `standard` tier defaults. */
  readonly ceilings?: Partial<ConsolidatorCeilings>;
  /** Enable the deep-phase reflection pass too. Default `false`. */
  readonly reflection?: boolean;
}

/**
 * The configuration object {@link reviserConsolidatorPreset} produces -
 * structurally assignable to `createMemory({ consolidator })`.
 *
 * @stable
 */
export interface ReviserConsolidatorConfig {
  readonly enabled: true;
  readonly tier: 'standard';
  readonly provider: Provider;
  readonly deepProvider: Provider;
  readonly defaultScope: SessionScope;
  readonly triggers: ReadonlyArray<ConsolidatorTriggerSpec>;
  readonly onExceed: 'pause' | 'throw';
  readonly reflection: boolean;
  readonly curatedBlocks: ReadonlyArray<CuratedBlockSpec>;
  readonly ceilings?: Partial<ConsolidatorCeilings>;
}

/**
 * Build the reviser consolidator configuration - pass the result as
 * `createMemory({ consolidator: reviserConsolidatorPreset({...}) })`.
 *
 * @stable
 */
export function reviserConsolidatorPreset(
  options: ReviserPresetOptions,
): ReviserConsolidatorConfig {
  const onExceed = options.onExceed ?? 'pause';
  if ((onExceed as string) === 'log') {
    throw new TypeError(
      "[graphorin/memory] reviserConsolidatorPreset: onExceed 'log' is not allowed - an " +
        "unattended reviser must 'pause' or 'throw' when the budget trips.",
    );
  }
  const triggers: ConsolidatorTriggerSpec[] = [
    options.schedule?.idle ?? 'idle:15m',
    options.schedule?.cron ?? 'cron:0 5 * * *',
  ];
  return {
    enabled: true,
    tier: 'standard',
    provider: options.provider,
    deepProvider: options.provider,
    defaultScope: options.defaultScope,
    triggers,
    onExceed,
    reflection: options.reflection ?? false,
    curatedBlocks: options.curatedBlocks ?? [{ label: 'learned_context' }],
    ...(options.ceilings !== undefined ? { ceilings: options.ceilings } : {}),
  };
}
