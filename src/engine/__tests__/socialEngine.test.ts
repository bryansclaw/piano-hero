import { describe, it, expect, beforeEach } from 'vitest';
import {
  xpForLevel,
  totalXpForLevel,
  levelFromXp,
  xpProgressInLevel,
  calculateXpFromScore,
  checkAchievements,
  updateStreak,
  generateMockLeaderboard,
  getPlayerPercentile,
  generateWeeklyChallenge,
  createDefaultProfile,
  AVATARS,
} from '../socialEngine';
import type { PlayerProfile, HighScore, Difficulty } from '../../types';

describe('XP & Leveling', () => {
  it('xpForLevel returns 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('xpForLevel increases with each level', () => {
    const level5 = xpForLevel(5);
    const level10 = xpForLevel(10);
    expect(level10).toBeGreaterThan(level5);
  });

  it('totalXpForLevel accumulates correctly', () => {
    const total3 = totalXpForLevel(3);
    expect(total3).toBe(xpForLevel(2) + xpForLevel(3));
  });

  it('levelFromXp returns level 1 for 0 XP', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it('levelFromXp returns correct level for accumulated XP', () => {
    const xpForLevel3 = totalXpForLevel(3);
    expect(levelFromXp(xpForLevel3)).toBe(3);
    expect(levelFromXp(xpForLevel3 - 1)).toBe(2);
  });

  it('xpProgressInLevel shows correct progress', () => {
    const progress = xpProgressInLevel(0);
    expect(progress.current).toBe(0);
    expect(progress.needed).toBeGreaterThan(0);
    expect(progress.percent).toBe(0);
  });

  it('calculateXpFromScore returns positive XP', () => {
    const xp = calculateXpFromScore(10000, 85, 4);
    expect(xp).toBeGreaterThan(0);
  });

  it('calculateXpFromScore increases with score', () => {
    const lowXp = calculateXpFromScore(1000, 50, 1);
    const highXp = calculateXpFromScore(50000, 95, 5);
    expect(highXp).toBeGreaterThan(lowXp);
  });
});

describe('Achievements', () => {
  let profile: PlayerProfile;
  let highScores: Record<string, Record<Difficulty, HighScore>>;

  beforeEach(() => {
    profile = createDefaultProfile();
    highScores = {};
  });

  it('unlocks combo-10 achievement', () => {
    const unlocked = checkAchievements(profile, highScores, 10, 80, 3, 'easy');
    expect(unlocked).toContain('combo-10');
  });

  it('unlocks combo-50 achievement', () => {
    const unlocked = checkAchievements(profile, highScores, 50, 80, 3, 'easy');
    expect(unlocked).toContain('combo-50');
  });

  it('unlocks five-stars achievement', () => {
    const unlocked = checkAchievements(profile, highScores, 5, 90, 5, 'easy');
    expect(unlocked).toContain('five-stars');
  });

  it('unlocks accuracy-95 achievement', () => {
    const unlocked = checkAchievements(profile, highScores, 5, 95, 3, 'easy');
    expect(unlocked).toContain('accuracy-95');
  });

  it('unlocks expert-clear achievement', () => {
    const unlocked = checkAchievements(profile, highScores, 5, 80, 1, 'expert');
    expect(unlocked).toContain('expert-clear');
  });

  it('does not duplicate achievements', () => {
    profile.badges = ['combo-10'];
    const unlocked = checkAchievements(profile, highScores, 15, 80, 3, 'easy');
    expect(unlocked).not.toContain('combo-10');
  });

  it('unlocks streak achievements', () => {
    profile.dailyStreak = 7;
    const unlocked = checkAchievements(profile, highScores, 5, 80, 3, 'easy');
    expect(unlocked).toContain('streak-3');
    expect(unlocked).toContain('streak-7');
  });

  it('unlocks level achievements', () => {
    profile.xp = totalXpForLevel(5) + 1;
    const unlocked = checkAchievements(profile, highScores, 5, 80, 3, 'easy');
    expect(unlocked).toContain('level-5');
  });
});

describe('Daily Streak', () => {
  it('starts streak at 1 for first play', () => {
    const profile = createDefaultProfile();
    const updated = updateStreak(profile);
    expect(updated.dailyStreak).toBe(1);
  });

  it('increments streak for consecutive days', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const profile: PlayerProfile = {
      ...createDefaultProfile(),
      dailyStreak: 5,
      lastPlayedDate: yesterday,
    };
    const updated = updateStreak(profile);
    expect(updated.dailyStreak).toBe(6);
  });

  it('resets streak for missed days without freeze', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const profile: PlayerProfile = {
      ...createDefaultProfile(),
      dailyStreak: 5,
      lastPlayedDate: twoDaysAgo,
      streakFreezes: 0,
    };
    const updated = updateStreak(profile);
    expect(updated.dailyStreak).toBe(1);
  });

  it('uses streak freeze when available', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const profile: PlayerProfile = {
      ...createDefaultProfile(),
      dailyStreak: 5,
      lastPlayedDate: twoDaysAgo,
      streakFreezes: 2,
    };
    const updated = updateStreak(profile);
    expect(updated.dailyStreak).toBe(5);
    expect(updated.streakFreezes).toBe(1);
  });

  it('does not change streak for same day', () => {
    const today = new Date().toISOString().split('T')[0];
    const profile: PlayerProfile = {
      ...createDefaultProfile(),
      dailyStreak: 5,
      lastPlayedDate: today,
    };
    const updated = updateStreak(profile);
    expect(updated.dailyStreak).toBe(5);
  });
});

describe('Leaderboard', () => {
  it('generates 20 entries', () => {
    const leaderboard = generateMockLeaderboard('love-story');
    expect(leaderboard.length).toBe(20);
  });

  it('includes player score when provided', () => {
    const leaderboard = generateMockLeaderboard('love-story', 100000, 'TestPlayer');
    const player = leaderboard.find(e => e.isPlayer);
    expect(player).toBeDefined();
    expect(player!.username).toBe('TestPlayer');
  });

  it('entries are sorted by score descending', () => {
    const leaderboard = generateMockLeaderboard('love-story');
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i].score).toBeLessThanOrEqual(leaderboard[i - 1].score);
    }
  });

  it('ranks are sequential', () => {
    const leaderboard = generateMockLeaderboard('love-story');
    leaderboard.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
    });
  });
});

describe('getPlayerPercentile', () => {
  it('returns percentile based on rank', () => {
    const leaderboard = generateMockLeaderboard('love-story', 200000, 'TestPlayer');
    const percentile = getPlayerPercentile(leaderboard);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it('returns 50 when no player entry', () => {
    const leaderboard = generateMockLeaderboard('love-story');
    const percentile = getPlayerPercentile(leaderboard);
    expect(percentile).toBe(50);
  });
});

describe('Weekly Challenge', () => {
  it('generates a challenge with song IDs', () => {
    const challenge = generateWeeklyChallenge();
    expect(challenge.id).toBeTruthy();
    expect(challenge.title).toBeTruthy();
    expect(challenge.songIds.length).toBeGreaterThan(0);
    expect(new Date(challenge.startDate).getTime()).toBeLessThan(new Date(challenge.endDate).getTime());
  });

  it('generates deterministic challenge for same week', () => {
    const c1 = generateWeeklyChallenge();
    const c2 = generateWeeklyChallenge();
    expect(c1.id).toBe(c2.id);
    expect(c1.title).toBe(c2.title);
  });
});

describe('Avatars', () => {
  it('has 12 avatar options', () => {
    expect(AVATARS.length).toBe(12);
  });
});
