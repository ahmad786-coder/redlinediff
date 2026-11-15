import { useState, useMemo } from 'react';
import {
  Shield,
  ArrowRightLeft,
  RotateCcw,
  Download,
  Sparkles,
} from 'lucide-react';
import type { DocumentMeta, RiskFilter, ViewMode } from './types';
import { computeRedlineDiff } from './utils/redlineEngine';
import { generateAuditPdfReport } from './utils/auditPdfGenerator';
import {
  SAMPLE_CONTRACT_ORIGINAL,
  SAMPLE_CONTRACT_REVISED,
} from './utils/sampleContract';
import { DocumentSlot } from './components/DocumentSlot';
import { SummaryStrip } from './components/SummaryStrip';
import { ChangeNavigator } from './components/ChangeNavigator';
import { DocumentViewer } from './components/DocumentViewer';

export function App() {
  const [docA, setDocA] = useState<DocumentMeta>(() => ({
    name: 'Sample_Master_Services_Agreement_v1.0.txt',
    type: 'txt',
    wordCount: SAMPLE_CONTRACT_ORIGINAL.trim().split(/\s+/).length,
    charCount: SAMPLE_CONTRACT_ORIGINAL.length,
    rawText: SAMPLE_CONTRACT_ORIGINAL,
  }));

  const [docB, setDocB] = useState<DocumentMeta>(() => ({
    name: 'Sample_Master_Services_Agreement_v1.1_Amended.txt',
    type: 'txt',
    wordCount: SAMPLE_CONTRACT_REVISED.trim().split(/\s+/).length,
    charCount: SAMPLE_CONTRACT_REVISED.length,
    rawText: SAMPLE_CONTRACT_REVISED,
  }));

  const [ignoreWhitespaceNoise, setIgnoreWhitespaceNoise] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('ALL');
  const [activeChangeId, setActiveChangeId] = useState<number | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { hunks, summary } = useMemo(() => {
    return computeRedlineDiff(docA.rawText, docB.rawText, {
      granularity: 'words',
      ignoreWhitespaceNoise,
    });
  }, [docA.rawText, docB.rawText, ignoreWhitespaceNoise]);

  const handleLoadSample = () => {
    setDocA({
      name: 'Sample_Master_Services_Agreement_v1.0.txt',
      type: 'txt',
      wordCount: SAMPLE_CONTRACT_ORIGINAL.trim().split(/\s+/).length,
      charCount: SAMPLE_CONTRACT_ORIGINAL.length,
      rawText: SAMPLE_CONTRACT_ORIGINAL,
    });
    setDocB({
      name: 'Sample_Master_Services_Agreement_v1.1_Amended.txt',
      type: 'txt',
      wordCount: SAMPLE_CONTRACT_REVISED.trim().split(/\s+/).length,
      charCount: SAMPLE_CONTRACT_REVISED.length,
      rawText: SAMPLE_CONTRACT_REVISED,
    });
    setActiveChangeId(null);
  };

  const handleSwap = () => {
    const tempA = { ...docA };
    setDocA({ ...docB, name: docB.name.replace('Revised', 'Original') });
    setDocB({ ...tempA, name: tempA.name.replace('Original', 'Revised') });
    setActiveChangeId(null);
  };

  const handleClear = () => {
    setDocA({
      name: 'Empty_Document_A.txt',
      type: 'raw',
      wordCount: 0,
      charCount: 0,
      rawText: '',
    });
    setDocB({
      name: 'Empty_Document_B.txt',
      type: 'raw',
      wordCount: 0,
      charCount: 0,
      rawText: '',
    });
    setActiveChangeId(null);
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const pdfBytes = await generateAuditPdfReport({
        docA,
        docB,
        hunks,
        summary,
      });

      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RedlineDiff_Audit_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Could not export PDF report. Please verify browser permissions.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0F172A]">
      {/* 1. Top Privacy & Action Bar */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Local Processing Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-base tracking-tighter">
                RD
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  RedlineDiff
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    v1.0 Local
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Legal Contract & Redline Clause Comparator
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Local Browser Processing — Zero Cloud / Private RAM</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Loads a sample amended freelance contract with payment and liability alterations"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample Amended Contract</span>
            </button>

            <button
              onClick={handleSwap}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Swap Document A and Document B"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swap A ↔ B</span>
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Clear all text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export Audit Report (.pdf)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Dual Dropzone Header */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentSlot
            label="Baseline Agreement / Executed Master"
            versionBadge="Version A: Original"
            doc={docA}
            onChangeDoc={setDocA}
            accentColor="indigo"
          />
          <DocumentSlot
            label="Redline Draft / Counterparty Edits"
            versionBadge="Version B: Revised"
            doc={docB}
            onChangeDoc={setDocB}
            accentColor="emerald"
          />
        </section>

        {/* Summary Telemetry Strip */}
        <SummaryStrip
          summary={summary}
          ignoreWhitespaceNoise={ignoreWhitespaceNoise}
          onToggleNoise={setIgnoreWhitespaceNoise}
        />

        {/* Workbench: Left Change Navigator + Main Viewer */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[620px]">
          <ChangeNavigator
            hunks={hunks}
            activeChangeId={activeChangeId}
            onSelectChange={setActiveChangeId}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
          />

          <DocumentViewer
            hunks={hunks}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            activeChangeId={activeChangeId}
            onSelectChange={setActiveChangeId}
            originalName={docA.name}
            revisedName={docB.name}
          />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-2.5 px-6 text-center text-xs text-slate-500">
        <p>
          RedlineDiff Engine • Client-Side Deterministic Myers Diff & Automated Legal/Financial Risk
          Detection • No server logs, no external network transmission
        </p>
      </footer>
    </div>
  );
}

export default App;
