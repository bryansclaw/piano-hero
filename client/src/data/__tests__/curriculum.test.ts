import { describe, it, expect } from 'vitest';
import {
  getCurriculum,
  isLessonAvailable,
  checkPrerequisites,
  getLessonProgress,
  generatePracticePlan,
  loadCompletedLessons,
} from '../curriculum';
import type { AnalyticsData } from '../../types';

describe('getCurriculum', () => {
  it('returns 5 skill paths', () => {
    const curriculum = getCurriculum();
    expect(curriculum.length).toBe(5);
  });

  it('each path has at least 10 lessons', () => {
    const curriculum = getCurriculum();
    for (const path of curriculum) {
      expect(path.lessons.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('each lesson has required fields', () => {
    const curriculum = getCurriculum();
    for (const path of curriculum) {
      for (const lesson of path.lessons) {
        expect(lesson.id).toBeTruthy();
        expect(lesson.title).toBeTruthy();
        expect(lesson.description).toBeTruthy();
        expect(lesson.explanation).toBeTruthy();
        expect(lesson.exerciseNotes.length).toBeGreaterThan(0);
        expect(lesson.exerciseBpm).toBeGreaterThan(0);
        expect(lesson.passingAccuracy).toBeGreaterThan(0);
        expect(lesson.passingAccuracy).toBeLessThanOrEqual(100);
      }
    }
  });

  it('path IDs match expected values', () => {
    const curriculum = getCurriculum();
    const pathIds = curriculum.map(p => p.id);
    expect(pathIds).toContain('fundamentals');
    expect(pathIds).toContain('chords');
    expect(pathIds).toContain('sightReading');
    expect(pathIds).toContain('technique');
    expect(pathIds).toContain('songMastery');
  });

  it('each path has icon and description', () => {
    const curriculum = getCurriculum();
    for (const path of curriculum) {
      expect(path.icon).toBeTruthy();
      expect(path.description).toBeTruthy();
      expect(path.name).toBeTruthy();
    }
  });
});

describe('isLessonAvailable', () => {
  it('first lesson is always available', () => {
    const curriculum = getCurriculum();
    const firstLesson = curriculum[0].lessons[0];
    expect(isLessonAvailable(firstLesson, new Set())).toBe(true);
  });

  it('second lesson requires first to be completed', () => {
    const curriculum = getCurriculum();
    const secondLesson = curriculum[0].lessons[1];
    expect(isLessonAvailable(secondLesson, new Set())).toBe(false);
    expect(isLessonAvailable(secondLesson, new Set([curriculum[0].lessons[0].id]))).toBe(true);
  });

  it('lesson with no prerequisites is available', () => {
    const curriculum = getCurriculum();
    const chordsFirst = curriculum[1].lessons[0]; // chords path first lesson
    expect(isLessonAvailable(chordsFirst, new Set())).toBe(true);
  });
});

describe('checkPrerequisites', () => {
  it('returns true for first lesson', () => {
    const curriculum = getCurriculum();
    const allLessons = curriculum.flatMap(p => p.lessons);
    expect(checkPrerequisites(allLessons[0].id, allLessons, new Set())).toBe(true);
  });

  it('returns false for non-existent lesson', () => {
    const curriculum = getCurriculum();
    const allLessons = curriculum.flatMap(p => p.lessons);
    expect(checkPrerequisites('non-existent', allLessons, new Set())).toBe(false);
  });
});

describe('getLessonProgress', () => {
  it('returns 0% for no completions', () => {
    const curriculum = getCurriculum();
    const progress = getLessonProgress(curriculum[0].lessons, new Set());
    expect(progress.completed).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.total).toBeGreaterThan(0);
  });

  it('returns 100% when all completed', () => {
    const curriculum = getCurriculum();
    const allIds = new Set(curriculum[0].lessons.map(l => l.id));
    const progress = getLessonProgress(curriculum[0].lessons, allIds);
    expect(progress.percent).toBe(100);
    expect(progress.completed).toBe(progress.total);
  });

  it('calculates partial progress', () => {
    const curriculum = getCurriculum();
    const completed = new Set([curriculum[0].lessons[0].id]);
    const progress = getLessonProgress(curriculum[0].lessons, completed);
    expect(progress.completed).toBe(1);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThan(100);
  });
});

describe('generatePracticePlan', () => {
  const emptyAnalytics: AnalyticsData = {
    dailyPractice: [],
    keyAccuracy: [],
    sessionHistory: [],
    songAccuracyTrends: {},
  };

  it('generates plan for 15 minutes', () => {
    const curriculum = getCurriculum();
    const plan = generatePracticePlan(15, emptyAnalytics, curriculum, new Set());
    expect(plan.duration).toBe(15);
    expect(plan.activities.length).toBeGreaterThan(0);
    const totalTime = plan.activities.reduce((sum, a) => sum + a.duration, 0);
    expect(totalTime).toBeLessThanOrEqual(15);
  });

  it('generates plan for 30 minutes', () => {
    const curriculum = getCurriculum();
    const plan = generatePracticePlan(30, emptyAnalytics, curriculum, new Set());
    expect(plan.duration).toBe(30);
    expect(plan.activities.length).toBeGreaterThanOrEqual(2);
  });

  it('generates plan for 60 minutes', () => {
    const curriculum = getCurriculum();
    const plan = generatePracticePlan(60, emptyAnalytics, curriculum, new Set());
    expect(plan.duration).toBe(60);
    expect(plan.activities.length).toBeGreaterThanOrEqual(3);
  });

  it('includes warmup', () => {
    const curriculum = getCurriculum();
    const plan = generatePracticePlan(30, emptyAnalytics, curriculum, new Set());
    expect(plan.activities.some(a => a.title.toLowerCase().includes('warm'))).toBe(true);
  });

  it('includes weakness training when weak keys exist', () => {
    const analyticsWithWeakKeys: AnalyticsData = {
      ...emptyAnalytics,
      keyAccuracy: [
        { midi: 60, totalHits: 20, correctHits: 10, accuracy: 50 },
      ],
    };
    const curriculum = getCurriculum();
    const plan = generatePracticePlan(30, analyticsWithWeakKeys, curriculum, new Set());
    expect(plan.activities.some(a => a.title.toLowerCase().includes('weak'))).toBe(true);
  });
});

describe('loadCompletedLessons', () => {
  it('returns empty set when nothing stored', () => {
    const completed = loadCompletedLessons();
    expect(completed.size).toBe(0);
  });
});
