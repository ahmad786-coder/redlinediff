import * as Diff from 'diff';
import type { DiffHunk, DiffGranularity, RedlineSummary, RiskSeverity } from '../types';
import { calculateWordCount, normalizeText } from './documentParser';

// High-stakes legal terms
export const LEGAL_RISK_KEYWORDS = [
  'indemnif', // matches indemnify, indemnification, indemnified
  'liability',
  'intellectual property',
  'ip',
  'ownership',
  'work made for hire',
  'non-compete',
  'non-solicit',
  'exclusivity',
  'termination',
  'kill-fee',
  'refund',
  'warranty',
  'warranties',
  'jurisdiction',
  'arbitration',
  'governing law',
  'confidentiality',
  'perpetual',
  'irrevocable',
  'liquidated damages',
  'infringement',
  'waiver',
  'assignment',
  'severability',
  'limitation of liability',
  'force majeure',
];

// Patterns for financial and numerical shifts
const FINANCIAL_PATTERNS = [
  /(\$|€|£|PKR|USD|EUR|GBP|¥|₹)\s*\d+([.,]\d+)?/i,
  /\d+(\.\d+)?\s*(%|percent|percentage)/i,
  /\b(Net\s*\d+|net-\d+|\d+\s*(days|calendar days|business days|months|hours|weeks|years))\b/i,
  /\b(fee|payment|rate|compensation|retainer|penalty|discount|deposit|installment|royalty|royalties)\b/i,
  /\b\d+([.,]\d+)?\s*(dollars|cents|euros|pounds|rupees)\b/i,
];

/**
 * Detects if a text fragment contains financial/timeline/percentage changes
 */
export function hasFinancialOrTimelineShift(text: string): boolean {
  if (!text) return false;
  return FINANCIAL_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Detects legal keywords in text, checking whole words for short abbreviations like 'ip'
 */
export function detectLegalKeywords(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const kw of LEGAL_RISK_KEYWORDS) {
    if (kw === 'ip') {
      if (/\bip\b/i.test(lower)) {
        matched.push('ip');
      }
    } else if (lower.includes(kw)) {
      matched.push(kw);
    }
  }

  return matched;
}

/**
 * Assesses risk severity for a modified / added / removed hunk
 */
export function assessRisk(
  removedText?: string,
  addedText?: string,
  contextText?: string
): { severity: RiskSeverity; reasons: string[] } {
  const reasons: string[] = [];
  const rem = (removedText || '').trim();
  const add = (addedText || '').trim();
  const combinedDiff = `${rem} ${add}`;
  const fullContext = `${contextText || ''} ${combinedDiff}`;

  // Check 1: Financial / Number / Timeline shifts
  const isFinancialRemoved = hasFinancialOrTimelineShift(rem);
  const isFinancialAdded = hasFinancialOrTimelineShift(add);
  const hasFinancialContext = hasFinancialOrTimelineShift(fullContext);

  const numRegex = /\d+/g;
  const numsRemoved = rem.match(numRegex) || [];
  const numsAdded = add.match(numRegex) || [];
  const hasNumChange = numsRemoved.length > 0 || numsAdded.length > 0;

  if (isFinancialRemoved || isFinancialAdded || (hasFinancialContext && hasNumChange)) {
    reasons.push(
      `Financial/Timeline Shift: Detected change in numeric terms, currency figures, or payment windows (${numsRemoved.join(', ') || 'N/A'} → ${numsAdded.join(', ') || 'N/A'})`
    );
    return { severity: 'CRITICAL', reasons };
  }

  // Check 2: High-Stakes Legal Keywords in diff or immediate surrounding clause
  const legalTermsInDiff = detectLegalKeywords(combinedDiff);
  const legalTermsInContext = detectLegalKeywords(fullContext);

  if (legalTermsInDiff.length > 0) {
    reasons.push(
      `Legal Rights Alteration: Modifies critical clause terms [${legalTermsInDiff.join(', ')}]`
    );
    return { severity: 'HIGH', reasons };
  } else if (legalTermsInContext.length > 0 && (rem || add)) {
    reasons.push(
      `Governing Clause Modification: Edits within high-liability section [${legalTermsInContext.slice(0, 3).join(', ')}]`
    );
    return { severity: 'HIGH', reasons };
  }

  // Check 3: Standard wording edit
  reasons.push('General editorial/wording adjustment');
  return { severity: 'STANDARD', reasons };
}

/**
 * Tokenize by whitespace while preserving punctuation attached to words
 * so numbers like "$1,000" are treated as distinct coherent tokens
 */
function tokenizeWords(text: string): string[] {
  return text.match(/\S+|\s+/g) || [];
}

interface RawDiffItem {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Custom diff algorithm based on tokenized words and spaces
 */
function diffCustomWords(textA: string, textB: string): RawDiffItem[] {
  const tokensA = tokenizeWords(textA);
  const tokensB = tokenizeWords(textB);

  const arrayDiff = Diff.diffArrays(tokensA, tokensB);
  
  return arrayDiff.map((d) => ({
    value: d.value.join(''),
    added: d.added,
    removed: d.removed,
  }));
}

/**
 * Computes structured Redline Diff hunks using deterministic Myers algorithm
 */
export function computeRedlineDiff(
  textA: string,
  textB: string,
  options: {
    granularity?: DiffGranularity;
    ignoreWhitespaceNoise?: boolean;
  } = {}
): { hunks: DiffHunk[]; summary: RedlineSummary } {
  const { granularity = 'words', ignoreWhitespaceNoise = true } = options;

  const cleanA = normalizeText(textA, ignoreWhitespaceNoise);
  const cleanB = normalizeText(textB, ignoreWhitespaceNoise);

  let rawDiff: RawDiffItem[] = [];

  if (granularity === 'sentences') {
    rawDiff = Diff.diffSentences(cleanA, cleanB);
  } else if (granularity === 'lines') {
    rawDiff = Diff.diffLines(cleanA, cleanB);
  } else {
    rawDiff = diffCustomWords(cleanA, cleanB);
  }

  const hunks: DiffHunk[] = [];
  let changeCounter = 1;
  let wordsAdded = 0;
  let wordsDeleted = 0;
  let additionsCount = 0;
  let deletionsCount = 0;
  let modificationsCount = 0;
  let criticalRiskCount = 0;
  let highRiskCount = 0;

  let i = 0;
  while (i < rawDiff.length) {
    const current = rawDiff[i];

    if (!current.added && !current.removed) {
      hunks.push({
        id: 0,
        type: 'UNCHANGED',
        value: current.value,
        severity: 'STANDARD',
        riskReasons: [],
      });
      i++;
      continue;
    }

    // Check if next item is a pair (removed followed by added)
    const next = rawDiff[i + 1];
    if (current.removed && next && next.added) {
      const removedVal = current.value;
      const addedVal = next.value;

      const prevContext = i > 0 ? rawDiff[i - 1].value.slice(-150) : '';
      const nextContext = i + 2 < rawDiff.length ? rawDiff[i + 2].value.slice(0, 150) : '';
      const surroundingContext = `${prevContext} ${nextContext}`;

      const risk = assessRisk(removedVal, addedVal, surroundingContext);
      if (risk.severity === 'CRITICAL') criticalRiskCount++;
      if (risk.severity === 'HIGH') highRiskCount++;

      const remWords = calculateWordCount(removedVal);
      const addWords = calculateWordCount(addedVal);
      wordsDeleted += remWords;
      wordsAdded += addWords;
      modificationsCount++;

      hunks.push({
        id: changeCounter++,
        type: 'MODIFIED',
        value: addedVal,
        removedValue: removedVal,
        addedValue: addedVal,
        severity: risk.severity,
        riskReasons: risk.reasons,
      });

      i += 2;
      continue;
    }

    // Single addition or deletion
    if (current.removed) {
      const removedVal = current.value;
      const prevContext = i > 0 ? rawDiff[i - 1].value.slice(-150) : '';
      const nextContext = i + 1 < rawDiff.length ? rawDiff[i + 1].value.slice(0, 150) : '';
      const surroundingContext = `${prevContext} ${nextContext}`;

      const risk = assessRisk(removedVal, undefined, surroundingContext);
      if (risk.severity === 'CRITICAL') criticalRiskCount++;
      if (risk.severity === 'HIGH') highRiskCount++;

      const remWords = calculateWordCount(removedVal);
      wordsDeleted += remWords;
      deletionsCount++;

      hunks.push({
        id: changeCounter++,
        type: 'REMOVED',
        value: removedVal,
        removedValue: removedVal,
        severity: risk.severity,
        riskReasons: risk.reasons,
      });
    } else if (current.added) {
      const addedVal = current.value;
      const prevContext = i > 0 ? rawDiff[i - 1].value.slice(-150) : '';
      const nextContext = i + 1 < rawDiff.length ? rawDiff[i + 1].value.slice(0, 150) : '';
      const surroundingContext = `${prevContext} ${nextContext}`;

      const risk = assessRisk(undefined, addedVal, surroundingContext);
      if (risk.severity === 'CRITICAL') criticalRiskCount++;
      if (risk.severity === 'HIGH') highRiskCount++;

      const addWords = calculateWordCount(addedVal);
      wordsAdded += addWords;
      additionsCount++;

      hunks.push({
        id: changeCounter++,
        type: 'ADDED',
        value: addedVal,
        addedValue: addedVal,
        severity: risk.severity,
        riskReasons: risk.reasons,
      });
    }

    i++;
  }

  const totalChanges = additionsCount + deletionsCount + modificationsCount;
  
  const totalLength = Math.max(cleanA.length, cleanB.length, 1);
  const unchangedLength = hunks
    .filter((h) => h.type === 'UNCHANGED')
    .reduce((acc, h) => acc + h.value.length, 0);
  const similarityScore = Math.min(100, Math.max(0, Math.round((unchangedLength / totalLength) * 100)));

  const summary: RedlineSummary = {
    totalChanges,
    additionsCount,
    deletionsCount,
    modificationsCount,
    wordsAdded,
    wordsDeleted,
    criticalRiskCount,
    highRiskCount,
    similarityScore,
  };

  return { hunks, summary };
}
