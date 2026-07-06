import { describe, expect, it } from 'vitest';
import {
  COMPACTION_SUMMARY_CLOSE,
  COMPACTION_SUMMARY_MARKER,
  COMPACTION_SUMMARY_OPEN,
  COMPACTION_SUMMARY_TAG,
} from '../src/index.js';

describe('W-056 compaction-summary marker pins', () => {
  it('the values are frozen raw literals - persisted summaries depend on them', () => {
    expect(COMPACTION_SUMMARY_TAG).toBe('graphorin_compaction_summary');
    expect(COMPACTION_SUMMARY_OPEN).toBe('<graphorin_compaction_summary>');
    expect(COMPACTION_SUMMARY_CLOSE).toBe('</graphorin_compaction_summary>');
    expect(COMPACTION_SUMMARY_MARKER).toBe('<graphorin_compaction_summary');
  });

  it('the detection prefix matches the opening tag (attribute-tolerant scan)', () => {
    expect(COMPACTION_SUMMARY_OPEN.startsWith(COMPACTION_SUMMARY_MARKER)).toBe(true);
  });
});
