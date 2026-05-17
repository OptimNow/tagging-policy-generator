import React, { useEffect } from 'react';
import { AlertTriangle, Info, X, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { CategorizedExportWarnings, CloudProvider } from '../types';

interface ExportWarningsModalProps {
  isOpen: boolean;
  provider: CloudProvider;
  formatLabel: string;            // e.g. "Azure Policy Initiative"
  filenameHint: string;           // e.g. "azure_tagging_bundle.json"
  warnings: CategorizedExportWarnings;
  onCancel: () => void;
  onContinue: () => void;
}

const PROVIDER_LABEL: Record<CloudProvider, string> = {
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
};

export const ExportWarningsModal: React.FC<ExportWarningsModalProps> = ({
  isOpen,
  provider,
  formatLabel,
  filenameHint,
  warnings,
  onCancel,
  onContinue,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Escape key cancels
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const hasLimitations = warnings.limitations.length > 0;
  const hasNotes = warnings.deploymentNotes.length > 0;
  const nothingToFlag = !hasLimitations && !hasNotes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-warnings-title"
    >
      <div
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border border-white/10 text-white' : 'bg-white border border-gray-200 text-charcoal'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div>
            <h2 id="export-warnings-title" className="text-lg font-semibold">
              Export {PROVIDER_LABEL[provider]} {formatLabel}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Review before downloading <code className={`px-1 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>{filenameHint}</code>
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-charcoal'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {nothingToFlag && (
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No limitations or deployment notes for this policy. You're good to download.
            </p>
          )}

          {hasLimitations && (
            <section>
              <div className={`flex items-center gap-2 mb-2 font-semibold text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                <AlertTriangle size={16} />
                Limitations
              </div>
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                These features won't be preserved in the {PROVIDER_LABEL[provider]} format.
              </p>
              <ul className="space-y-2">
                {warnings.limitations.map((w, i) => (
                  <li
                    key={i}
                    className={`text-sm leading-relaxed pl-3 border-l-2 ${isDark ? 'border-amber-500/50 text-gray-200' : 'border-amber-400 text-gray-800'}`}
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasNotes && (
            <section>
              <div className={`flex items-center gap-2 mb-2 font-semibold text-sm ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                <Info size={16} />
                Deployment notes
              </div>
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Operational guidance — not feature loss.
              </p>
              <ul className="space-y-2">
                {warnings.deploymentNotes.map((w, i) => (
                  <li
                    key={i}
                    className={`text-sm leading-relaxed pl-3 border-l-2 ${isDark ? 'border-sky-500/50 text-gray-200' : 'border-sky-400 text-gray-800'}`}
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-white/10 bg-[#141414]' : 'border-gray-200 bg-gray-50'}`}>
          <Button
            variant="secondary"
            onClick={onCancel}
            className={isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
          >
            Cancel
          </Button>
          <Button onClick={onContinue}>
            <Download size={14} className="mr-1.5" />
            Download bundle
          </Button>
        </div>
      </div>
    </div>
  );
};
