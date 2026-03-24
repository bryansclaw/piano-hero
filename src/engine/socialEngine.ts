import type {
  PlayerProfile, Achievement, LeaderboardEntry,
  WeeklyChallenge, Friend, HighScore, Difficulty,
} from '../types';
import { SONG_CATALOG } from '../data/songCatalog';

// ===== XP & Leveling =====
const BASE_XP_PER_LEVEL = 500;
const XP_GROWTH_FACTOR = 1.2;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level - 2));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    const nextLevelXp = xpForLevel(level + 1);
    if (xpNeeded + nextLevelXp > xp) break;
    xpNeeded += nextLevelXp;
    level++;
  }
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  const xpAtCurrentLevel = totalXpForLevel(level);
  const xpForNext = xpForLevel(level + 1);
  const current = xp - xpAtCurrentLevel;
  return {
    current,
    needed: xpForNext,
    percent: xpForNext > 0 ? Math.round((current / xpForNext) * 100) : 0,
  };
}

export function calculateXpFromScore(score: number, accuracy: number, stars: number): number {
  const baseXp = Math.floor(score / 10);
  const accuracyBonus = Math.floor(accuracy / 5);
  const starBonus = stars * 20;
  return baseXp + accuracyBonus + starBonus;
}

// ===== Achievements =====
export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: 'first-perfect', name: 'First Perfect', description: 'Get a Perfect rating on any note', icon: '🎯', unlocked: false, category: 'performance' },
  { id: 'combo-10', name: 'Getting Started', description: 'Reach a 10x combo', icon: '🔥', unlocked: false, category: 'performance' },
  { id: 'combo-50', name: 'Combo Master', description: 'Reach a 50x combo', icon: '💥', unlocked: false, category: 'performance' },
  { id: 'combo-100', name: 'Combo Legend', description: 'Reach a 100x combo', icon: '⚡', unlocked: false, category: 'performance' },
  { id: 'five-stars', name: 'Five Star Performance', description: 'Get 5 stars on any song', icon: '⭐', unlocked: false, category: 'performance' },
  { id: 'accuracy-95', name: 'Precision Player', description: 'Achieve 95%+ accuracy on any song', icon: '🎯', unlocked: false, category: 'performance' },
  { id: 'accuracy-100', name: 'Flawless', description: 'Achieve 100% accuracy on any song', icon: '💎', unlocked: false, category: 'performance' },
  { id: 'streak-3', name: '3 Day Streak', description: 'Play for 3 consecutive days', icon: '📅', unlocked: false, category: 'dedication' },
  { id: 'streak-7', name: 'Weekly Warrior', description: 'Play for 7 consecutive days', icon: '🗓️', unlocked: false, category: 'dedication' },
  { id: 'streak-30', name: 'Monthly Master', description: 'Play for 30 consecutive days', icon: '📆', unlocked: false, category: 'dedication' },
  { id: 'songs-5', name: 'Song Explorer', description: 'Play 5 different songs', icon: '🎵', unlocked: false, category: 'mastery' },
  { id: 'songs-10', name: '10 Song Streak', description: 'Play 10 different songs', icon: '🎶', unlocked: false, category: 'mastery' },
  { id: 'songs-all', name: 'Complete Collection', description: 'Play every song in the library', icon: '📚', unlocked: false, category: 'mastery' },
  { id: 'expert-clear', name: 'Speed Demon', description: 'Clear any song on Expert difficulty', icon: '🏎️', unlocked: false, category: 'mastery' },
  { id: 'taylor-superfan', name: 'Taylor Swift Superfan', description: 'Get 5 stars on all Taylor Swift songs', icon: '💜', unlocked: false, category: 'mastery' },
  { id: 'level-5', name: 'Rising Star', description: 'Reach level 5', icon: '⬆️', unlocked: false, category: 'dedication' },
  { id: 'level-10', name: 'Virtuoso', description: 'Reach level 10', icon: '🌟', unlocked: false, category: 'dedication' },
  { id: 'level-20', name: 'Grand Master', description: 'Reach level 20', icon: '👑', unlocked: false, category: 'dedication' },
  { id: 'practice-1hr', name: 'Dedicated Learner', description: 'Practice for a total of 1 hour', icon: '⏱️', unlocked: false, category: 'dedication' },
  { id: 'practice-10hr', name: 'Practice Makes Perfect', description: 'Practice for a total of 10 hours', icon: '🏆', unlocked: false, category: 'dedication' },
];

export function checkAchievements(
  profile: PlayerProfile,
  highScores: Record<string, Record<Difficulty, HighScore>>,
  lastGameMaxCombo: number,
  lastGameAccuracy: number,
  lastGameStars: number,
  lastGameDifficulty: Difficulty,
): string[] {
  const newlyUnlocked: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && !profile.badges.includes(id)) {
      profile.badges.push(id);
      newlyUnlocked.push(id);
    }
  };

  check('first-perfect', lastGameAccuracy > 0);
  check('combo-10', lastGameMaxCombo >= 10);
  check('combo-50', lastGameMaxCombo >= 50);
  check('combo-100', lastGameMaxCombo >= 100);
  check('five-stars', lastGameStars >= 5);
  check('accuracy-95', lastGameAccuracy >= 95);
  check('accuracy-100', lastGameAccuracy >= 99.99);

  check('streak-3', profile.dailyStreak >= 3);
  check('streak-7', profile.dailyStreak >= 7);
  check('streak-30', profile.dailyStreak >= 30);

  const songsPlayed = new Set(Object.keys(highScores));
  check('songs-5', songsPlayed.size >= 5);
  check('songs-10', songsPlayed.size >= 10);
  check('songs-all', songsPlayed.size >= SONG_CATALOG.length);

  check('expert-clear', lastGameDifficulty === 'expert' && lastGameStars >= 1);

  // Taylor Swift superfan
  const taylorSongs = SONG_CATALOG.filter(s => s.artist === 'Taylor Swift');
  const allTaylor5Star = taylorSongs.every(s => {
    const scores = highScores[s.id];
    return scores && Object.values(scores).some(hs => hs.stars >= 5);
  });
  check('taylor-superfan', allTaylor5Star);

  const level = levelFromXp(profile.xp);
  check('level-5', level >= 5);
  check('level-10', level >= 10);
  check('level-20', level >= 20);

  check('practice-1hr', profile.totalPracticeTime >= 60);
  check('practice-10hr', profile.totalPracticeTime >= 600);

  return newlyUnlocked;
}

// ===== Daily Streak =====
export function updateStreak(profile: PlayerProfile): PlayerProfile {
  const today = new Date().toISOString().split('T')[0];
  const lastPlayed = profile.lastPlayedDate;

  if (lastPlayed === today) return profile;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (lastPlayed === yesterday) {
    return {
      ...profile,
      dailyStreak: profile.dailyStreak + 1,
      longestStreak: Math.max(profile.longestStreak, profile.dailyStreak + 1),
      lastPlayedDate: today,
    };
  } else if (lastPlayed && lastPlayed !== today) {
    // Streak broken — check for freeze
    if (profile.streakFreezes > 0) {
      return {
        ...profile,
        streakFreezes: profile.streakFreezes - 1,
        lastPlayedDate: today,
      };
    }
    return {
      ...profile,
      dailyStreak: 1,
      lastPlayedDate: today,
    };
  }

  return {
    ...profile,
    dailyStreak: 1,
    lastPlayedDate: today,
  };
}

// ===== Mock Leaderboard =====
const MOCK_USERNAMES = [
  'PianoWizard88', 'KeyboardKing', 'MelodyMaster', 'ChordCrusher',
  'NoteNinja', 'ScaleSlayer', 'HarmonyHero', 'RhythmRider',
  'TempoTitan', 'ArpeggioAce', 'OctaveOG', 'FortissimoFan',
  'SonataStar', 'ConcertoChamp', 'EtudeExpert', 'PreludePlayer',
  'TrillThrill', 'StaccatoStorm', 'CrescendoKid', 'VirtuosoVixen',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function generateMockLeaderboard(songId: string, playerScore?: number, playerName = 'You'): LeaderboardEntry[] {
  const rand = seededRandom(hashString(songId));
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < 20; i++) {
    const score = Math.floor(50000 + rand() * 150000);
    const accuracy = 60 + rand() * 40;
    const stars = Math.min(5, Math.floor(accuracy / 20));
    entries.push({
      rank: 0,
      username: MOCK_USERNAMES[i % MOCK_USERNAMES.length],
      score,
      accuracy: Math.round(accuracy * 10) / 10,
      stars,
      date: new Date(Date.now() - Math.floor(rand() * 30 * 86400000)).toISOString(),
      isPlayer: false,
    });
  }

  if (playerScore !== undefined) {
    entries.push({
      rank: 0,
      username: playerName,
      score: playerScore,
      accuracy: 0,
      stars: 0,
      date: new Date().toISOString(),
      isPlayer: true,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries.slice(0, 20);
}

export function getPlayerPercentile(leaderboard: LeaderboardEntry[]): number {
  const playerEntry = leaderboard.find(e => e.isPlayer);
  if (!playerEntry) return 50;
  const rank = playerEntry.rank;
  const total = leaderboard.length;
  return Math.round(((total - rank + 1) / total) * 100);
}

// ===== Weekly Challenge =====
export function generateWeeklyChallenge(): WeeklyChallenge {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekSeed = Math.floor(weekStart.getTime() / (7 * 86400000));
  const rand = seededRandom(weekSeed);

  const themes = [
    { title: 'Taylor Swift Marathon', desc: 'Get the highest combined score on all Taylor Swift songs!', filter: () => true },
    { title: 'Album Deep Dive: 1989', desc: 'Master every track from 1989!', filter: (s: { album: string }) => s.album === '1989' },
    { title: 'Slow & Steady', desc: 'Highest accuracy on songs under 100 BPM!', filter: (s: { bpm: number }) => s.bpm < 100 },
    { title: 'Speed Challenge', desc: 'Conquer the fastest songs!', filter: (s: { bpm: number }) => s.bpm >= 130 },
    { title: 'Album Deep Dive: Red', desc: 'Show your Red era!', filter: (s: { album: string }) => s.album === 'Red' },
  ];

  const theme = themes[Math.floor(rand() * themes.length)];
  const matchingSongs = SONG_CATALOG.filter(theme.filter);
  const songIds = matchingSongs.map(s => s.id);

  return {
    id: `week-${weekSeed}`,
    title: theme.title,
    description: theme.desc,
    songIds,
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    bestScore: 0,
  };
}

// ===== Profile persistence =====
const PROFILE_KEY = 'piano-hero-profile';
const FRIENDS_KEY = 'piano-hero-friends';

export function createDefaultProfile(): PlayerProfile {
  return {
    username: 'Player',
    avatarIndex: 0,
    xp: 0,
    level: 1,
    badges: [],
    songsPlayed: 0,
    songsMastered: 0,
    totalPracticeTime: 0,
    joinDate: new Date().toISOString(),
    dailyStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    streakFreezes: 3,
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return createDefaultProfile();
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('[PianoHero] Failed to save profile:', e);
  }
}

export function loadFriends(): Friend[] {
  try {
    const data = localStorage.getItem(FRIENDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {
    console.error('[PianoHero] Failed to save friends:', e);
  }
}

// ===== Avatar =====
export const AVATARS = ['🎹', '🎵', '🎶', '🎤', '🎸', '🎺', '🎻', '🥁', '🎷', '🪗', '🪕', '🎼'];
