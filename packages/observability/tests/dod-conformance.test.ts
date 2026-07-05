import { describe, expect, it } from 'vitest';
import { createConsoleExporter } from '../src/exporters/index.js';
import { VERSION } from '../src/index.js';
import { UnvalidatedExporterError } from '../src/redaction/errors.js';
import { BUILT_IN_PATTERNS } from '../src/redaction/index.js';
import { getTelemetryStatus } from '../src/telemetry/index.js';
import { createTracer } from '../src/tracer/index.js';

describe('@graphorin/observability - Phase 04 Definition of Done', () => {
  it('exports the canonical 0.5.0 version', () => {
    expect(VERSION).toBe('0.5.0');
  });

  it('exposes exactly 14 default-on PII / secret patterns', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(14);
  });

  it('un-wrapped exporter test: registering raw exporter while validation is off throws', () => {
    expect(() =>
      createTracer({
        exporters: [createConsoleExporter({ sink: () => {} })],
        validation: 'off',
        warnSink: () => {},
      }),
    ).toThrowError(UnvalidatedExporterError);
  });

  it('telemetry is hardcoded false', () => {
    expect(getTelemetryStatus({}).enabled).toBe(false);
  });
});
