/**
 * Graphorin v0.1.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Minimal in-tree implementation of the {@link SecretValue} contract from
 * `@graphorin/core`. The wrapper redacts every standard JavaScript
 * coercion path (`String(...)`, `JSON.stringify(...)`, template literals,
 * `node:util.inspect(...)`) and reveals the underlying value only via
 * the audited `.use(fn)` / `.useBuffer(fn)` / `.reveal()` accessors. The
 * crew example mounts one of these on the supervisor agent's `deps` to
 * demonstrate the DEC-137 sub-agent secrets-isolation invariant: the
 * default `inheritSecrets: []` empty allowlist means workers spawned
 * via `transfer_to_<worker>` cannot read the supervisor's secret.
 */

import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';
import {
  NODEJS_INSPECT_CUSTOM,
  SECRET_VALUE_BRAND,
  type SecretValue,
  type SecretValueOptions,
} from '@graphorin/core';

const REDACTED_PLACEHOLDER = '[SECRET]';
const INSPECT_PLACEHOLDER = 'SecretValue([REDACTED])';

/**
 * Local {@link SecretValue} implementation. The full production
 * implementation lives in `@graphorin/security`; the example carries
 * its own lightweight copy so it can run with the workspace
 * dependency set documented in `package.json` (no `@graphorin/security`).
 */
export class StubSecretValue implements SecretValue {
  readonly #buffer: Buffer;
  #disposed = false;

  readonly source?: { readonly resolver?: string; readonly ref?: string };
  readonly fetchedAt: number;
  readonly [SECRET_VALUE_BRAND]: true = true;

  private constructor(buf: Buffer, opts?: SecretValueOptions) {
    this.#buffer = Buffer.from(buf);
    this.fetchedAt = Date.now();
    if (opts?.source !== undefined) this.source = opts.source;
  }

  static fromString(raw: string, opts?: SecretValueOptions): StubSecretValue {
    return new StubSecretValue(Buffer.from(raw, 'utf8'), opts);
  }

  static fromBuffer(buf: Buffer, opts?: SecretValueOptions): StubSecretValue {
    return new StubSecretValue(buf, opts);
  }

  static isSecretValue(value: unknown): value is SecretValue {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false;
    return (value as { [k: symbol]: unknown })[SECRET_VALUE_BRAND] === true;
  }

  static timingSafeEquals(a: SecretValue, b: SecretValue): boolean {
    const ax = a as StubSecretValue;
    const bx = b as StubSecretValue;
    if (ax.#disposed || bx.#disposed) return false;
    if (ax.#buffer.length !== bx.#buffer.length) return false;
    return timingSafeEqual(ax.#buffer, bx.#buffer);
  }

  get length(): number {
    return this.#buffer.length;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  async use<T>(fn: (raw: string) => T | Promise<T>): Promise<T> {
    this.#assertLive();
    return await fn(this.#buffer.toString('utf8'));
  }

  async useBuffer<T>(fn: (buf: Buffer) => T | Promise<T>): Promise<T> {
    this.#assertLive();
    return await fn(Buffer.from(this.#buffer));
  }

  reveal(): string {
    this.#assertLive();
    return this.#buffer.toString('utf8');
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#buffer.fill(0);
  }

  toString(): string {
    return REDACTED_PLACEHOLDER;
  }

  [Symbol.toPrimitive](hint: string): string | number {
    if (hint === 'number') return Number.NaN;
    return REDACTED_PLACEHOLDER;
  }

  toJSON(): string {
    return REDACTED_PLACEHOLDER;
  }

  [NODEJS_INSPECT_CUSTOM](): string {
    return INSPECT_PLACEHOLDER;
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('Cannot read a disposed SecretValue.');
  }
}

/**
 * Convenience helper used throughout the example — the stub provider's
 * supervisor mounts the secret on its `deps`, the smoke test asserts
 * the worker cannot reach it.
 */
export function createStubSecret(raw: string, label?: string): StubSecretValue {
  return StubSecretValue.fromString(
    raw,
    label !== undefined ? { source: { resolver: 'crew-example', ref: label } } : undefined,
  );
}
