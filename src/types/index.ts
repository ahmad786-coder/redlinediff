export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'STANDARD';

export type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export interface DiffHunk {
  id: number;
  type: ChangeType;
  value: string;
  removedValue?: string;
  addedValue?: string;
  severity: RiskSeverity;
  riskReasons: string[];
  lineNumber?: number;
}

export interface DocumentMeta {
  name: string;
  type: 'docx' | 'pdf' | 'txt' | 'md' | 'raw';
  wordCount: number;
  charCount: number;
  pageCount?: number;
  rawText: string;
}

export interface RedlineSummary {
  totalChanges: number;
  additionsCount: number;
  deletionsCount: number;
  modificationsCount: number;
  wordsAdded: number;
  wordsDeleted: number;
  criticalRiskCount: number;
  highRiskCount: number;
  similarityScore: number; // 0 to 100%
}

export type DiffGranularity = 'words' | 'sentences' | 'lines';
export type ViewMode = 'unified' | 'split' | 'digest';
export type RiskFilter = 'ALL' | 'HIGH_RISK_ONLY' | 'ADDITIONS' | 'DELETIONS';
