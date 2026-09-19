import { pipeline, AutomaticSpeechRecognitionPipeline, env } from '@huggingface/transformers';

// Configure transformers.js environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// Use CDN for ONNX Runtime WASM files to avoid bundling 26MB+ in the app
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
}

// Singleton pipeline instance
let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let isLoading = false;
let loadProgress = 0;

export type TranscriptionProgress = {
  status: 'loading' | 'extracting' | 'transcribing' | 'complete' | 'error';
  progress: number;
  message: string;
};

export type TranscriptionChunk = {
  text: string;
  timestamp: [number, number | null];
};

type ProgressCallback = (progress: TranscriptionProgress) => void;

/**
 * Check if SharedArrayBuffer is available (needed for multi-threaded WASM)
 */
export function isSharedArrayBufferAvailable(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/**
 * Initialize the Whisper model pipeline
 */
async function initializeModel(onProgress: ProgressCallback): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber;
  if (isLoading) {
    // Wait for loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return transcriber!;
  }

  isLoading = true;
  loadProgress = 0;

  try {
    const hasThreads = isSharedArrayBufferAvailable();
    
    onProgress({
      status: 'loading',
      progress: 0,
      message: hasThreads 
        ? 'Cargando modelo de reconocimiento de voz (Whisper)...'
        : 'Cargando modelo (modo single-thread)...',
    });

    transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      {
        // Use single-threaded if SharedArrayBuffer is not available
        ...(hasThreads ? {} : { dtype: 'q8' }),
        progress_callback: (data: any) => {
          if (data.status === 'progress' && data.progress) {
            loadProgress = Math.round(data.progress);
            onProgress({
              status: 'loading',
              progress: loadProgress,
              message: `Descargando modelo... ${loadProgress}%`,
            });
          } else if (data.status === 'ready') {
            onProgress({
              status: 'loading',
              progress: 100,
              message: 'Modelo cargado y listo',
            });
          }
        },
      }
    );

    isLoading = false;
    return transcriber;
  } catch (error) {
    isLoading = false;
    throw error;
  }
}

/**
 * Extract audio from a video file as Float32Array at 16kHz mono
 */
async function extractAudioFromVideo(
  videoFile: File,
  onProgress: ProgressCallback
): Promise<{ audio: Float32Array; samplingRate: number }> {
  onProgress({
    status: 'extracting',
    progress: 0,
    message: 'Extrayendo audio del video...',
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 50);
        onProgress({
          status: 'extracting',
          progress: percent,
          message: `Leyendo archivo de video... ${percent}%`,
        });
      }
    };

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        
        onProgress({
          status: 'extracting',
          progress: 60,
          message: 'Decodificando audio...',
        });

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get mono audio data
        const audioData = audioBuffer.getChannelData(0); // First channel
        
        // If stereo, mix to mono
        let monoData: Float32Array;
        if (audioBuffer.numberOfChannels > 1) {
          const rightChannel = audioBuffer.getChannelData(1);
          monoData = new Float32Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            monoData[i] = (audioData[i] + rightChannel[i]) / 2;
          }
        } else {
          monoData = audioData;
        }

        onProgress({
          status: 'extracting',
          progress: 100,
          message: 'Audio extraído correctamente',
        });

        await audioContext.close();
        resolve({ audio: monoData, samplingRate: 16000 });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error reading video file'));
    reader.readAsArrayBuffer(videoFile);
  });
}

/**
 * Transcribe a video file and return subtitles with timestamps
 */
export async function transcribeVideo(
  videoFile: File,
  onProgress: ProgressCallback,
  language?: string
): Promise<TranscriptionChunk[]> {
  try {
    // Step 1: Initialize model
    const transcriberInstance = await initializeModel(onProgress);

    // Step 2: Extract audio
    const { audio } = await extractAudioFromVideo(videoFile, onProgress);

    // Step 3: Transcribe
    onProgress({
      status: 'transcribing',
      progress: 0,
      message: 'Transcribiendo audio... Esto puede tomar un momento',
    });

    const output = await transcriberInstance(audio, {
      language: language || undefined,
      task: 'transcribe',
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      callback_function: (beams: any) => {
        // Update progress based on output length
        const text = beams?.[0]?.output_token_ids
          ? beams[0].output_token_ids.length
          : 0;
        onProgress({
          status: 'transcribing',
          progress: Math.min(90, Math.round((text / 448) * 100)),
          message: 'Transcribiendo audio... Esto puede tomar un momento',
        });
      },
    });

    onProgress({
      status: 'complete',
      progress: 100,
      message: 'Transcripción completada',
    });

    // Parse chunks
    const chunks: TranscriptionChunk[] = [];
    
    if (output.chunks && output.chunks.length > 0) {
      for (const chunk of output.chunks) {
        if (chunk.text && chunk.text.trim()) {
          chunks.push({
            text: chunk.text.trim(),
            timestamp: chunk.timestamp as [number, number | null],
          });
        }
      }
    } else if (output.text) {
      // Fallback: single chunk with no timestamps
      chunks.push({
        text: output.text.trim(),
        timestamp: [0, null],
      });
    }

    return chunks;
  } catch (error) {
    onProgress({
      status: 'error',
      progress: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    });
    throw error;
  }
}

/**
 * Check if the model is already loaded
 */
export function isModelLoaded(): boolean {
  return transcriber !== null;
}

/**
 * Get supported languages for Whisper
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
];
