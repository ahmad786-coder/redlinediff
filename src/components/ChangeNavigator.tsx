import { AlertCircle, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import type { DiffHunk, RiskFilter } from '../types';

interface ChangeNavigatorProps {
  hunks: DiffHunk[];
  activeChangeId: number | null;
  onSelectChange: (id: number) => void;
  activeFilter: RiskFilter;
  onChangeFilter: (f: RiskFilter) => void;
}

export const ChangeNavigator = ({
  hunks,
  activeChangeId,
  onSelectChange,
  activeFilter,
  onChangeFilter,
}: ChangeNavigatorProps) => {
  const changedHunks = hunks.filter((h) => h.type !== 'UNCHANGED');

  const filteredHunks = changedHunks.filter((h) => {
    if (activeFilter === 'HIGH_RISK_ONLY') {
      return h.severity === 'CRITICAL' || h.severity === 'HIGH';
    }
    if (activeFilter === 'ADDITIONS') {
      return h.type === 'ADDED' || (h.type === 'MODIFIED' && h.addedValue);
    }
    if (activeFilter === 'DELETIONS') {
      return h.type === 'REMOVED' || (h.type === 'MODIFIED' && h.removedValue);
    }
    return true;
  });

  const highRiskCount = changedHunks.filter(
    (h) => h.severity === 'CRITICAL' || h.severity === 'HIGH'
  ).length;

  return (
    <div className="w-80 bg-white border border-[#E2E8F0] rounded-xl flex flex-col h-full overflow-hidden shadow-xs shrink-0">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Change Navigator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full font-semibold">
            {filteredHunks.length} of {changedHunks.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <button
            onClick={() => onChangeFilter('ALL')}
            className={`px-2 py-1 rounded-md font-medium text-left transition-colors cursor-pointer flex items-center justify-between ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All Changes</span>
            <span className="font-mono text-[10px] opacity-80">{changedHunks.length}</span>
          </button>

          <button
            onClick={() => onChangeFilter('HIGH_RISK_ONLY')}
            className={`px-2 py-1 rounded-md font-medium text-left transition-colors cursor-pointer flex items-center justify-between ${
              activeFilter === 'HIGH_RISK_ONLY'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>⚠️</span>
              <span>High Risk</span>
            </span>
            <span className="font-mono text-[10px] font-bold">{highRiskCount}</span>
          </button>

          <button
            onClick={() => onChangeFilter('ADDITIONS')}
            className={`px-2 py-1 rounded-md font-medium text-left transition-colors cursor-pointer flex items-center justify-between ${
              activeFilter === 'ADDITIONS'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Additions</span>
            <span className="font-mono text-[10px] text-emerald-600 font-bold">+</span>
          </button>

          <button
            onClick={() => onChangeFilter('DELETIONS')}
            className={`px-2 py-1 rounded-md font-medium text-left transition-colors cursor-pointer flex items-center justify-between ${
              activeFilter === 'DELETIONS'
                ? 'bg-rose-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Deletions</span>
            <span className="font-mono text-[10px] text-rose-600 font-bold">-</span>
          </button>
        </div>
      </div>

      {/* Changes Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
        {filteredHunks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">No matching changes in this filter</p>
          </div>
        ) : (
          filteredHunks.map((hunk) => {
            const isSelected = activeChangeId === hunk.id;

            return (
              <div
                key={hunk.id}
                onClick={() => onSelectChange(hunk.id)}
                className={`p-2.5 rounded-lg text-left cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      #{hunk.id}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
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
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" />
                      FINANCIAL
                    </span>
                  )}

                  {hunk.severity === 'HIGH' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      LEGAL
                    </span>
                  )}

                  {hunk.severity === 'STANDARD' && (
                    <span className="text-[9px] font-medium text-slate-400">
                      Editorial
                    </span>
                  )}
                </div>

                {/* Snippet Preview */}
                <div className="text-xs font-legal leading-snug line-clamp-2 text-slate-700 space-y-0.5">
                  {hunk.removedValue && (
                    <p className="text-rose-600 line-through truncate text-[11px]">
                      - {hunk.removedValue.trim()}
                    </p>
                  )}
                  {hunk.addedValue && (
                    <p className="text-emerald-700 font-medium truncate text-[11px]">
                      + {hunk.addedValue.trim()}
                    </p>
                  )}
                </div>

                {/* Reason Tag */}
                {hunk.riskReasons.length > 0 && hunk.severity !== 'STANDARD' && (
                  <p className="mt-1.5 text-[10px] text-amber-800 bg-amber-50/90 border border-amber-200/60 rounded px-1.5 py-0.5 leading-tight truncate">
                    {hunk.riskReasons[0]}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
