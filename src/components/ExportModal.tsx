import { useState } from 'react';
import { Subtitle, ExportFormat } from '../types';
import { exportSubtitles } from '../utils/subtitleUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: Subtitle[];
}

export default function ExportModal({ isOpen, onClose, subtitles }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('srt');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const content = exportSubtitles(subtitles, format);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <i className="fas fa-download text-indigo-400"></i>
            Export Subtitles
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Format selector */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Export Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('srt')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  format === 'srt'
                    ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <i className="fas fa-file-alt mr-2"></i>
                SRT Format
              </button>
              <button
                onClick={() => setFormat('vtt')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  format === 'vtt'
                    ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <i className="fas fa-code mr-2"></i>
                WebVTT Format
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Preview ({subtitles.length} subtitles)</label>
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-green-400 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
              {content || 'No subtitles to export'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-gray-700">
          <button
            onClick={handleCopy}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i className={`fas ${copied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            disabled={subtitles.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-download"></i>
            Download .{format}
          </button>
        </div>
      </div>
    </div>
  );
}
