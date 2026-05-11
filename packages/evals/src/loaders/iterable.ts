/**
 * `fromIterable` — wrap an in-memory array / iterable as a
 * {@link Dataset}. Useful for tests + ad-hoc data.
 *
 * @packageDocumentation
 */

import type { Case, Dataset } from '@graphorin/observability/eval';

/** @stable */
export function fromIterable<I, O = unknown>(
  cases: Iterable<Case<I, O>> | ReadonlyArray<Case<I, O>>,
  options: { readonly name?: string; readonly description?: string } = {},
): Dataset<I, O> {
  const arr = Array.isArray(cases) ? (cases as ReadonlyArray<Case<I, O>>) : Array.from(cases);
  const meta: Dataset<I, O>['metadata'] = {
    ...(options.name !== undefined ? { name: options.name } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    createdAt: new Date(),
  };
  return { cases: arr, metadata: meta };
}
