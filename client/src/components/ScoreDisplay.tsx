import React from 'react';
import type { GameScore, HitRating } from '../types';

interface ScoreDisplayProps {
  score: GameScore;
  lastRating?: HitRating | null;
  songProgress?: number; // 0-1
}

const RATING_COLORS: Record<HitRating, string> = {
  perfect: 'text-amber-400',
  great: 'text-emerald-400',
  good: 'text-cyan-400',
  miss: 'text-rose-400',
};

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, lastRating, songProgress = 0 }) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700/50 relative" data-testid="score-display">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      {/* Score */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-w-[120px]">
        <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent" data-testid="score-points">
          {score.points.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Score</div>
      </div>

      {/* Combo */}
      <div className="text-center">
        {score.combo > 0 && (
          <div
            className={`text-xl font-bold transition-all ${
              score.multiplier >= 4 ? 'text-amber-400' :
              score.multiplier >= 3 ? 'text-pink-500' :
              score.multiplier >= 2 ? 'text-cyan-400' :
              'text-slate-900 dark:text-white'
            }`}
            data-testid="combo-display"
          >
            {score.combo}x combo
            {score.multiplier > 1 && (
              <span className="text-sm ml-2 opacity-75">({score.multiplier}x)</span>
            )}
          </div>
        )}
        {lastRating && (
          <div
            className={`text-sm font-bold uppercase tracking-wider ${RATING_COLORS[lastRating]}`}
            data-testid="last-rating"
          >
            {lastRating}
          </div>
        )}
      </div>

      {/* Accuracy */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-w-[120px] text-right">
        <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent" data-testid="accuracy-display">
          {score.accuracy.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Accuracy</div>
      </div>

      </div>
      {/* Progress bar */}
      {songProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-200"
            style={{ width: `${songProgress * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round(songProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
