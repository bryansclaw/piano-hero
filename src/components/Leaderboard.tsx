import React, { useState, useMemo } from 'react';
import type { LeaderboardEntry, Friend, HighScore, Difficulty } from '../types';
import { SONG_CATALOG } from '../data/songCatalog';
import { generateMockLeaderboard, getPlayerPercentile } from '../engine/socialEngine';

interface LeaderboardProps {
  highScores: Record<string, Record<Difficulty, HighScore>>;
  friends: Friend[];
  playerName: string;
  onAddFriend?: (username: string) => void;
  onRemoveFriend?: (username: string) => void;
}

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

  const playerBestScore = useMemo(() => {
    const scores = highScores[selectedSongId];
    if (!scores) return undefined;
    return Math.max(...Object.values(scores).map(s => s.score));
  }, [highScores, selectedSongId]);

  const globalLeaderboard = useMemo(() => {
    return generateMockLeaderboard(selectedSongId, playerBestScore, playerName);
  }, [selectedSongId, playerBestScore, playerName]);

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
    <div className="p-6 max-w-3xl mx-auto space-y-4" data-testid="leaderboard">
      <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>

      {/* Song selector */}
      <select
        value={selectedSongId}
        onChange={(e) => setSelectedSongId(e.target.value)}
        className="bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-3 py-2 text-white text-sm w-full"
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'global'
              ? 'bg-[#e040fb]/20 text-[#e040fb] border border-[#e040fb]/40'
              : 'text-[#b0b0d0] hover:text-white bg-[#0a0a1a]'
          }`}
          data-testid="global-tab"
        >
          🌍 Global
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-[#40c4ff]/20 text-[#40c4ff] border border-[#40c4ff]/40'
              : 'text-[#b0b0d0] hover:text-white bg-[#0a0a1a]'
          }`}
          data-testid="friends-tab"
        >
          👥 Friends
        </button>
      </div>

      {/* Percentile */}
      {activeTab === 'global' && playerBestScore !== undefined && (
        <div className="bg-[#0a0a1a] rounded-lg p-3 text-center" data-testid="percentile-display">
          <span className="text-[#69f0ae] font-bold">You're in the top {100 - percentile}% of players on this song!</span>
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
            className="flex-1 bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-3 py-2 text-white text-sm"
            data-testid="friend-input"
          />
          <button
            onClick={handleAddFriend}
            className="px-4 py-2 bg-[#40c4ff] text-white rounded-lg text-sm font-bold"
            data-testid="add-friend-btn"
          >
            Add
          </button>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="bg-[#1a1a3e] rounded-xl border border-[#2a2a5e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-[#7070a0] uppercase border-b border-[#2a2a5e]">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Stars</th>
            </tr>
          </thead>
          <tbody>
            {currentLeaderboard.map((entry) => (
              <tr
                key={`${entry.username}-${entry.rank}`}
                className={`border-b border-[#2a2a5e]/50 transition-colors ${
                  entry.isPlayer ? 'bg-[#e040fb]/10' : 'hover:bg-[#0a0a1a]/50'
                }`}
                data-testid="leaderboard-row"
              >
                <td className="px-4 py-3">
                  <span className={`font-bold ${
                    entry.rank === 1 ? 'text-[#ffdd00]' :
                    entry.rank === 2 ? 'text-[#c0c0c0]' :
                    entry.rank === 3 ? 'text-[#cd7f32]' : 'text-[#7070a0]'
                  }`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${entry.isPlayer ? 'text-[#e040fb]' : 'text-white'}`}>
                    {entry.username}
                    {entry.isPlayer && <span className="text-xs ml-1 text-[#7070a0]">(you)</span>}
                  </span>
                  {activeTab === 'friends' && !entry.isPlayer && onRemoveFriend && (
                    <button
                      onClick={() => onRemoveFriend(entry.username)}
                      className="ml-2 text-xs text-[#ff4444] hover:text-[#ff6666]"
                    >
                      ✕
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-white font-mono">
                  {entry.score.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-[#ffdd00]">
                  {'⭐'.repeat(Math.min(entry.stars, 5))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
