/**
 * `graphorin telemetry` — informational stubs.
 *
 * The framework promises **zero default telemetry** (DEC-154 /
 * ADR-041). The Phase 15 surface ships the four subcommands as
 * stubs that explain the policy and point operators at the
 * documentation. Phase v0.2+ will extend the surface with an opt-in
 * collector; today the stubs ensure the surface name-space is
 * reserved + the operator gets a clear answer.
 *
 * Surface (per Phase 15 § Telemetry):
 *
 *  - `graphorin telemetry status`  — always reports `disabled`.
 *  - `graphorin telemetry enable`  — refuses with a documentation
 *    pointer.
 *  - `graphorin telemetry disable` — no-op success.
 *  - `graphorin telemetry inspect` — informational summary of the
 *    promise (no phone home, no version pings, no crash reports).
 *
 * @packageDocumentation
 */

import process from 'node:process';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface TelemetryStatusResult {
  readonly enabled: false;
  readonly policy: 'zero-default';
  readonly reference: string;
}

const PRIVACY_REF = 'SECURITY.md § Privacy & telemetry (DEC-154 / ADR-041)';

const ZERO_DEFAULT_RESULT: TelemetryStatusResult = Object.freeze({
  enabled: false,
  policy: 'zero-default',
  reference: PRIVACY_REF,
});

/** @stable */
export function runTelemetryStatus(options: CommonOutputOptions = {}): TelemetryStatusResult {
  emitReport(options, ZERO_DEFAULT_RESULT, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`${statusMarker('info')} telemetry: disabled (policy: zero-default)`));
    print(brand(`reference: ${PRIVACY_REF}`));
  });
  return ZERO_DEFAULT_RESULT;
}

/** @stable */
export function runTelemetryEnable(options: CommonOutputOptions = {}): TelemetryStatusResult {
  emitReport(options, ZERO_DEFAULT_RESULT, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`telemetry enable refused — the framework promises zero phone-home (DEC-154).`));
    print(brand(`an opt-in collector is on the v0.2+ roadmap; see ${PRIVACY_REF}.`));
  });
  process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
  return ZERO_DEFAULT_RESULT;
}

/** @stable */
export function runTelemetryDisable(options: CommonOutputOptions = {}): TelemetryStatusResult {
  emitReport(options, ZERO_DEFAULT_RESULT, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand(`telemetry is already disabled (no-op; zero-default policy).`));
  });
  return ZERO_DEFAULT_RESULT;
}

/** @stable */
export function runTelemetryInspect(options: CommonOutputOptions = {}): TelemetryStatusResult {
  emitReport(options, ZERO_DEFAULT_RESULT, () => {
    const print = options.print ?? defaultPrintSink;
    print(brand('graphorin telemetry inspect:'));
    print(`  ${statusMarker('ok')} no phone home`);
    print(`  ${statusMarker('ok')} no version pings`);
    print(`  ${statusMarker('ok')} no crash reports`);
    print(`  ${statusMarker('ok')} no auto-updates`);
    print(brand(`reference: ${PRIVACY_REF}`));
  });
  return ZERO_DEFAULT_RESULT;
}
