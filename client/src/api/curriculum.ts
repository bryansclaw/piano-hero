import { apiGet, apiPut } from './client';

interface CurriculumProgress {
  completedLessons: string[];
  bestAccuracies: Record<string, number>;
}

export async function getCurriculumProgress() {
  return apiGet<CurriculumProgress>('/api/curriculum');
}

export async function updateLessonProgress(lessonId: string, completed: boolean, bestAccuracy: number) {
  return apiPut(`/api/curriculum/${lessonId}`, { completed, bestAccuracy });
}
