import React, { useState, useMemo } from 'react';
import type { Difficulty, HighScore } from '../types';
import { SONG_CATALOG } from '../data/songCatalog';

interface SongLibraryProps {
  onSelectSong: (songId: string, difficulty: Difficulty) => void;
  highScores: Record<string, Record<Difficulty, HighScore>>;
}

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

  return (
    <div className="p-6" data-testid="song-library">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Song Library</h2>
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-4 py-2 text-white placeholder-[#7070a0] focus:outline-none focus:border-[#e040fb]"
          data-testid="song-search"
        />
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
          className="bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e040fb]"
          aria-label="Filter by difficulty"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="song-grid">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] hover:border-[#e040fb]/40 transition-all cursor-pointer group"
            onClick={() => onSelectSong(song.id, filterDifficulty === 'all' ? 'easy' : filterDifficulty)}
            data-testid={`song-card-${song.id}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-white group-hover:text-[#e040fb] transition-colors">
                  {song.title}
                </h3>
                <p className="text-sm text-[#b0b0d0]">{song.artist}</p>
              </div>
              <span className="text-xs text-[#7070a0] bg-[#0a0a1a] px-2 py-1 rounded">
                {song.bpm} BPM
              </span>
            </div>

            <p className="text-xs text-[#7070a0] mb-3">
              {song.album} ({song.year}) • Key of {song.key}
            </p>

            {/* Difficulty stars */}
            <div className="flex gap-3 text-xs">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => {
                const stars = getStars(song.id, diff);
                return (
                  <div key={diff} className="text-center">
                    <div className="text-[#7070a0] capitalize">{diff[0].toUpperCase()}</div>
                    <div className="text-[#ffdd00]">
                      {'⭐'.repeat(Math.min(stars, 5))}
                      {stars === 0 && <span className="text-[#2a2a5e]">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="text-center text-[#7070a0] py-12" data-testid="no-results">
          No songs found matching "{search}"
        </div>
      )}
    </div>
  );
};

export default SongLibrary;
