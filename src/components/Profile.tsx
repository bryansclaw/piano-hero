import React, { useState } from 'react';
import type { PlayerProfile } from '../types';
import { AVATARS, xpProgressInLevel, ACHIEVEMENT_DEFINITIONS } from '../engine/socialEngine';

interface ProfileProps {
  profile: PlayerProfile;
  onUpdateProfile: (updates: Partial<PlayerProfile>) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onUpdateProfile }) => {
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);

  const xpProgress = xpProgressInLevel(profile.xp);
  const level = profile.level;

  const handleSaveUsername = () => {
    if (usernameInput.trim()) {
      onUpdateProfile({ username: usernameInput.trim() });
    }
    setEditingUsername(false);
  };

  const unlockedAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => profile.badges.includes(a.id));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" data-testid="profile">
      <h2 className="text-2xl font-bold text-white">👤 Profile</h2>

      {/* Avatar & Username */}
      <div className="bg-[#1a1a3e] rounded-xl p-6 border border-[#2a2a5e] flex items-center gap-6">
        <div className="text-center">
          <div className="text-6xl mb-2" data-testid="avatar-display">
            {AVATARS[profile.avatarIndex] || '🎹'}
          </div>
          <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
            {AVATARS.map((avatar, i) => (
              <button
                key={i}
                onClick={() => onUpdateProfile({ avatarIndex: i })}
                className={`text-xl p-1 rounded ${
                  profile.avatarIndex === i ? 'bg-[#e040fb]/30 ring-1 ring-[#e040fb]' : 'hover:bg-white/5'
                }`}
                data-testid={`avatar-option-${i}`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {editingUsername ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="flex-1 bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-3 py-2 text-white"
                maxLength={20}
                data-testid="username-input"
              />
              <button
                onClick={handleSaveUsername}
                className="px-3 py-2 bg-[#69f0ae] text-black rounded-lg font-bold text-sm"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-white" data-testid="username-display">{profile.username}</h3>
              <button
                onClick={() => { setEditingUsername(true); setUsernameInput(profile.username); }}
                className="text-[#7070a0] hover:text-white text-sm"
              >
                ✏️
              </button>
            </div>
          )}

          {/* Level Badge */}
          <div className="flex items-center gap-3" data-testid="level-display">
            <div className="bg-gradient-to-r from-[#e040fb] to-[#40c4ff] rounded-lg px-3 py-1">
              <span className="text-white font-black text-lg">Lv.{level}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#b0b0d0]">{xpProgress.current.toLocaleString()} XP</span>
                <span className="text-[#7070a0]">{xpProgress.needed.toLocaleString()} to next level</span>
              </div>
              <div className="w-full bg-[#0a0a1a] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#e040fb] to-[#40c4ff] transition-all"
                  style={{ width: `${xpProgress.percent}%` }}
                  data-testid="xp-bar"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-[#b0b0d0]">
            Total XP: <span className="text-white font-bold">{profile.xp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#e040fb]">{profile.songsPlayed}</div>
          <div className="text-xs text-[#7070a0] uppercase">Songs Played</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#40c4ff]">{profile.songsMastered}</div>
          <div className="text-xs text-[#7070a0] uppercase">Songs Mastered</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#ffdd00]" data-testid="streak-display">{profile.dailyStreak}</div>
          <div className="text-xs text-[#7070a0] uppercase">Day Streak</div>
          {profile.streakFreezes > 0 && (
            <div className="text-xs text-[#40c4ff] mt-1">❄️ {profile.streakFreezes} freezes</div>
          )}
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#69f0ae]">{Math.round(profile.totalPracticeTime)}</div>
          <div className="text-xs text-[#7070a0] uppercase">Minutes Practiced</div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider mb-2">🔥 Daily Streak</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black text-[#ffdd00]">{profile.dailyStreak}</div>
          <div className="text-sm text-[#b0b0d0]">
            <div>Current streak: <span className="text-white">{profile.dailyStreak} days</span></div>
            <div>Longest streak: <span className="text-white">{profile.longestStreak} days</span></div>
            <div>Joined: <span className="text-white">{new Date(profile.joinDate).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider mb-3">
          🏅 Badges ({unlockedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length})
        </h3>
        {unlockedAchievements.length === 0 ? (
          <p className="text-[#7070a0] text-sm">No badges earned yet. Keep playing!</p>
        ) : (
          <div className="flex flex-wrap gap-2" data-testid="badges-display">
            {unlockedAchievements.map(ach => (
              <div
                key={ach.id}
                className="bg-[#0a0a1a] rounded-lg px-3 py-2 flex items-center gap-2 border border-[#2a2a5e]"
                title={ach.description}
              >
                <span className="text-xl">{ach.icon}</span>
                <span className="text-xs text-white font-medium">{ach.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
