import React, { useState, useMemo } from 'react';
import type { LeaderboardEntry, Friend, HighScore, Difficulty } from '../types';
import { SONG_CATALOG } from '../data/songCatalog';
import { generateMockLeaderboard, getPlayerPercentile } from '../engine/socialEngine';
import { Trophy, Globe, Users, UserPlus, Star, X, Medal } from 'lucide-react';

interface LeaderboardProps {
  highScores: Record<string, Record<Difficulty, HighScore>>;
  friends: Friend[];
  playerName: string;
  onAddFriend?: (username: string) => void;
  onRemoveFriend?: (username: string) => void;
}

const RANK_STYLES: Record<number, { icon: typeof Medal; color: string }> = {
  1: { icon: Medal, color: 'text-amber-400' },
  2: { icon: Medal, color: 'text-slate-400' },
  3: { icon: Medal, color: 'text-amber-700' },
};

const Leaderboard: React.FC<LeaderboardProps> = ({
  highScores,
  friends,
  playerName,
  onAddFriend,
  onRemoveFriend,
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [selectedSongId, setSelectedSongId] = useState(SONG_CATALOG[0]?.id ?? '');
  const [friendInput, setFriendInput] = useState('');

  const playerBestEntry = useMemo(() => {
    const scores = highScores[selectedSongId];
    if (!scores) return undefined;
    let best: { score: number; accuracy: number; stars: number } | undefined;
    for (const hs of Object.values(scores)) {
      if (!best || hs.score > best.score) {
        best = { score: hs.score, accuracy: hs.accuracy, stars: hs.stars };
      }
    }
    return best;
  }, [highScores, selectedSongId]);

  const playerBestScore = playerBestEntry?.score;

  const globalLeaderboard = useMemo(() => {
    return generateMockLeaderboard(
      selectedSongId,
      playerBestScore,
      playerName,
      playerBestEntry?.accuracy,
      playerBestEntry?.stars,
    );
  }, [selectedSongId, playerBestScore, playerName, playerBestEntry]);

  const percentile = useMemo(() => getPlayerPercentile(globalLeaderboard), [globalLeaderboard]);

  const friendsLeaderboard = useMemo((): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = friends.map((f) => ({
      rank: 0,
      username: f.username,
      score: Math.floor(f.xp * 10 + Math.random() * 5000),
      accuracy: 70 + Math.random() * 30,
      stars: Math.min(5, Math.floor(f.level / 2)),
      date: new Date().toISOString(),
      isPlayer: false,
    }));

    if (playerBestScore !== undefined) {
      entries.push({
        rank: 0,
        username: playerName,
        score: playerBestScore,
        accuracy: highScores[selectedSongId] ? Object.values(highScores[selectedSongId]).reduce((best, s) => Math.max(best, s.accuracy), 0) : 0,
        stars: highScores[selectedSongId] ? Object.values(highScores[selectedSongId]).reduce((best, s) => Math.max(best, s.stars), 0) : 0,
        date: new Date().toISOString(),
        isPlayer: true,
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => { e.rank = i + 1; });
    return entries;
  }, [friends, playerBestScore, playerName, highScores, selectedSongId]);

  const currentLeaderboard = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;

  const handleAddFriend = () => {
    if (friendInput.trim() && onAddFriend) {
      onAddFriend(friendInput.trim());
      setFriendInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4" data-testid="leaderboard">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <Trophy size={24} className="text-amber-500" />
        Leaderboard
      </h2>

      {/* Song selector */}
      <select
        value={selectedSongId}
        onChange={(e) => setSelectedSongId(e.target.value)}
        className="w-full rounded-lg border px-3 py-2.5 text-sm bg-white border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        aria-label="Select song"
        data-testid="song-select"
      >
        {SONG_CATALOG.map(song => (
          <option key={song.id} value={song.id}>{song.title} — {song.artist}</option>
        ))}
      </select>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'global'
              ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
          data-testid="global-tab"
        >
          <Globe size={16} />
          Global
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'friends'
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
          }`}
          data-testid="friends-tab"
        >
          <Users size={16} />
          Friends
        </button>
      </div>

      {/* Player rank & percentile */}
      {activeTab === 'global' && playerBestScore !== undefined && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-200 dark:border-emerald-500/20 space-y-1" data-testid="percentile-display">
          {(() => {
            const playerEntry = globalLeaderboard.find(e => e.isPlayer);
            return playerEntry ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block" data-testid="player-rank">
                You are #{playerEntry.rank} — top {100 - percentile}% of players!
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block">
                You're in the top {100 - percentile}% of players on this song!
              </span>
            );
          })()}
        </div>
      )}

      {/* Friends management */}
      {activeTab === 'friends' && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add friend username..."
            value={friendInput}
            onChange={(e) => setFriendInput(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-white border-slate-200 text-slate-900 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            data-testid="friend-input"
          />
          <button
            onClick={handleAddFriend}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
            data-testid="add-friend-btn"
          >
            <UserPlus size={16} />
            Add
          </button>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="text-xs text-slate-400 dark:text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700/50">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Stars</th>
            </tr>
          </thead>
          <tbody>
            {currentLeaderboard.map((entry) => {
              const rankStyle = RANK_STYLES[entry.rank];
              return (
                <tr
                  key={`${entry.username}-${entry.rank}`}
                  className={`border-b border-slate-100 dark:border-slate-700/30 transition-colors ${
                    entry.isPlayer
                      ? 'bg-pink-50 dark:bg-pink-500/5'
                      : entry.rank % 2 === 0
                        ? 'bg-slate-50/50 dark:bg-slate-900/20'
                        : ''
                  } hover:bg-slate-100 dark:hover:bg-slate-700/30`}
                  data-testid="leaderboard-row"
                >
                  <td className="px-4 py-3">
                    {rankStyle ? (
                      <span className={`flex items-center gap-1 font-bold ${rankStyle.color}`}>
                        <Medal size={16} className="fill-current" />
                        #{entry.rank}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-medium">#{entry.rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${entry.isPlayer ? 'text-pink-600 dark:text-pink-400' : 'text-slate-900 dark:text-white'}`}>
                      {entry.username}
                      {entry.isPlayer && <span className="text-xs ml-1 text-slate-400 dark:text-slate-500">(you)</span>}
                    </span>
                    {activeTab === 'friends' && !entry.isPlayer && onRemoveFriend && (
                      <button
                        onClick={() => onRemoveFriend(entry.username)}
                        className="ml-2 text-rose-400 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-0.5 text-amber-500">
                      {Array.from({ length: Math.min(entry.stars, 5) }).map((_, i) => (
                        <Star key={i} size={14} className="fill-current" />
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
