import { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import type { DocumentMeta } from '../types';
import { parseDocumentFile } from '../utils/documentParser';

interface DocumentSlotProps {
  label: string;
  versionBadge: 'Version A: Original' | 'Version B: Revised';
  doc: DocumentMeta;
  onChangeDoc: (doc: DocumentMeta) => void;
  accentColor: 'indigo' | 'emerald';
}

export const DocumentSlot = ({
  label,
  versionBadge,
  doc,
  onChangeDoc,
  accentColor,
}: DocumentSlotProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const parsed = await parseDocumentFile(file);
      onChangeDoc(parsed);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`Failed to parse ${file.name}: ${err?.message || 'Unsupported or corrupted format'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyPaste = () => {
    if (!pastedText.trim()) return;
    const words = pastedText.trim().split(/\s+/).filter(Boolean).length;
    onChangeDoc({
      name: `${versionBadge} (Pasted Text)`,
      type: 'raw',
      wordCount: words,
      charCount: pastedText.length,
      rawText: pastedText,
    });
    setShowPasteModal(false);
  };

  const badgeBg =
    accentColor === 'indigo'
      ? 'bg-slate-900 text-white border-slate-800'
      : 'bg-emerald-800 text-emerald-50 border-emerald-900';

  return (
    <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex flex-col overflow-hidden">
      {/* Slot Header */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md border ${badgeBg}`}>
            {versionBadge}
          </span>
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">{label}</span>
        </div>

        <button
          onClick={() => {
            setPastedText(doc.rawText);
            setShowPasteModal(true);
          }}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          Raw Text / Paste
        </button>
      </div>

      {/* Main Dropzone / File Info */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 transition-all duration-150 cursor-pointer flex items-center gap-4 ${
          isDragging
            ? 'bg-amber-50/70 border-2 border-dashed border-amber-500'
            : 'hover:bg-slate-50/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{doc.name || 'Select or drop contract'}</p>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {doc.type}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>
              <strong>{doc.wordCount.toLocaleString()}</strong> words
            </span>
            <span>•</span>
            <span>{doc.charCount.toLocaleString()} chars</span>
            {doc.pageCount && (
              <>
                <span>•</span>
                <span>{doc.pageCount} pages</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 hidden md:block">
          <span className="text-xs text-slate-400 font-medium">Click or Drop (.docx, .pdf, .txt, .md)</span>
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-xs text-rose-700 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Raw Text Modal */}
      {showPasteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPasteModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Text / Clause Input</h3>
                <p className="text-xs text-slate-500">Paste raw legal text or modified contract wording</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {pastedText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <div className="p-4 flex-1 overflow-auto">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste contract text here..."
                rows={14}
                className="w-full text-xs font-legal leading-relaxed p-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-slate-50/50"
              />
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPaste}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Apply Text to {versionBadge.split(':')[0]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
