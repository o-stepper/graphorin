/**
 * Resolver that materializes a {@link ContextLocalePack} from either
 * the bundled `'en'` default, a fully-specified custom pack, or a
 * partial pack with English fallback. The resolver emits a one-time
 * WARN per `(locale, missing-surface)` pair so operators see exactly
 * which fragment they did not declare without flooding the log.
 *
 * @packageDocumentation
 */

import { enLocalePack } from './en.js';
import type { ContextLocalePack, PartialContextLocalePack } from './types.js';

const WARN_REGISTRY = new Map<string, Set<string>>();

/**
 * Reset the once-per-process WARN registry. Used by tests for
 * isolation.
 *
 * @experimental
 */
export function _resetLocaleFallbackWarningsForTesting(): void {
  WARN_REGISTRY.clear();
}

/**
 * Inspect the once-per-process WARN registry. Used by tests.
 *
 * @experimental
 */
export function _getLocaleFallbackWarningsForTesting(): ReadonlyMap<string, ReadonlySet<string>> {
  return new Map(WARN_REGISTRY);
}

/**
 * Logger surface accepted by {@link resolveLocalePack}. Every other
 * surface in the codebase already accepts `Logger | undefined`; this
 * one mirrors that contract without taking the heavier
 * `@graphorin/core` `Logger` import directly.
 *
 * @stable
 */
export interface LocaleResolverLogger {
  warn(message: string, attrs?: Readonly<Record<string, unknown>>): void;
}

const NOOP_LOGGER: LocaleResolverLogger = {
  warn(): void {},
};

const DEFAULT_LOGGER: LocaleResolverLogger = {
  warn(message: string, attrs?: Readonly<Record<string, unknown>>): void {
    if (attrs !== undefined) {
      console.warn(`[graphorin/memory:context-engine] ${message}`, attrs);
    } else {
      console.warn(`[graphorin/memory:context-engine] ${message}`);
    }
  },
};

function emitFallbackWarning(
  logger: LocaleResolverLogger,
  localeId: string,
  surface: string,
): void {
  let bucket = WARN_REGISTRY.get(localeId);
  if (bucket === undefined) {
    bucket = new Set();
    WARN_REGISTRY.set(localeId, bucket);
  }
  if (bucket.has(surface)) return;
  bucket.add(surface);
  logger.warn(
    `Locale pack '${localeId}' is missing the '${surface}' surface; falling back to the bundled English default. ` +
      'Pass a complete `defineContextLocalePack({ ... })` to suppress this warning.',
    { locale: localeId, surface },
  );
}

/**
 * Materialize a locale pack from a partial input + the English
 * fallback. Pure: no I/O outside the bounded WARN registry.
 *
 * @stable
 */
export function resolveLocalePack(
  input: PartialContextLocalePack | ContextLocalePack | undefined,
  options: { readonly logger?: LocaleResolverLogger; readonly silent?: boolean } = {},
): ContextLocalePack {
  const fallback = enLocalePack;
  const silent = options.silent === true;
  const logger = silent ? NOOP_LOGGER : (options.logger ?? DEFAULT_LOGGER);
  if (input === undefined || input.id === fallback.id) {
    return fallback;
  }

  const localeId = input.id;
  const baseTemplate = mergeBaseTemplate(localeId, input.baseTemplate, fallback, logger);
  const autoRecallTriggers = mergeAutoRecallTriggers(
    localeId,
    input.autoRecallTriggers,
    fallback,
    logger,
  );
  const inboundSanitizationPreamble = mergeInboundPreamble(
    localeId,
    input.inboundSanitizationPreamble,
    fallback,
    logger,
  );
  const compactionSummaryTemplate = mergeCompactionTemplate(
    localeId,
    input.compactionSummaryTemplate,
    fallback,
    logger,
  );

  return Object.freeze({
    id: localeId,
    baseTemplate,
    autoRecallTriggers,
    inboundSanitizationPreamble,
    compactionSummaryTemplate,
  });
}

function mergeBaseTemplate(
  localeId: string,
  partial: PartialContextLocalePack['baseTemplate'],
  fallback: ContextLocalePack,
  logger: LocaleResolverLogger,
): ContextLocalePack['baseTemplate'] {
  if (partial === undefined) {
    emitFallbackWarning(logger, localeId, 'baseTemplate');
    return fallback.baseTemplate;
  }
  const full = partial.full ?? fallback.baseTemplate.full;
  const minimal = partial.minimal ?? fallback.baseTemplate.minimal;
  if (partial.full === undefined) emitFallbackWarning(logger, localeId, 'baseTemplate.full');
  if (partial.minimal === undefined) emitFallbackWarning(logger, localeId, 'baseTemplate.minimal');
  return Object.freeze({ full, minimal });
}

function mergeAutoRecallTriggers(
  localeId: string,
  partial: PartialContextLocalePack['autoRecallTriggers'],
  fallback: ContextLocalePack,
  logger: LocaleResolverLogger,
): ContextLocalePack['autoRecallTriggers'] {
  if (partial === undefined) {
    emitFallbackWarning(logger, localeId, 'autoRecallTriggers');
    return fallback.autoRecallTriggers;
  }
  const factTriggers = partial.factTriggers ?? fallback.autoRecallTriggers.factTriggers;
  const episodeTriggers = partial.episodeTriggers ?? fallback.autoRecallTriggers.episodeTriggers;
  if (partial.factTriggers === undefined)
    emitFallbackWarning(logger, localeId, 'autoRecallTriggers.factTriggers');
  if (partial.episodeTriggers === undefined)
    emitFallbackWarning(logger, localeId, 'autoRecallTriggers.episodeTriggers');
  return Object.freeze({
    factTriggers: Object.freeze([...factTriggers]),
    episodeTriggers: Object.freeze([...episodeTriggers]),
  });
}

function mergeInboundPreamble(
  localeId: string,
  partial: PartialContextLocalePack['inboundSanitizationPreamble'],
  fallback: ContextLocalePack,
  logger: LocaleResolverLogger,
): ContextLocalePack['inboundSanitizationPreamble'] {
  if (partial === undefined || partial.text === undefined) {
    emitFallbackWarning(logger, localeId, 'inboundSanitizationPreamble');
    return fallback.inboundSanitizationPreamble;
  }
  return Object.freeze({ text: partial.text });
}

function mergeCompactionTemplate(
  localeId: string,
  partial: PartialContextLocalePack['compactionSummaryTemplate'],
  fallback: ContextLocalePack,
  logger: LocaleResolverLogger,
): ContextLocalePack['compactionSummaryTemplate'] {
  if (partial === undefined) {
    emitFallbackWarning(logger, localeId, 'compactionSummaryTemplate');
    return fallback.compactionSummaryTemplate;
  }
  const preamble = partial.preamble ?? fallback.compactionSummaryTemplate.preamble;
  const sections = partial.sections ?? fallback.compactionSummaryTemplate.sections;
  if (partial.preamble === undefined)
    emitFallbackWarning(logger, localeId, 'compactionSummaryTemplate.preamble');
  if (partial.sections === undefined)
    emitFallbackWarning(logger, localeId, 'compactionSummaryTemplate.sections');
  return Object.freeze({
    preamble,
    sections: Object.freeze([
      ...sections,
    ]) as ContextLocalePack['compactionSummaryTemplate']['sections'],
  });
}
