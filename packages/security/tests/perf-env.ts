/**
 * True when the suite runs under coverage instrumentation - either the
 * repo's CI coverage leg (`GRAPHORIN_COVERAGE=1`) or a plain
 * `vitest --coverage` invocation, detected via the vitest worker's
 * resolved config. V8 instrumentation inflates microbenchmark latencies
 * 5-30x, so p95 canaries are meaningless there and must skip.
 */
export function coverageInstrumented(): boolean {
  if (process.env.GRAPHORIN_COVERAGE === '1') return true;
  const worker = (globalThis as Record<string, unknown>).__vitest_worker__ as
    | { config?: { coverage?: { enabled?: boolean } } }
    | undefined;
  return worker?.config?.coverage?.enabled === true;
}
