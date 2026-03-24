import { apiGet, apiPost } from './client';
import type { Difficulty, HighScore } from '../types';

type ScoreMap = Record<string, Record<Difficulty, HighScore>>;

export async function getScores() {
  return apiGet<ScoreMap>('/api/scores');
}

export async function saveScore(score: {
  songId: string;
  difficulty: Difficulty;
  score: number;
  stars: number;
  accuracy: number;
  maxCombo: number;
}) {
  return apiPost('/api/scores', score);
}
