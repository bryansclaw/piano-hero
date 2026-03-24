import React from 'react';
import type { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MODES: { mode: AppMode; label: string; icon: string }[] = [
  { mode: 'library', label: 'Home', icon: '🏠' },
  { mode: 'game', label: 'Game', icon: '🎮' },
  { mode: 'practice', label: 'Practice', icon: '📖' },
  { mode: 'curriculum', label: 'Curriculum', icon: '📚' },
  { mode: 'analytics', label: 'Analytics', icon: '📊' },
  { mode: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { mode: 'profile', label: 'Profile', icon: '👤' },
  { mode: 'settings', label: 'Settings', icon: '⚙️' },
];

const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange }) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#141432] border-b border-[#2a2a5e]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎹</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#e040fb] to-[#40c4ff] bg-clip-text text-transparent">
          PianoHero
        </h1>
      </div>
      <nav className="flex gap-1 flex-wrap" role="navigation" aria-label="Main navigation">
        {MODES.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentMode === mode
                ? 'bg-[#e040fb]/20 text-[#e040fb] border border-[#e040fb]/40'
                : 'text-[#b0b0d0] hover:text-white hover:bg-white/5'
            }`}
            aria-current={currentMode === mode ? 'page' : undefined}
          >
            <span className="mr-1">{icon}</span>
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;
