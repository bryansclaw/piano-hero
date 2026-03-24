import React from 'react';
import type { GameScore } from '../types';
import { RotateCcw, Library, Star, GraduationCap } from 'lucide-react';

interface GameOverScreenProps {
  score: GameScore;
  songTitle: string;
  onRetry: () => void;
  onBackToLibrary: () => void;
  isLesson?: boolean;
  lessonPassed?: boolean;
  onBackToCurriculum?: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  songTitle,
  onRetry,
  onBackToLibrary,
  isLesson = false,
  lessonPassed = false,
  onBackToCurriculum,
}) => {
  const stars = score.stars;

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col items-center justify-center min-h-[400px] gap-6 px-4 sm:px-6 lg:px-8 py-8" data-testid="game-over-screen">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
        {isLesson ? 'Lesson Complete!' : 'Song Complete!'}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-lg">{songTitle}</p>
      {isLesson && (
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
          lessonPassed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
        }`}>
          {lessonPassed ? '✓ Passed!' : 'Try again to pass'}
        </div>
      )}

      {/* Stars */}
      <div className="flex gap-2" data-testid="stars-display">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={36}
            className={`transition-all duration-300 ${
              i <= stars
                ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Score breakdown */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent" data-testid="final-score">
              {score.points.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Total Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{score.accuracy.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Accuracy</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{score.maxCombo}x</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Max Combo</div>
          </div>
          <div>
            <div className="flex gap-3 text-sm">
              <span className="text-amber-500">P:{score.perfect}</span>
              <span className="text-emerald-500">Gr:{score.great}</span>
              <span className="text-cyan-500">Go:{score.good}</span>
              <span className="text-rose-500">M:{score.miss}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Breakdown</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
          data-testid="retry-button"
        >
          <RotateCcw size={18} />
          Retry
        </button>
        {isLesson && onBackToCurriculum && (
          <button
            onClick={onBackToCurriculum}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg active:scale-95 transition-all"
          >
            <GraduationCap size={18} />
            Back to Curriculum
          </button>
        )}
        <button
          onClick={onBackToLibrary}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all"
        >
          <Library size={18} />
          Back to Library
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
