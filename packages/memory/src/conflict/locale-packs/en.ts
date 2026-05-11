/**
 * Bundled English locale pack used by the multi-stage conflict
 * resolution pipeline (DEC-117 / ADR-018 ext / RB-02). The patterns
 * cover the common change signals personal-assistant scenarios surface
 * on a daily basis: relocation, job change, preference flips,
 * relationship transitions, and health updates.
 *
 * Operators supplying a different locale register their own pack via
 * {@link defineLocalePack}. The framework ships English by default so
 * the pipeline always has a working baseline.
 *
 * @packageDocumentation
 */

import { defineLocalePack, type LocalePack } from './types.js';

/**
 * The default English `LocalePack`. Frozen — share the singleton.
 *
 * @stable
 */
export const enLocalePack: LocalePack = defineLocalePack({
  id: 'en',
  supersedeMarkers: [
    // Location.
    { regex: /\bmoved (?:to|from)\b/i, kind: 'location', confidence: 0.9 },
    {
      regex: /\bnow (?:live|living|based|residing) (?:in|at)\b/i,
      kind: 'location',
      confidence: 0.9,
    },
    { regex: /\brelocated\b/i, kind: 'location', confidence: 0.85 },
    { regex: /\bjust moved\b/i, kind: 'location', confidence: 0.85 },
    { regex: /\bI live in\b/i, kind: 'location', confidence: 0.7 },

    // Job.
    { regex: /\b(?:got|started|landed)(?: a)?(?: new)? job\b/i, kind: 'job', confidence: 0.9 },
    { regex: /\bgot promoted\b/i, kind: 'job', confidence: 0.9 },
    { regex: /\bgot fired\b/i, kind: 'job', confidence: 0.9 },
    { regex: /\b(?:I )?quit (?:my )?job\b/i, kind: 'job', confidence: 0.9 },
    { regex: /\bnew employer\b/i, kind: 'job', confidence: 0.85 },
    { regex: /\bnew job\b/i, kind: 'job', confidence: 0.8 },
    { regex: /\bswitched (?:companies|jobs|employers)\b/i, kind: 'job', confidence: 0.9 },
    { regex: /\bnow work(?:s|ing)? (?:at|for)\b/i, kind: 'job', confidence: 0.85 },

    // Preference.
    { regex: /\bswitched (?:from|to)\b/i, kind: 'preference', confidence: 0.85 },
    { regex: /\bchanged my (?:mind|preference|opinion)\b/i, kind: 'preference', confidence: 0.85 },
    {
      regex: /\bused to (?:like|love|prefer|drink|eat|use)\b/i,
      kind: 'preference',
      confidence: 0.85,
    },
    { regex: /\bused to (?:live|work|study|play|travel)\b/i, kind: 'generic', confidence: 0.85 },
    { regex: /\bI prefer\b/i, kind: 'preference', confidence: 0.6 },

    // Relationship.
    { regex: /\bgot (?:married|divorced|engaged)\b/i, kind: 'relationship', confidence: 0.9 },
    { regex: /\bbroke up\b/i, kind: 'relationship', confidence: 0.85 },

    // Health.
    { regex: /\bdiagnosed (?:with|as)\b/i, kind: 'health', confidence: 0.85 },
    { regex: /\brecovered from\b/i, kind: 'health', confidence: 0.85 },

    // Generic.
    { regex: /\bformerly\b/i, kind: 'generic', confidence: 0.7 },
    { regex: /\bpreviously\b/i, kind: 'generic', confidence: 0.7 },
    { regex: /\bused to be\b/i, kind: 'generic', confidence: 0.7 },
    { regex: /\bis now\b/i, kind: 'generic', confidence: 0.7 },
  ],
  negationMarkers: [
    { regex: /\bno longer\b/i, kind: 'preference', confidence: 0.85 },
    { regex: /\bdoesn(?:'|\u2019)?t\b/i, confidence: 0.6 },
    {
      regex:
        /\b(?:don(?:'|\u2019)?t|do not) (?:like|prefer|use|drink|eat|live|work|play|go|want)\b/i,
      kind: 'preference',
      confidence: 0.85,
    },
    { regex: /\bnever\b/i, confidence: 0.6 },
    { regex: /\bnot anymore\b/i, kind: 'preference', confidence: 0.85 },
    { regex: /\bisn(?:'|\u2019)?t\b/i, confidence: 0.6 },
    {
      regex: /\bnot (?:a fan|interested|willing|going|planning|in|into|looking) /i,
      kind: 'preference',
      confidence: 0.7,
    },
    { regex: /\b(?:is|are|am|was|were) not\b/i, confidence: 0.5 },
  ],
  predicateNormalisers: [
    'is',
    'are',
    'am',
    'was',
    'were',
    'be',
    'been',
    'being',
    'has',
    'have',
    'had',
    'do',
    'does',
    'did',
    'lives',
    'live',
    'lived',
    'living',
    'works',
    'work',
    'worked',
    'working',
    'plays',
    'play',
    'played',
    'playing',
    'likes',
    'like',
    'liked',
    'loves',
    'love',
    'loved',
    'prefers',
    'prefer',
    'preferred',
    'drinks',
    'drink',
    'drank',
    'drunk',
    'eats',
    'eat',
    'ate',
    'eaten',
    'in',
    'at',
    'on',
    'with',
    'for',
    'to',
  ],
  subjectStopWords: ['a', 'an', 'the', 'my', 'your', 'his', 'her', 'their', 'our', 'this', 'that'],
});
