import React, { useState, useMemo } from 'react';
import type { Difficulty, HighScore } from '../types';
import { SONG_CATALOG } from '../data/songCatalog';
import { Search, Clock, Music2, Star } from 'lucide-react';

interface SongLibraryProps {
  onSelectSong: (songId: string, difficulty: Difficulty) => void;
  highScores: Record<string, Record<Difficulty, HighScore>>;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: 'bg-emerald-400',
  medium: 'bg-amber-400',
  hard: 'bg-orange-500',
  expert: 'bg-rose-500',
};

const SongLibrary: React.FC<SongLibraryProps> = ({ onSelectSong, highScores }) => {
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');

  const filteredSongs = useMemo(() => {
    let songs = SONG_CATALOG;
    if (search) {
      const q = search.toLowerCase();
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q),
      );
    }
    return songs;
  }, [search]);

  const getStars = (songId: string, diff: Difficulty): number => {
    return highScores[songId]?.[diff]?.stars ?? 0;
  };

  const getBestScore = (songId: string): number | null => {
    const scores = highScores[songId];
    if (!scores) return null;
    return Math.max(...Object.values(scores).map(s => s.score).filter(s => s > 0), 0) || null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" data-testid="song-library">
      {/* Header section */}
      <div className="mb-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Song Library</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
              data-testid="song-search"
            />
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
            className="px-3 py-2.5 rounded-lg border bg-white border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-slate-300"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Song grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="song-grid">
        {filteredSongs.map((song) => {
          const bestScore = getBestScore(song.id);
          return (
            <div
              key={song.id}
              className="group bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-cyan-500/5"
              onClick={() => onSelectSong(song.id, filterDifficulty === 'all' ? 'easy' : filterDifficulty)}
              data-testid={`song-card-${song.id}`}
            >
              {/* Album art placeholder */}
              <div className="w-full aspect-square rounded-lg mb-3 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 dark:from-cyan-500/10 dark:to-pink-500/10 flex items-center justify-center">
                <Music2 size={32} className="text-cyan-500/50 dark:text-cyan-400/30" />
              </div>

              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                    {song.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {song.bpm} BPM
                </span>
                <span className="flex items-center gap-1">
                  <Music2 size={12} />
                  {song.key}
                </span>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 truncate">
                {song.album} ({song.year})
              </p>

              {/* Best score */}
              {bestScore && (
                <div className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 mb-2">
                  <Star size={12} className="fill-current" />
                  <span className="font-medium">{bestScore.toLocaleString()}</span>
                </div>
              )}

              {/* Difficulty dots */}
              <div className="flex gap-3 text-xs">
                {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => {
                  const stars = getStars(song.id, diff);
                  return (
                    <div key={diff} className="text-center">
                      <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-0.5 ${DIFF_COLORS[diff]}`} title={diff} />
                      <div className="text-slate-400 dark:text-slate-500">
                        {stars > 0 ? (
                          <span className="text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                            <Star size={10} className="fill-current" />
                            {stars}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSongs.length === 0 && (
        <div className="text-center text-slate-400 dark:text-slate-500 py-12" data-testid="no-results">
          No songs found matching &quot;{search}&quot;
        </div>
      )}
    </div>
  );
};

export default SongLibrary;
