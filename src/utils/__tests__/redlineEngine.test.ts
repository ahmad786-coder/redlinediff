import { describe, it, expect } from 'vitest';
import {
  computeRedlineDiff,
  assessRisk,
  hasFinancialOrTimelineShift,
  detectLegalKeywords,
} from '../redlineEngine';

describe('redlineEngine - Precision & Legal Detection', () => {
  it('detects word-level additions and deletions accurately', () => {
    const original = 'Client agrees to pay $1,000 upon delivery.';
    const revised = 'Client agrees to pay $2,000 upon delivery and milestone approval.';

    const { hunks, summary } = computeRedlineDiff(original, revised, { granularity: 'words' });

    expect(summary.totalChanges).toBeGreaterThan(0);
    expect(
      hunks.some(
        (h) =>
          h.removedValue?.includes('$1,000') &&
          h.addedValue?.includes('$2,000')
      )
    ).toBe(true);
    expect(
      hunks.some(
        (h) =>
          (h.addedValue && h.addedValue.includes('milestone approval')) ||
          (h.type === 'ADDED' && h.value.includes('milestone approval'))
      )
    ).toBe(true);
  });

  it('detects critical financial and timeline shifts ($1,000 -> $100 and 15 days -> 45 days)', () => {
    expect(hasFinancialOrTimelineShift('Net 15 days')).toBe(true);
    expect(hasFinancialOrTimelineShift('$5,000 USD')).toBe(true);
    expect(hasFinancialOrTimelineShift('25%')).toBe(true);
    expect(hasFinancialOrTimelineShift('15 days')).toBe(true);

    const risk1 = assessRisk('$1,000', '$100', 'Payment compensation fee');
    expect(risk1.severity).toBe('CRITICAL');
    expect(risk1.reasons[0]).toContain('Financial/Timeline Shift');

    const risk2 = assessRisk('Net 15 days', 'Net 45 days', 'Payment schedule');
    expect(risk2.severity).toBe('CRITICAL');
  });

  it('detects high-risk legal clause keywords (termination, indemnification, IP)', () => {
    const legalKeywords = detectLegalKeywords('Either party may seek termination or indemnification under IP law.');
    expect(legalKeywords).toContain('termination');
    expect(legalKeywords).toContain('indemnif');
    expect(legalKeywords).toContain('ip');

    const risk = assessRisk('Contractor retains ownership', 'Client owns all intellectual property', 'Section 3');
    expect(risk.severity).toBe('HIGH');
    expect(risk.reasons[0]).toContain('Legal Rights Alteration');
  });

  it('classifies harmless wording edits as STANDARD', () => {
    const risk = assessRisk('quick brown fox', 'fast brown fox', 'The animal jumped');
    expect(risk.severity).toBe('STANDARD');
  });
});
