import React from 'react';
import type { WeeklyChallenge } from '../types';
import { ACHIEVEMENT_DEFINITIONS } from '../engine/socialEngine';

interface SocialFeedProps {
  weeklyChallenge: WeeklyChallenge;
  unlockedBadges: string[];
  recentUnlocks: string[];
}

const SocialFeed: React.FC<SocialFeedProps> = ({
  weeklyChallenge,
  unlockedBadges,
  recentUnlocks,
}) => {
  const achievements = ACHIEVEMENT_DEFINITIONS;

  return (
    <div className="space-y-6" data-testid="social-feed">
      {/* Weekly Challenge */}
      <div className="bg-gradient-to-r from-[#e040fb]/20 to-[#40c4ff]/20 rounded-xl p-5 border border-[#e040fb]/30" data-testid="weekly-challenge">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🏅</span>
          <h3 className="text-lg font-bold text-white">Weekly Challenge</h3>
        </div>
        <h4 className="text-[#e040fb] font-bold">{weeklyChallenge.title}</h4>
        <p className="text-sm text-[#b0b0d0] mt-1">{weeklyChallenge.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-[#7070a0]">
          <span>🎵 {weeklyChallenge.songIds.length} songs</span>
          <span>📅 Ends {new Date(weeklyChallenge.endDate).toLocaleDateString()}</span>
          {weeklyChallenge.bestScore > 0 && (
            <span className="text-[#69f0ae]">🏆 Best: {weeklyChallenge.bestScore.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="space-y-2" data-testid="recent-unlocks">
          <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">🔓 Recently Unlocked</h3>
          <div className="flex flex-wrap gap-2">
            {recentUnlocks.map(id => {
              const ach = achievements.find(a => a.id === id);
              if (!ach) return null;
              return (
                <div key={id} className="bg-[#ffdd00]/10 border border-[#ffdd00]/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span>{ach.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-[#ffdd00]">{ach.name}</div>
                    <div className="text-xs text-[#b0b0d0]">{ach.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Achievements */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">🏅 Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {achievements.map(ach => {
            const unlocked = unlockedBadges.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-lg px-3 py-2 flex items-center gap-3 border transition-all ${
                  unlocked
                    ? 'bg-[#1a1a3e] border-[#69f0ae]/30'
                    : 'bg-[#0a0a1a] border-[#2a2a5e] opacity-50'
                }`}
                data-testid={`achievement-${ach.id}`}
              >
                <span className="text-2xl">{unlocked ? ach.icon : '🔒'}</span>
                <div>
                  <div className={`text-sm font-bold ${unlocked ? 'text-white' : 'text-[#7070a0]'}`}>
                    {ach.name}
                  </div>
                  <div className="text-xs text-[#7070a0]">{ach.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;
