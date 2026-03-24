import React from 'react';
import type { WeeklyChallenge } from '../types';
import { ACHIEVEMENT_DEFINITIONS } from '../engine/socialEngine';
import { Medal, Unlock, Award, Lock, Music, Calendar, Trophy } from 'lucide-react';

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
      <div className="bg-gradient-to-r from-pink-500/5 to-cyan-500/5 dark:from-pink-500/10 dark:to-cyan-500/10 rounded-xl p-5 border border-pink-200 dark:border-pink-500/20" data-testid="weekly-challenge">
        <div className="flex items-center gap-2 mb-2">
          <Medal size={20} className="text-pink-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Challenge</h3>
        </div>
        <h4 className="text-pink-600 dark:text-pink-400 font-bold">{weeklyChallenge.title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{weeklyChallenge.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><Music size={12} /> {weeklyChallenge.songIds.length} songs</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> Ends {new Date(weeklyChallenge.endDate).toLocaleDateString()}</span>
          {weeklyChallenge.bestScore > 0 && (
            <span className="flex items-center gap-1 text-emerald-500">
              <Trophy size={12} />
              Best: {weeklyChallenge.bestScore.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="space-y-2" data-testid="recent-unlocks">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Unlock size={16} />
            Recently Unlocked
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentUnlocks.map(id => {
              const ach = achievements.find(a => a.id === id);
              if (!ach) return null;
              return (
                <div key={id} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  <div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">{ach.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ach.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Achievements */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Award size={16} />
          Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {achievements.map(ach => {
            const unlocked = unlockedBadges.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-lg px-3 py-2.5 flex items-center gap-3 border transition-all ${
                  unlocked
                    ? 'bg-white dark:bg-slate-800/60 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/50 opacity-50'
                }`}
                data-testid={`achievement-${ach.id}`}
              >
                {unlocked ? (
                  <Award size={24} className="text-amber-500 shrink-0" />
                ) : (
                  <Lock size={24} className="text-slate-400 dark:text-slate-600 shrink-0" />
                )}
                <div>
                  <div className={`text-sm font-bold ${unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {ach.name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{ach.description}</div>
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
