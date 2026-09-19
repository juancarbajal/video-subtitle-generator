import { useState, useCallback, useEffect, useRef } from 'react';
import { Subtitle } from './types';
import { generateId, formatTime } from './utils/subtitleUtils';
import VideoPlayer from './components/VideoPlayer';
import SubtitleEditor from './components/SubtitleEditor';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import AutoTranscription from './components/AutoTranscription';

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Handle video file upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
    }
  };

  // Handle time updates from video
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Handle duration changes
  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  // Handle play state changes
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Add subtitle at current time
  const handleAddSubtitle = () => {
    const newSubtitle: Subtitle = {
      id: generateId(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, duration || currentTime + 3),
      text: '',
    };
    setSubtitles((prev) => [...prev, newSubtitle]);
    setSelectedSubtitleId(newSubtitle.id);
  };

  // Update subtitle
  const handleUpdateSubtitle = (id: string, updates: Partial<Subtitle>) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    );
  };

  // Delete subtitle
  const handleDeleteSubtitle = (id: string) => {
    setSubtitles((prev) => prev.filter((sub) => sub.id !== id));
    if (selectedSubtitleId === id) {
      setSelectedSubtitleId(null);
    }
  };

  // Import subtitles
  const handleImport = (importedSubs: Subtitle[]) => {
    setSubtitles((prev) => [...prev, ...importedSubs]);
  };

  // Handle auto-generated subtitles
  const handleSubtitlesGenerated = (generatedSubs: Subtitle[]) => {
    setSubtitles((prev) => [...prev, ...generatedSubs]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        handleAddSubtitle();
      }
      if (e.key === 'e' && e.ctrlKey) {
        e.preventDefault();
        setShowExportModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-2">
              <i className="fas fa-closed-captioning text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Subtitle Studio</h1>
              <p className="text-xs text-gray-400">Subtítulos automáticos con IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Video upload */}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <button
              onClick={() => videoFileInputRef.current?.click()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700"
            >
              <i className="fas fa-video"></i>
              <span className="hidden sm:inline">{videoFile ? videoFile.name : 'Subir Video'}</span>
            </button>

            {/* Import subtitles */}
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700"
              title="Importar subtítulos"
            >
              <i className="fas fa-file-import"></i>
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Export subtitles */}
            <button
              onClick={() => setShowExportModal(true)}
              disabled={subtitles.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Exportar subtítulos"
            >
              <i className="fas fa-file-export"></i>
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video section */}
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer
              videoUrl={videoUrl}
              subtitles={subtitles}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlayStateChange={handlePlayStateChange}
              onSeek={handleSeek}
            />

            {/* Auto transcription */}
            <AutoTranscription
              videoFile={videoFile}
              onSubtitlesGenerated={handleSubtitlesGenerated}
            />

            {/* Current time info */}
            <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Tiempo Actual</p>
                  <p className="text-sm font-mono text-indigo-400">{formatTime(currentTime)}</p>
                </div>
                <div className="w-px h-8 bg-gray-700"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Duración</p>
                  <p className="text-sm font-mono text-gray-300">{formatTime(duration)}</p>
                </div>
                <div className="w-px h-8 bg-gray-700"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Subtítulos</p>
                  <p className="text-sm font-mono text-gray-300">{subtitles.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddSubtitle}
                  disabled={!videoUrl}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <i className="fas fa-plus"></i>
                  Añadir en {formatTime(currentTime).slice(0, 8)}
                </button>
              </div>
            </div>

            {/* Quick help */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-upload text-indigo-400 text-xs"></i>
                  <span className="text-xs text-gray-400">1. Subir Video</span>
                </div>
                <p className="text-xs text-gray-500">Carga tu archivo de video</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-wand-magic-sparkles text-purple-400 text-xs"></i>
                  <span className="text-xs text-gray-400">2. Auto IA</span>
                </div>
                <p className="text-xs text-gray-500">Genera subtítulos con Whisper</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-pen text-yellow-400 text-xs"></i>
                  <span className="text-xs text-gray-400">3. Editar</span>
                </div>
                <p className="text-xs text-gray-500">Ajusta tiempos y texto</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <i className="fas fa-download text-green-400 text-xs"></i>
                  <span className="text-xs text-gray-400">4. Exportar</span>
                </div>
                <p className="text-xs text-gray-500">Descarga SRT o VTT</p>
              </div>
            </div>
          </div>

          {/* Subtitle editor panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 h-[calc(100vh-12rem)] flex flex-col">
              <SubtitleEditor
                subtitles={subtitles}
                currentTime={currentTime}
                selectedSubtitleId={selectedSubtitleId}
                onSelectSubtitle={setSelectedSubtitleId}
                onUpdateSubtitle={handleUpdateSubtitle}
                onDeleteSubtitle={handleDeleteSubtitle}
                onAddSubtitle={handleAddSubtitle}
                onSeek={handleSeek}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        subtitles={subtitles}
      />
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  );
}
