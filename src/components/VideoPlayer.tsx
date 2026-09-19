import { useRef, useEffect, useCallback } from 'react';
import { Subtitle } from '../types';
import { formatTimeDisplay } from '../utils/subtitleUtils';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: Subtitle[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onSeek: (time: number) => void;
}

export default function VideoPlayer({
  videoUrl,
  subtitles,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onSeek,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      onDurationChange(video.duration);
    };

    const handlePlay = () => onPlayStateChange(true);
    const handlePause = () => onPlayStateChange(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onDurationChange, onPlayStateChange]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect || !videoRef.current) return;
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * videoRef.current.duration;
    onSeek(newTime);
    videoRef.current.currentTime = newTime;
  };

  const currentSubtitle = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  const progress = videoRef.current?.duration
    ? (currentTime / videoRef.current.duration) * 100
    : 0;

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-xl border-2 border-dashed border-gray-600">
        <div className="text-center text-gray-400">
          <i className="fas fa-film text-4xl mb-3 block"></i>
          <p className="text-lg">Upload a video to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />
        {/* Subtitle overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-lg max-w-3xl text-center backdrop-blur-sm">
              {currentSubtitle.text}
            </div>
          </div>
        )}
        {/* Play button overlay */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors">
              <i className="fas fa-play text-white text-3xl ml-1"></i>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div
        ref={progressRef}
        className="h-2 bg-gray-700 cursor-pointer group relative"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-indigo-500 transition-all duration-100 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        {/* Subtitle markers on timeline */}
        {subtitles.map((sub) => {
          const video = videoRef.current;
          if (!video?.duration) return null;
          const left = (sub.startTime / video.duration) * 100;
          const width = ((sub.endTime - sub.startTime) / video.duration) * 100;
          return (
            <div
              key={sub.id}
              className="absolute top-0 h-full bg-indigo-400/40 pointer-events-none"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="text-white hover:text-indigo-400 transition-colors text-lg"
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
        </button>
        <button
          onClick={() => {
            if (videoRef.current) {
              const newTime = Math.max(0, videoRef.current.currentTime - 5);
              videoRef.current.currentTime = newTime;
              onSeek(newTime);
            }
          }}
          className="text-white hover:text-indigo-400 transition-colors text-sm"
          title="Back 5 seconds"
        >
          <i className="fas fa-backward"></i>
        </button>
        <button
          onClick={() => {
            if (videoRef.current) {
              const newTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
              videoRef.current.currentTime = newTime;
              onSeek(newTime);
            }
          }}
          className="text-white hover:text-indigo-400 transition-colors text-sm"
          title="Forward 5 seconds"
        >
          <i className="fas fa-forward"></i>
        </button>
        <span className="text-gray-300 text-sm font-mono">
          {formatTimeDisplay(currentTime)} / {formatTimeDisplay(videoRef.current?.duration || 0)}
        </span>
        <div className="flex-1"></div>
        <span className="text-gray-400 text-xs">
          Click video or press Space to play/pause
        </span>
      </div>
    </div>
  );
}
