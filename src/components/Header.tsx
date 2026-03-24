import React from 'react';
import type { AppMode } from '../types';
import type { Theme } from '../hooks/useTheme';
import {
  House, Gamepad2, Music, GraduationCap, BarChart3,
  Trophy, User, Settings, Sun, Moon, Piano,
} from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

const NAV_MODES: { mode: AppMode; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { mode: 'library', label: 'Home', icon: House },
  { mode: 'game', label: 'Game', icon: Gamepad2 },
  { mode: 'practice', label: 'Practice', icon: Music },
  { mode: 'curriculum', label: 'Curriculum', icon: GraduationCap },
  { mode: 'analytics', label: 'Analytics', icon: BarChart3 },
  { mode: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { mode: 'profile', label: 'Profile', icon: User },
];

const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange, theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md bg-white/80 border-slate-200 dark:bg-slate-900/80 dark:border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Piano size={24} className="text-cyan-500" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              PianoHero
            </h1>
          </div>

          {/* Navigation */}
          <nav
            className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide mx-4"
            role="navigation"
            aria-label="Main navigation"
          >
            {NAV_MODES.map(({ mode, label, icon: Icon }) => {
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all whitespace-nowrap
                    ${isActive
                      ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={16} />
                  <span className="hidden md:inline">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Theme + Settings */}
          <div className="flex items-center gap-1 shrink-0">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <button
              onClick={() => onModeChange('settings')}
              className={`
                p-2 rounded-lg transition-all
                ${currentMode === 'settings'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }
              `}
              aria-current={currentMode === 'settings' ? 'page' : undefined}
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
