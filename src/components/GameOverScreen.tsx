import React from 'react';
import type { GameScore } from '../types';

interface GameOverScreenProps {
  score: GameScore;
  songTitle: string;
  onRetry: () => void;
  onBackToLibrary: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  songTitle,
  onRetry,
  onBackToLibrary,
}) => {
  const stars = score.stars;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6" data-testid="game-over-screen">
      <h2 className="text-3xl font-bold text-white">Song Complete!</h2>
      <p className="text-[#b0b0d0] text-lg">{songTitle}</p>

      {/* Stars */}
      <div className="flex gap-2 text-4xl" data-testid="stars-display">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`transition-all duration-300 ${i <= stars ? 'scale-110' : 'opacity-30'}`}
            style={{
              filter: i <= stars ? 'drop-shadow(0 0 8px #ffdd00)' : 'none',
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Score breakdown */}
      <div className="bg-[#1a1a3e] rounded-xl p-6 w-full max-w-md border border-[#2a2a5e]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-white" data-testid="final-score">
              {score.points.toLocaleString()}
            </div>
            <div className="text-xs text-[#b0b0d0] uppercase">Total Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{score.accuracy.toFixed(1)}%</div>
            <div className="text-xs text-[#b0b0d0] uppercase">Accuracy</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">{score.maxCombo}x</div>
            <div className="text-xs text-[#b0b0d0] uppercase">Max Combo</div>
          </div>
          <div>
            <div className="flex gap-3 text-sm">
              <span className="text-[#ffdd00]">P:{score.perfect}</span>
              <span className="text-[#69f0ae]">Gr:{score.great}</span>
              <span className="text-[#40c4ff]">Go:{score.good}</span>
              <span className="text-[#ff4444]">M:{score.miss}</span>
            </div>
            <div className="text-xs text-[#b0b0d0] uppercase mt-1">Breakdown</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[#e040fb] text-white font-bold rounded-xl hover:bg-[#e040fb]/80 transition-all shadow-lg shadow-[#e040fb]/30"
          data-testid="retry-button"
        >
          🔄 Retry
        </button>
        <button
          onClick={onBackToLibrary}
          className="px-6 py-3 bg-[#1a1a3e] text-[#b0b0d0] font-bold rounded-xl border border-[#2a2a5e] hover:text-white hover:border-[#e040fb]/40 transition-all"
        >
          📚 Back to Library
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
