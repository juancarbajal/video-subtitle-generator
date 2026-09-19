export interface Subtitle {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export type ExportFormat = 'srt' | 'vtt';

export interface AppState {
  videoFile: File | null;
  videoUrl: string;
  subtitles: Subtitle[];
  currentTime: number;
  duration: number;
  selectedSubtitleId: string | null;
  isPlaying: boolean;
}
