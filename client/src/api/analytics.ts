import { apiGet, apiPost } from './client';
import type { AnalyticsData, Difficulty } from '../types';

export async function getAnalytics() {
  return apiGet<AnalyticsData>('/api/analytics');
}

export async function recordSession(session: {
  songId: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  duration: number;
}) {
  return apiPost('/api/analytics/session', session);
}

export async function updateKeyAccuracy(keys: Array<{ midi: number; correct: number; total: number }>) {
  return apiPost('/api/analytics/keys', { keys });
}
