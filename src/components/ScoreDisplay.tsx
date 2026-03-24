import React from 'react';
import type { GameScore, HitRating } from '../types';

interface ScoreDisplayProps {
  score: GameScore;
  lastRating?: HitRating | null;
  songProgress?: number; // 0-1
}

const RATING_COLORS: Record<HitRating, string> = {
  perfect: '#ffdd00',
  great: '#69f0ae',
  good: '#40c4ff',
  miss: '#ff4444',
};

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, lastRating, songProgress = 0 }) => {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[#141432]/80 backdrop-blur" data-testid="score-display">
      {/* Score */}
      <div className="text-left">
        <div className="text-2xl font-bold text-white" data-testid="score-points">
          {score.points.toLocaleString()}
        </div>
        <div className="text-xs text-[#b0b0d0]">SCORE</div>
      </div>

      {/* Combo */}
      <div className="text-center">
        {score.combo > 0 && (
          <div
            className="text-xl font-bold transition-all"
            style={{
              color: score.multiplier >= 4 ? '#ffdd00' : score.multiplier >= 3 ? '#e040fb' : score.multiplier >= 2 ? '#40c4ff' : '#ffffff',
              textShadow: score.combo > 25 ? `0 0 20px ${score.multiplier >= 4 ? '#ffdd00' : '#e040fb'}` : 'none',
            }}
            data-testid="combo-display"
          >
            {score.combo}x combo
            {score.multiplier > 1 && (
              <span className="text-sm ml-2">({score.multiplier}x)</span>
            )}
          </div>
        )}
        {lastRating && (
          <div
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: RATING_COLORS[lastRating] }}
            data-testid="last-rating"
          >
            {lastRating}
          </div>
        )}
      </div>

      {/* Accuracy */}
      <div className="text-right">
        <div className="text-2xl font-bold text-white" data-testid="accuracy-display">
          {score.accuracy.toFixed(1)}%
        </div>
        <div className="text-xs text-[#b0b0d0]">ACCURACY</div>
      </div>

      {/* Progress bar */}
      {songProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0a0a1a]">
          <div
            className="h-full bg-gradient-to-r from-[#e040fb] to-[#40c4ff] transition-all duration-200"
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
