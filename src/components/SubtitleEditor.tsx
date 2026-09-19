import { useState } from 'react';
import { Subtitle } from '../types';
import { formatTime, formatTimeDisplay } from '../utils/subtitleUtils';

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  currentTime: number;
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string | null) => void;
  onUpdateSubtitle: (id: string, updates: Partial<Subtitle>) => void;
  onDeleteSubtitle: (id: string) => void;
  onAddSubtitle: () => void;
  onSeek: (time: number) => void;
}

export default function SubtitleEditor({
  subtitles,
  currentTime,
  selectedSubtitleId,
  onSelectSubtitle,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  onSeek,
}: SubtitleEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);

  const startEdit = (sub: Subtitle) => {
    setEditingId(sub.id);
    setEditText(sub.text);
    setEditStart(formatTime(sub.startTime));
    setEditEnd(formatTime(sub.endTime));
  };

  const saveEdit = (id: string) => {
    onUpdateSubtitle(id, {
      text: editText,
      startTime: parseTime(editStart),
      endTime: parseTime(editEnd),
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hrs = parseFloat(parts[0]);
      const mins = parseFloat(parts[1]);
      const secs = parseFloat(parts[2].replace(',', '.'));
      return hrs * 3600 + mins * 60 + secs;
    }
    return parseFloat(timeStr) || 0;
  };

  const handleSetStartToCurrent = () => {
    setEditStart(formatTime(currentTime));
  };

  const handleSetEndToCurrent = () => {
    setEditEnd(formatTime(currentTime));
  };

  const getActiveSubtitle = () => {
    return subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );
  };

  const activeSub = getActiveSubtitle();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <i className="fas fa-closed-captioning text-indigo-400"></i>
          Subtitles
          <span className="text-sm text-gray-400 font-normal">({subtitles.length})</span>
        </h2>
        <button
          onClick={onAddSubtitle}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add
        </button>
      </div>

      {/* Quick add at current time */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Quick add at current time ({formatTimeDisplay(currentTime)})</p>
        <button
          onClick={onAddSubtitle}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
        >
          <i className="fas fa-plus-circle"></i>
          New subtitle from current position
        </button>
      </div>

      {/* Subtitle list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {sortedSubtitles.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-comment-slash text-3xl mb-3 block"></i>
            <p>No subtitles yet</p>
            <p className="text-sm mt-1">Click "Add" to create your first subtitle</p>
          </div>
        ) : (
          sortedSubtitles.map((sub, index) => {
            const isActive = activeSub?.id === sub.id;
            const isSelected = selectedSubtitleId === sub.id;
            const isEditing = editingId === sub.id;

            return (
              <div
                key={sub.id}
                className={`rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-950/50 shadow-lg shadow-indigo-500/10'
                    : isSelected
                    ? 'border-indigo-400/50 bg-gray-800/80'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => !isEditing && onSelectSubtitle(sub.id)}
              >
                {isEditing ? (
                  <div className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">Start</label>
                        <input
                          type="text"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          onClick={handleSetStartToCurrent}
                          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                        >
                          Set to current
                        </button>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 block mb-1">End</label>
                        <input
                          type="text"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          onClick={handleSetEndToCurrent}
                          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                        >
                          Set to current
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white resize-none focus:border-indigo-500 focus:outline-none"
                      rows={2}
                      placeholder="Enter subtitle text..."
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveEdit(sub.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-sm transition-colors"
                      >
                        <i className="fas fa-check mr-1"></i>Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 rounded text-sm transition-colors"
                      >
                        <i className="fas fa-times mr-1"></i>Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 font-medium">#{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-indigo-400 font-mono">
                          {formatTimeDisplay(sub.startTime)} → {formatTimeDisplay(sub.endTime)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSeek(sub.startTime);
                            }}
                            className="text-gray-500 hover:text-indigo-400 transition-colors text-xs p-1"
                            title="Go to start"
                          >
                            <i className="fas fa-play-circle"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(sub);
                            }}
                            className="text-gray-500 hover:text-yellow-400 transition-colors text-xs p-1"
                            title="Edit"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSubtitle(sub.id);
                            }}
                            className="text-gray-500 hover:text-red-400 transition-colors text-xs p-1"
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {sub.text || <span className="italic text-gray-500">Empty subtitle</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
