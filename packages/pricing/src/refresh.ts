/**
 * `refreshPricing(...)` — opt-in network call. The framework never
 * invokes this automatically; it exists so the CLI (`graphorin
 * pricing refresh`) and operator scripts can pull a fresh snapshot
 * without re-installing the package.
 *
 * The function fetches the supplied URL as JSON and validates the
 * shape against the {@link PricingSnapshot} contract. The bundled
 * snapshot is **not** mutated; callers persist the refreshed
 * snapshot to disk and reload it explicitly.
 *
 * @packageDocumentation
 */

import { computeEntriesDigest } from './snapshot/bundled.js';
import type { ModelPrice, PricingSnapshot } from './types.js';

/**
 * Configuration shape for {@link refreshPricing}. The `fetchImpl`
 * override exists so tests can exercise the function without making
 * a real network call.
 *
 * @stable
 */
export interface RefreshPricingOptions {
  /** Snapshot URL — typically the upstream pricing JSON. */
  readonly url: string;
  /** Optional headers (auth, conditional GET, etc.). */
  readonly headers?: Readonly<Record<string, string>>;
  /** Optional fetch override — useful in tests. */
  readonly fetchImpl?: typeof fetch;
  /** Override the snapshot date stamped on the result. Defaults to today. */
  readonly snapshotDate?: string;
  /** Override the snapshot version string. Defaults to `'graphorin/0.1+refreshed'`. */
  readonly version?: string;
  /**
   * Hard timeout for the network fetch in milliseconds. Default
   * `30000`. Aborts the request (and throws) if the upstream is slow
   * or unreachable so `graphorin pricing refresh` cannot hang. Pass an
   * explicit {@link RefreshPricingOptions.signal} to manage
   * cancellation yourself; the two are combined.
   */
  readonly timeoutMs?: number;
  /** Caller-supplied abort signal, combined with the timeout. */
  readonly signal?: AbortSignal;
}

/**
 * Pull a fresh snapshot from the supplied URL and return it. Network
 * failures and shape mismatches surface as thrown errors so the CLI
 * can surface them to the operator.
 *
 * @stable
 */
export async function refreshPricing(opts: RefreshPricingOptions): Promise<PricingSnapshot> {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new TypeError(
      'refreshPricing: no fetch implementation available. Provide `fetchImpl` ' +
        'explicitly or run on a Node.js version with global fetch (>= 18).',
    );
  }
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal =
    opts.signal === undefined ? timeoutSignal : AbortSignal.any([opts.signal, timeoutSignal]);
  let res: Awaited<ReturnType<typeof fetchImpl>>;
  try {
    res = await fetchImpl(opts.url, { headers: opts.headers ?? {}, signal });
  } catch (err) {
    if (timeoutSignal.aborted) {
      throw new Error(`refreshPricing: timed out after ${timeoutMs} ms fetching ${opts.url}`, {
        cause: err,
      });
    }
    throw err;
  }
  if (!res.ok) {
    throw new Error(`refreshPricing: HTTP ${res.status} ${res.statusText} from ${opts.url}`);
  }
  const body = (await res.json()) as unknown;
  const entries = parseEntries(body);
  const snapshotDate = opts.snapshotDate ?? new Date().toISOString().slice(0, 10);
  const version = opts.version ?? 'graphorin/0.1+refreshed';
  return Object.freeze<PricingSnapshot>({
    version,
    source: opts.url,
    snapshotDate,
    currency: 'USD',
    sha256: computeEntriesDigest(entries),
    entries,
  });
}

function parseEntries(body: unknown): ReadonlyArray<ModelPrice> {
  if (body === null || typeof body !== 'object') {
    throw new Error('refreshPricing: response body is not an object');
  }
  // Two accepted shapes:
  //   - `{ entries: ModelPrice[] }`
  //   - `ModelPrice[]`
  let raw: unknown;
  if (Array.isArray(body)) {
    raw = body;
  } else {
    raw = (body as { entries?: unknown }).entries;
    if (!Array.isArray(raw)) {
      throw new Error('refreshPricing: response object is missing the `entries` array');
    }
  }
  const entries = (raw as ReadonlyArray<unknown>).map(parseEntry);
  return Object.freeze(entries);
}

function parseEntry(raw: unknown): ModelPrice {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('refreshPricing: pricing entry is not an object');
  }
  const e = raw as Partial<ModelPrice>;
  if (typeof e.provider !== 'string' || typeof e.model !== 'string') {
    throw new Error('refreshPricing: pricing entry is missing provider / model');
  }
  if (typeof e.inputUsdPerToken !== 'number' || typeof e.outputUsdPerToken !== 'number') {
    throw new Error(
      `refreshPricing: pricing entry ${e.provider}/${e.model} is missing input / output prices`,
    );
  }
  return Object.freeze({
    provider: e.provider,
    model: e.model,
    inputUsdPerToken: e.inputUsdPerToken,
    outputUsdPerToken: e.outputUsdPerToken,
    ...(typeof e.cachedReadUsdPerToken === 'number'
      ? { cachedReadUsdPerToken: e.cachedReadUsdPerToken }
      : {}),
    ...(typeof e.cacheWriteUsdPerToken === 'number'
      ? { cacheWriteUsdPerToken: e.cacheWriteUsdPerToken }
      : {}),
    ...(typeof e.reasoningUsdPerToken === 'number'
      ? { reasoningUsdPerToken: e.reasoningUsdPerToken }
      : {}),
    ...(typeof e.region === 'string' ? { region: e.region } : {}),
    ...(typeof e.notes === 'string' ? { notes: e.notes } : {}),
  });
}
