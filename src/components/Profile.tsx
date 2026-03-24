import React, { useState } from 'react';
import type { PlayerProfile } from '../types';
import { AVATARS, xpProgressInLevel, ACHIEVEMENT_DEFINITIONS } from '../engine/socialEngine';
import {
  User, Pencil, Shield, Zap, Flame, Music, Award, Star,
  Snowflake, Calendar,
} from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6" data-testid="profile">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <User size={24} className="text-cyan-500" />
        Profile
      </h2>

      {/* Avatar & Username */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center">
          <div className="text-6xl mb-2" data-testid="avatar-display">
            {AVATARS[profile.avatarIndex] || AVATARS[0]}
          </div>
          <div className="flex gap-1 flex-wrap justify-center max-w-[200px]">
            {AVATARS.map((avatar, i) => (
              <button
                key={i}
                onClick={() => onUpdateProfile({ avatarIndex: i })}
                className={`text-xl p-1 rounded-md transition-all ${
                  profile.avatarIndex === i
                    ? 'bg-pink-500/10 ring-2 ring-pink-500'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
                data-testid={`avatar-option-${i}`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 w-full">
          {editingUsername ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 bg-white border-slate-200 text-slate-900 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                maxLength={20}
                data-testid="username-input"
              />
              <button
                onClick={handleSaveUsername}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="username-display">{profile.username}</h3>
              <button
                onClick={() => { setEditingUsername(true); setUsernameInput(profile.username); }}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <Pencil size={16} />
              </button>
            </div>
          )}

          {/* Level Badge */}
          <div className="flex items-center gap-3" data-testid="level-display">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg px-3 py-1.5">
              <Shield size={16} className="text-white" />
              <span className="text-white font-black text-lg">Lv.{level}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Zap size={10} />
                  {xpProgress.current.toLocaleString()} XP
                </span>
                <span className="text-slate-400 dark:text-slate-500">{xpProgress.needed.toLocaleString()} to next level</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900/60 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all"
                  style={{ width: `${xpProgress.percent}%` }}
                  data-testid="xp-bar"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Zap size={14} className="text-cyan-500" />
            Total XP: <span className="text-slate-900 dark:text-white font-bold">{profile.xp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <Music size={20} className="mx-auto mb-1.5 text-pink-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.songsPlayed}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Songs Played</div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <Star size={20} className="mx-auto mb-1.5 text-cyan-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.songsMastered}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Songs Mastered</div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <Flame size={20} className="mx-auto mb-1.5 text-amber-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="streak-display">{profile.dailyStreak}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Day Streak</div>
          {profile.streakFreezes > 0 && (
            <div className="flex items-center justify-center gap-1 text-xs text-cyan-500 mt-1">
              <Snowflake size={10} />
              {profile.streakFreezes} freezes
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <Calendar size={20} className="mx-auto mb-1.5 text-emerald-500" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(profile.totalPracticeTime)}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase">Minutes Practiced</div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          <Flame size={16} className="text-amber-500" />
          Daily Streak
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{profile.dailyStreak}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-0.5">
            <div>Current streak: <span className="text-slate-900 dark:text-white font-medium">{profile.dailyStreak} days</span></div>
            <div>Longest streak: <span className="text-slate-900 dark:text-white font-medium">{profile.longestStreak} days</span></div>
            <div>Joined: <span className="text-slate-900 dark:text-white font-medium">{new Date(profile.joinDate).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          <Award size={16} className="text-amber-500" />
          Badges ({unlockedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length})
        </h3>
        {unlockedAchievements.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">No badges earned yet. Keep playing!</p>
        ) : (
          <div className="flex flex-wrap gap-2" data-testid="badges-display">
            {unlockedAchievements.map(ach => (
              <div
                key={ach.id}
                className="bg-slate-50 dark:bg-slate-900/60 rounded-lg px-3 py-2 flex items-center gap-2 border border-slate-200 dark:border-slate-700/50"
                title={ach.description}
              >
                <Award size={18} className="text-amber-500" />
                <span className="text-xs text-slate-900 dark:text-white font-medium">{ach.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
