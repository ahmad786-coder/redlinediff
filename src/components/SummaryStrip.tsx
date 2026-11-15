import { Layers, AlertTriangle, Plus, Minus, Percent } from 'lucide-react';
import type { RedlineSummary } from '../types';

interface SummaryStripProps {
  summary: RedlineSummary;
  ignoreWhitespaceNoise: boolean;
  onToggleNoise: (val: boolean) => void;
}

export const SummaryStrip = ({
  summary,
  ignoreWhitespaceNoise,
  onToggleNoise,
}: SummaryStripProps) => {
  const totalHighRisk = summary.criticalRiskCount + summary.highRiskCount;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 px-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Total Changes */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Changes</p>
            <p className="text-base font-bold text-slate-900 leading-none mt-0.5 font-mono">
              {summary.totalChanges}
            </p>
          </div>
        </div>

        {/* High-Risk Alerts */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              totalHighRisk > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">High-Risk Alerts</p>
              {summary.criticalRiskCount > 0 && (
                <span className="text-[9px] font-semibold bg-rose-100 text-rose-700 px-1 py-0.2 rounded">
                  {summary.criticalRiskCount} Critical
                </span>
              )}
            </div>
            <p className="text-base font-bold text-slate-900 leading-none mt-0.5 font-mono">
              {totalHighRisk}
            </p>
          </div>
        </div>

        {/* Words Added / Deleted */}
        <div className="flex items-center gap-4 border-l border-slate-200 pl-4 hidden sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Added</p>
              <p className="text-sm font-bold text-emerald-700 leading-none font-mono">
                +{summary.wordsAdded.toLocaleString()} w
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <Minus className="w-3 h-3" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Deleted</p>
              <p className="text-sm font-bold text-rose-700 leading-none font-mono">
                -{summary.wordsDeleted.toLocaleString()} w
              </p>
            </div>
          </div>
        </div>

        {/* Similarity Percentage */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Similarity</p>
            <p className="text-base font-bold text-slate-900 leading-none mt-0.5 font-mono">
              {summary.similarityScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Formatting Noise Toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors">
          <input
            type="checkbox"
            checked={ignoreWhitespaceNoise}
            onChange={(e) => onToggleNoise(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
          />
          <span>Ignore Whitespace & Formatting Noise</span>
        </label>
      </div>
    </div>
  );
};
