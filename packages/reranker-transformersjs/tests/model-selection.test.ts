import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENGLISH_MODEL,
  DEFAULT_MULTILINGUAL_MODEL,
  pickRerankerModel,
} from '../src/model-selection.js';

describe('pickRerankerModel', () => {
  it("returns the English model for 'en'", () => {
    expect(pickRerankerModel('en')).toBe(DEFAULT_ENGLISH_MODEL);
  });

  it("returns the English model for any 'en-*' subtag", () => {
    expect(pickRerankerModel('en-US')).toBe(DEFAULT_ENGLISH_MODEL);
    expect(pickRerankerModel('en-GB')).toBe(DEFAULT_ENGLISH_MODEL);
    expect(pickRerankerModel('en-Latn-CA')).toBe(DEFAULT_ENGLISH_MODEL);
  });

  it('case-insensitively normalises the locale', () => {
    expect(pickRerankerModel('EN')).toBe(DEFAULT_ENGLISH_MODEL);
    expect(pickRerankerModel('En-Gb')).toBe(DEFAULT_ENGLISH_MODEL);
  });

  it('returns the multilingual model for non-English locales', () => {
    expect(pickRerankerModel('de')).toBe(DEFAULT_MULTILINGUAL_MODEL);
    expect(pickRerankerModel('fr-FR')).toBe(DEFAULT_MULTILINGUAL_MODEL);
    expect(pickRerankerModel('zh-Hans-CN')).toBe(DEFAULT_MULTILINGUAL_MODEL);
    expect(pickRerankerModel('uk')).toBe(DEFAULT_MULTILINGUAL_MODEL);
    expect(pickRerankerModel('pt-BR')).toBe(DEFAULT_MULTILINGUAL_MODEL);
  });

  it('returns the multilingual model when locale is undefined or empty', () => {
    expect(pickRerankerModel(undefined)).toBe(DEFAULT_MULTILINGUAL_MODEL);
    expect(pickRerankerModel('')).toBe(DEFAULT_MULTILINGUAL_MODEL);
  });
});
