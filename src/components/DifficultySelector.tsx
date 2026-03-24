import React from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_PRESETS } from '../engine/difficulty';
import { Lock } from 'lucide-react';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  lockedDifficulties?: Set<Difficulty>;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

const DIFFICULTY_STYLES: Record<Difficulty, { dot: string; active: string; activeBorder: string }> = {
  easy: { dot: 'bg-emerald-400', active: 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400', activeBorder: 'border-emerald-500' },
  medium: { dot: 'bg-cyan-400', active: 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400', activeBorder: 'border-cyan-500' },
  hard: { dot: 'bg-pink-500', active: 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400', activeBorder: 'border-pink-500' },
  expert: { dot: 'bg-rose-500', active: 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400', activeBorder: 'border-rose-500' },
};

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selected,
  onSelect,
  lockedDifficulties = new Set(),
}) => {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Difficulty selection" data-testid="difficulty-selector">
      {DIFFICULTY_ORDER.map((diff) => {
        const preset = DIFFICULTY_PRESETS[diff];
        const isLocked = lockedDifficulties.has(diff);
        const isSelected = selected === diff;
        const styles = DIFFICULTY_STYLES[diff];

        return (
          <button
            key={diff}
            onClick={() => !isLocked && onSelect(diff)}
            disabled={isLocked}
            role="radio"
            aria-checked={isSelected}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isLocked
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700'
                : isSelected
                  ? `border-2 shadow-sm ${styles.active}`
                  : 'border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
          >
            {isLocked ? (
              <Lock size={14} />
            ) : (
              <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
            )}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultySelector;
