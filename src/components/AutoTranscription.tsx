import { useState, useRef } from 'react';
import {
  transcribeVideo,
  TranscriptionProgress,
  TranscriptionChunk,
  SUPPORTED_LANGUAGES,
  isModelLoaded,
  isSharedArrayBufferAvailable,
} from '../services/transcriptionService';
import { Subtitle } from '../types';
import { generateId } from '../utils/subtitleUtils';

interface AutoTranscriptionProps {
  videoFile: File | null;
  onSubtitlesGenerated: (subtitles: Subtitle[]) => void;
}

export default function AutoTranscription({
  videoFile,
  onSubtitlesGenerated,
}: AutoTranscriptionProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [language, setLanguage] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const abortRef = useRef(false);

  const handleTranscribe = async () => {
    if (!videoFile) return;

    setIsTranscribing(true);
    abortRef.current = false;
    setProgress({
      status: 'loading',
      progress: 0,
      message: 'Iniciando...',
    });

    try {
      const chunks: TranscriptionChunk[] = await transcribeVideo(
        videoFile,
        (p) => {
          if (!abortRef.current) {
            setProgress(p);
          }
        },
        language || undefined
      );

      if (abortRef.current) return;

      // Convert chunks to subtitles
      const subtitles: Subtitle[] = chunks.map((chunk) => {
        const startTime = chunk.timestamp[0] ?? 0;
        const endTime = chunk.timestamp[1] ?? startTime + 3;
        
        return {
          id: generateId(),
          startTime,
          endTime,
          text: chunk.text,
        };
      });

      onSubtitlesGenerated(subtitles);
      setProgress({
        status: 'complete',
        progress: 100,
        message: `¡Completado! ${subtitles.length} subtítulos generados`,
      });
    } catch (error) {
      if (!abortRef.current) {
        setProgress({
          status: 'error',
          progress: 0,
          message: `Error: ${error instanceof Error ? error.message : 'Error en la transcripción'}`,
        });
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setIsTranscribing(false);
    setProgress(null);
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-600';
    switch (progress.status) {
      case 'loading':
        return 'bg-blue-500';
      case 'extracting':
        return 'bg-yellow-500';
      case 'transcribing':
        return 'bg-indigo-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (!progress) return 'fas fa-microphone';
    switch (progress.status) {
      case 'loading':
        return 'fas fa-download animate-pulse';
      case 'extracting':
        return 'fas fa-music animate-pulse';
      case 'transcribing':
        return 'fas fa-waveform-lines animate-pulse';
      case 'complete':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-microphone';
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-1.5">
            <i className="fas fa-wand-magic-sparkles text-white text-xs"></i>
          </div>
          Transcripción Automática
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          title="Configuración"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <label className="text-xs text-gray-400 block mb-1.5">Idioma del audio</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isTranscribing}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Auto-detectar</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            <i className="fas fa-info-circle mr-1 text-indigo-400"></i>
            El modelo Whisper se descarga la primera vez (~40MB). Luego se almacena en caché.
          </p>
          {!isSharedArrayBufferAvailable() && (
            <p className="text-xs text-yellow-400 mt-2">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Modo single-thread (más lento). Para mejor rendimiento, usa un servidor con headers COOP/COEP.
            </p>
          )}
        </div>
      )}

      {/* Progress bar */}
      {progress && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <i className={`${getStatusIcon()} text-sm ${
              progress.status === 'complete' ? 'text-green-400' : 
              progress.status === 'error' ? 'text-red-400' : 'text-indigo-400'
            }`}></i>
            <span className="text-xs text-gray-300 flex-1">{progress.message}</span>
            <span className="text-xs text-gray-500 font-mono">{progress.progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isTranscribing ? (
          <button
            onClick={handleTranscribe}
            disabled={!videoFile}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
          >
            <i className="fas fa-microphone-lines"></i>
            {isModelLoaded() ? 'Generar Subtítulos' : 'Generar Subtítulos con IA'}
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-600/80 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-stop"></i>
            Cancelar
          </button>
        )}
      </div>

      {/* Info */}
      {!videoFile && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          <i className="fas fa-arrow-up mr-1"></i>
          Sube un video primero para usar la transcripción
        </p>
      )}
    </div>
  );
}
