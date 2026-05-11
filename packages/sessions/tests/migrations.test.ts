import { afterEach, describe, expect, it } from 'vitest';
import type { SessionExportRecord } from '../src/export/types.js';
import {
  _resetExportMigratorsForTesting,
  type ExportMigrator,
  listExportMigrators,
  migrateExport,
  registerExportMigrator,
} from '../src/migrations/index.js';

const sampleRecord: SessionExportRecord = {
  kind: 'session',
  id: 'sess-1',
  userId: 'u-1',
  agentId: 'main',
  createdAt: '2026-05-08T10:00:00Z',
};

describe('Export migrator registry', () => {
  afterEach(() => {
    _resetExportMigratorsForTesting();
  });

  it('returns input bytes-equal when fromVersion === toVersion', () => {
    const out = migrateExport([sampleRecord], '1.0', '1.0');
    expect(out).toEqual([sampleRecord]);
  });

  it('walks the chain across registered migrators', () => {
    const m1: ExportMigrator = {
      fromVersion: '1.0',
      toVersion: '1.1',
      migrate: (records) => records as ReadonlyArray<SessionExportRecord>,
    };
    const m2: ExportMigrator = {
      fromVersion: '1.1',
      toVersion: '2.0',
      migrate: (records) => records as ReadonlyArray<SessionExportRecord>,
    };
    registerExportMigrator(m1);
    registerExportMigrator(m2);
    const out = migrateExport([sampleRecord], '1.0', '2.0');
    expect(out).toEqual([sampleRecord]);
  });

  it('throws when no migrator chain exists', () => {
    expect(() => migrateExport([sampleRecord], '1.0', '5.0')).toThrow();
  });

  it('detects cycles', () => {
    registerExportMigrator({
      fromVersion: '1.0',
      toVersion: '1.1',
      migrate: (records) => records as ReadonlyArray<SessionExportRecord>,
    });
    registerExportMigrator({
      fromVersion: '1.1',
      toVersion: '1.0',
      migrate: (records) => records as ReadonlyArray<SessionExportRecord>,
    });
    expect(() => migrateExport([sampleRecord], '1.0', '5.0')).toThrow();
  });

  it('idempotent registration replaces a prior migrator', () => {
    let used: 'first' | 'second' = 'first';
    registerExportMigrator({
      fromVersion: '1.0',
      toVersion: '1.1',
      migrate: (records) => {
        used = 'first';
        return records as ReadonlyArray<SessionExportRecord>;
      },
    });
    registerExportMigrator({
      fromVersion: '1.0',
      toVersion: '1.1',
      migrate: (records) => {
        used = 'second';
        return records as ReadonlyArray<SessionExportRecord>;
      },
    });
    expect(listExportMigrators()).toHaveLength(1);
    migrateExport([sampleRecord], '1.0', '1.1');
    expect(used).toBe('second');
  });
});
