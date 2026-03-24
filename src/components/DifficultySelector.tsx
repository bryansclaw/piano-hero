import React from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_PRESETS } from '../engine/difficulty';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  lockedDifficulties?: Set<Difficulty>;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#69f0ae',
  medium: '#40c4ff',
  hard: '#e040fb',
  expert: '#ff4444',
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
        const color = DIFFICULTY_COLORS[diff];

        return (
          <button
            key={diff}
            onClick={() => !isLocked && onSelect(diff)}
            disabled={isLocked}
            role="radio"
            aria-checked={isSelected}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLocked
                ? 'opacity-40 cursor-not-allowed bg-[#1a1a3e] text-[#7070a0]'
                : isSelected
                  ? 'border-2 text-white shadow-lg'
                  : 'border border-[#2a2a5e] text-[#b0b0d0] hover:text-white hover:border-opacity-60'
            }`}
            style={
              isSelected && !isLocked
                ? { borderColor: color, backgroundColor: `${color}20`, color }
                : {}
            }
          >
            {isLocked && '🔒 '}
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultySelector;
