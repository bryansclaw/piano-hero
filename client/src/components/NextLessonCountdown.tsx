import React, { useState, useEffect, useCallback } from 'react';
import type { Lesson } from '../types';
import { Play, X, SkipForward, BookOpen } from 'lucide-react';

interface NextLessonCountdownProps {
  nextLesson: Lesson;
  countdownSeconds?: number;
  onStartLesson: (lesson: Lesson) => void;
  onCancel: () => void;
}

const NextLessonCountdown: React.FC<NextLessonCountdownProps> = ({
  nextLesson,
  countdownSeconds = 15,
  onStartLesson,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, secondsLeft]);

  // Auto-start when countdown hits 0
  useEffect(() => {
    if (secondsLeft === 0 && !isPaused) {
      onStartLesson(nextLesson);
    }
  }, [secondsLeft, isPaused, onStartLesson, nextLesson]);

  const handleSkip = useCallback(() => {
    onStartLesson(nextLesson);
  }, [onStartLesson, nextLesson]);

  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const progressPercent = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-cyan-200 dark:border-cyan-500/30 p-6 max-w-md mx-auto mt-6 relative overflow-hidden" data-testid="next-lesson-countdown">
      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
          <SkipForward size={16} />
          Up Next
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          aria-label="Cancel autoplay"
        >
          <X size={18} />
        </button>
      </div>

      {/* Lesson info */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/10">
          <BookOpen size={20} className="text-cyan-500" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white truncate">
            {nextLesson.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {nextLesson.description}
          </p>
        </div>
      </div>

      {/* Countdown + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Countdown circle */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="url(#countdown-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white">
              {secondsLeft}
            </span>
          </div>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isPaused ? 'Paused' : `Starting in ${secondsLeft}s`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePauseToggle}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500 text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
          >
            <Play size={14} />
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextLessonCountdown;
