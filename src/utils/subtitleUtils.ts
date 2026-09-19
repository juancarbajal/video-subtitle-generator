import { Subtitle, ExportFormat } from '../types';

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function formatTimeSRT(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2].replace(',', '.'));
    return hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1].replace(',', '.'));
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || 0;
}

export function exportSubtitles(subtitles: Subtitle[], format: ExportFormat): string {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  
  if (format === 'srt') {
    return sorted.map((sub, index) => {
      return `${index + 1}\n${formatTimeSRT(sub.startTime)} --> ${formatTimeSRT(sub.endTime)}\n${sub.text}\n`;
    }).join('\n');
  } else {
    const header = 'WEBVTT\n\n';
    const content = sorted.map((sub, index) => {
      return `${index + 1}\n${formatTime(sub.startTime)} --> ${formatTime(sub.endTime)}\n${sub.text}\n`;
    }).join('\n');
    return header + content;
  }
}

export function parseSRT(content: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const blocks = content.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (timeMatch) {
        const startTime = parseTimeString(timeMatch[1]);
        const endTime = parseTimeString(timeMatch[2]);
        const text = lines.slice(2).join('\n');
        subtitles.push({
          id: crypto.randomUUID(),
          startTime,
          endTime,
          text,
        });
      }
    }
  }
  return subtitles;
}

export function parseVTT(content: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  // Remove WEBVTT header
  const contentWithoutHeader = content.replace(/^WEBVTT.*?\n\n/s, '');
  const blocks = contentWithoutHeader.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let timeLineIndex = 0;
    
    // Find the time line (contains -->)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIndex = i;
        break;
      }
    }
    
    const timeLine = lines[timeLineIndex];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (timeMatch) {
      const startTime = parseTimeString(timeMatch[1]);
      const endTime = parseTimeString(timeMatch[2]);
      const text = lines.slice(timeLineIndex + 1).join('\n');
      subtitles.push({
        id: crypto.randomUUID(),
        startTime,
        endTime,
        text,
      });
    }
  }
  return subtitles;
}

export function generateId(): string {
  return crypto.randomUUID();
}
