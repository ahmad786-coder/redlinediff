import { useEffect, useRef } from 'react';
import type { DiffHunk, ViewMode } from '../types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface DocumentViewerProps {
  hunks: DiffHunk[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  activeChangeId: number | null;
  onSelectChange: (id: number) => void;
  originalName: string;
  revisedName: string;
}

export const DocumentViewer = ({
  hunks,
  viewMode,
  onChangeViewMode,
  activeChangeId,
  onSelectChange,
  originalName,
  revisedName,
}: DocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const handleScroll = (source: 'left' | 'right') => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (source === 'left' && leftPaneRef.current && rightPaneRef.current) {
      const percentage =
        leftPaneRef.current.scrollTop /
        (leftPaneRef.current.scrollHeight - leftPaneRef.current.clientHeight);
      rightPaneRef.current.scrollTop =
        percentage * (rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight);
    } else if (source === 'right' && leftPaneRef.current && rightPaneRef.current) {
      const percentage =
        rightPaneRef.current.scrollTop /
        (rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight);
      leftPaneRef.current.scrollTop =
        percentage * (leftPaneRef.current.scrollHeight - leftPaneRef.current.clientHeight);
    }

    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  useEffect(() => {
    if (activeChangeId !== null && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-change-id="${activeChangeId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeChangeId]);

  return (
    <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl flex flex-col h-full overflow-hidden shadow-xs">
      {/* Top Controls Header */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => onChangeViewMode('unified')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'unified'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unified Redline (Track Changes)
          </button>
          <button
            onClick={() => onChangeViewMode('split')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side Split View
          </button>
          <button
            onClick={() => onChangeViewMode('digest')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'digest'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Changes-Only Digest
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="line-through text-rose-700">Deleted (Original)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-700 font-medium underline">Added (Revised)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-800">High Risk Clause</span>
          </span>
        </div>
      </div>

      {/* Viewer Content Canvas */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
        {/* Unified Redline View */}
        {viewMode === 'unified' && (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="font-legal text-[15px] leading-relaxed text-slate-900 whitespace-pre-wrap selection:bg-amber-100">
              {hunks.map((hunk, index) => {
                if (hunk.type === 'UNCHANGED') {
                  return <span key={index}>{hunk.value}</span>;
                }

                const isActive = activeChangeId === hunk.id;

                if (hunk.type === 'MODIFIED') {
                  return (
                    <span
                      key={index}
                      data-change-id={hunk.id}
                      onClick={() => onSelectChange(hunk.id)}
                      className={`inline cursor-pointer rounded px-1 transition-all ${
                        isActive
                          ? 'ring-2 ring-amber-500 bg-amber-100/60'
                          : hunk.severity === 'CRITICAL'
                          ? 'bg-rose-50 border-b-2 border-rose-500'
                          : hunk.severity === 'HIGH'
                          ? 'bg-amber-50 border-b-2 border-amber-500'
                          : 'hover:bg-slate-100'
                      }`}
                      title={`Change #${hunk.id}: ${hunk.riskReasons.join('; ')}`}
                    >
                      <del className="bg-[#FEE2E2] text-[#DC2626] line-through px-0.5 rounded mx-0.5 decoration-[#DC2626]">
                        {hunk.removedValue}
                      </del>
                      <ins className="bg-[#D1FAE5] text-[#059669] no-underline font-medium px-0.5 rounded mx-0.5 border-b border-[#059669]">
                        {hunk.addedValue}
                      </ins>
                    </span>
                  );
                }

                if (hunk.type === 'REMOVED') {
                  return (
                    <del
                      key={index}
                      data-change-id={hunk.id}
                      onClick={() => onSelectChange(hunk.id)}
                      className={`bg-[#FEE2E2] text-[#DC2626] line-through px-1 rounded mx-0.5 cursor-pointer decoration-[#DC2626] transition-all inline ${
                        isActive ? 'ring-2 ring-amber-500 bg-rose-200' : ''
                      }`}
                      title={`Change #${hunk.id} (Deleted): ${hunk.riskReasons.join('; ')}`}
                    >
                      {hunk.value}
                    </del>
                  );
                }

                if (hunk.type === 'ADDED') {
                  return (
                    <ins
                      key={index}
                      data-change-id={hunk.id}
                      onClick={() => onSelectChange(hunk.id)}
                      className={`bg-[#D1FAE5] text-[#059669] no-underline font-medium px-1 rounded mx-0.5 cursor-pointer border-b border-[#059669] transition-all inline ${
                        isActive ? 'ring-2 ring-amber-500 bg-emerald-200' : ''
                      }`}
                      title={`Change #${hunk.id} (Added): ${hunk.riskReasons.join('; ')}`}
                    >
                      {hunk.value}
                    </ins>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Side-by-Side Split View */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-2 gap-4 h-full min-h-[500px]">
            {/* Left Pane: Original */}
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Original Document (A)
                </span>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{originalName}</span>
              </div>
              <div
                ref={leftPaneRef}
                onScroll={() => handleScroll('left')}
                className="p-6 font-legal text-sm leading-relaxed text-slate-800 flex-1 overflow-y-auto whitespace-pre-wrap"
              >
                {hunks.map((hunk, index) => {
                  if (hunk.type === 'ADDED') return null;
                  if (hunk.type === 'UNCHANGED') {
                    return <span key={index}>{hunk.value}</span>;
                  }

                  const isActive = activeChangeId === hunk.id;
                  const text = hunk.type === 'MODIFIED' ? hunk.removedValue : hunk.value;

                  return (
                    <span
                      key={index}
                      data-change-id={hunk.id}
                      onClick={() => onSelectChange(hunk.id)}
                      className={`bg-[#FEE2E2] text-[#DC2626] line-through px-0.5 rounded cursor-pointer transition-all ${
                        isActive ? 'ring-2 ring-amber-500 bg-rose-200' : ''
                      }`}
                    >
                      {text}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Revised */}
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Revised Document (B)
                </span>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{revisedName}</span>
              </div>
              <div
                ref={rightPaneRef}
                onScroll={() => handleScroll('right')}
                className="p-6 font-legal text-sm leading-relaxed text-slate-800 flex-1 overflow-y-auto whitespace-pre-wrap"
              >
                {hunks.map((hunk, index) => {
                  if (hunk.type === 'REMOVED') return null;
                  if (hunk.type === 'UNCHANGED') {
                    return <span key={index}>{hunk.value}</span>;
                  }

                  const isActive = activeChangeId === hunk.id;
                  const text = hunk.type === 'MODIFIED' ? hunk.addedValue : hunk.value;

                  return (
                    <span
                      key={index}
                      data-change-id={hunk.id}
                      onClick={() => onSelectChange(hunk.id)}
                      className={`bg-[#D1FAE5] text-[#059669] font-medium px-0.5 rounded cursor-pointer border-b border-[#059669] transition-all ${
                        isActive ? 'ring-2 ring-amber-500 bg-emerald-200' : ''
                      }`}
                    >
                      {text}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Changes-Only Digest Table */}
        {viewMode === 'digest' && (
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Clause-by-Clause Audit Digest</h4>
                  <p className="text-xs text-slate-500">
                    Highlighting modified terms without boilerplate text
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-md">
                  {hunks.filter((h) => h.type !== 'UNCHANGED').length} Clauses Modified
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {hunks
                  .filter((h) => h.type !== 'UNCHANGED')
                  .map((hunk) => {
                    const isActive = activeChangeId === hunk.id;

                    return (
                      <div
                        key={hunk.id}
                        data-change-id={hunk.id}
                        onClick={() => onSelectChange(hunk.id)}
                        className={`p-4 transition-colors cursor-pointer ${
                          isActive ? 'bg-amber-50/70 ring-1 ring-inset ring-amber-400' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800">
                              Change #{hunk.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                hunk.type === 'ADDED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : hunk.type === 'REMOVED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {hunk.type}
                            </span>
                          </div>

                          {hunk.severity === 'CRITICAL' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              CRITICAL FINANCIAL / TIMELINE SHIFT
                            </span>
                          )}

                          {hunk.severity === 'HIGH' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              HIGH-STAKES LEGAL CLAUSE
                            </span>
                          )}
                        </div>

                        {hunk.riskReasons.map((reason, idx) => (
                          <p key={idx} className="text-xs text-amber-900 font-medium mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {reason}
                          </p>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs font-legal leading-relaxed">
                          {hunk.removedValue && (
                            <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80">
                              <p className="text-[10px] font-bold text-rose-700 uppercase font-sans mb-1">
                                Original (Removed)
                              </p>
                              <p className="text-rose-900 whitespace-pre-wrap">{hunk.removedValue}</p>
                            </div>
                          )}

                          {hunk.addedValue && (
                            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                              <p className="text-[10px] font-bold text-emerald-700 uppercase font-sans mb-1">
                                Revised (Added)
                              </p>
                              <p className="text-emerald-950 font-medium whitespace-pre-wrap">{hunk.addedValue}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
