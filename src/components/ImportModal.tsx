import { useRef } from 'react';
import { Subtitle } from '../types';
import { parseSRT, parseVTT } from '../utils/subtitleUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (subtitles: Subtitle[]) => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      let subtitles: Subtitle[] = [];

      if (file.name.endsWith('.srt')) {
        subtitles = parseSRT(content);
      } else if (file.name.endsWith('.vtt')) {
        subtitles = parseVTT(content);
      } else {
        // Try SRT format by default
        subtitles = parseSRT(content);
      }

      if (subtitles.length > 0) {
        onImport(subtitles);
        onClose();
      } else {
        alert('Could not parse any subtitles from this file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <i className="fas fa-upload text-indigo-400"></i>
            Import Subtitles
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="text-center">
            <div className="mb-4">
              <i className="fas fa-file-import text-4xl text-indigo-400 mb-3 block"></i>
              <p className="text-gray-300 mb-2">Import subtitle file</p>
              <p className="text-sm text-gray-500">Supports SRT and WebVTT formats</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt,.vtt,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-2"
            >
              <i className="fas fa-folder-open"></i>
              Choose File
            </button>
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">
                <i className="fas fa-info-circle mr-1 text-indigo-400"></i>
                Imported subtitles will be added to your existing list. You can edit them afterwards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
