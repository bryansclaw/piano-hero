import React, { useState, useMemo } from 'react';
import type { SkillPath, Lesson, PracticePlan } from '../types';
import { getCurriculum, isLessonAvailable, getLessonProgress, generatePracticePlan, loadLessonBestAccuracies } from '../data/curriculum';
import { loadAnalytics } from '../engine/analyticsEngine';

interface CurriculumProps {
  completedLessons: Set<string>;
  onStartLesson: (lesson: Lesson) => void;
}

const PATH_COLORS: Record<SkillPath, string> = {
  fundamentals: '#e040fb',
  chords: '#40c4ff',
  sightReading: '#69f0ae',
  technique: '#ffdd00',
  songMastery: '#ff4081',
};

const Curriculum: React.FC<CurriculumProps> = ({ completedLessons, onStartLesson }) => {
  const [selectedPath, setSelectedPath] = useState<SkillPath>('fundamentals');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showPracticePlan, setShowPracticePlan] = useState(false);
  const [planDuration, setPlanDuration] = useState(30);

  const curriculum = useMemo(() => getCurriculum(), []);
  const bestAccuracies = useMemo(() => loadLessonBestAccuracies(), []);

  const currentPath = useMemo(
    () => curriculum.find(p => p.id === selectedPath)!,
    [curriculum, selectedPath],
  );

  const progress = useMemo(
    () => getLessonProgress(currentPath.lessons, completedLessons),
    [currentPath, completedLessons],
  );

  const practicePlan = useMemo((): PracticePlan | null => {
    if (!showPracticePlan) return null;
    const analytics = loadAnalytics();
    return generatePracticePlan(planDuration, analytics, curriculum, completedLessons);
  }, [showPracticePlan, planDuration, curriculum, completedLessons]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="curriculum">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📚 Curriculum</h2>
        <button
          onClick={() => setShowPracticePlan(!showPracticePlan)}
          className="px-4 py-2 bg-[#69f0ae] text-black rounded-lg text-sm font-bold"
          data-testid="practice-plan-btn"
        >
          📋 {showPracticePlan ? 'Hide' : 'Daily'} Practice Plan
        </button>
      </div>

      {/* Practice Plan */}
      {showPracticePlan && practicePlan && (
        <div className="bg-[#1a1a3e] rounded-xl p-5 border border-[#69f0ae]/30 space-y-3" data-testid="practice-plan">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#69f0ae]">📋 Daily Practice Plan</h3>
            <div className="flex gap-2">
              {[15, 30, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setPlanDuration(d)}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    planDuration === d
                      ? 'bg-[#69f0ae] text-black'
                      : 'bg-[#0a0a1a] text-[#7070a0] border border-[#2a2a5e]'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          {practicePlan.activities.map((activity, i) => (
            <div key={i} className="bg-[#0a0a1a] rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">
                {activity.type === 'lesson' ? '📖' : activity.type === 'song' ? '🎵' : '💪'}
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{activity.title}</div>
                <div className="text-xs text-[#7070a0]">{activity.description}</div>
              </div>
              <span className="text-xs text-[#b0b0d0] bg-[#1a1a3e] px-2 py-1 rounded">{activity.duration} min</span>
            </div>
          ))}
        </div>
      )}

      {/* Skill Path Tabs */}
      <div className="flex gap-2 flex-wrap" data-testid="skill-paths">
        {curriculum.map(path => {
          const pathProgress = getLessonProgress(path.lessons, completedLessons);
          return (
            <button
              key={path.id}
              onClick={() => { setSelectedPath(path.id); setSelectedLesson(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedPath === path.id
                  ? `border-[${PATH_COLORS[path.id]}]/40`
                  : 'border-[#2a2a5e]'
              }`}
              style={{
                backgroundColor: selectedPath === path.id ? `${PATH_COLORS[path.id]}20` : '#0a0a1a',
                color: selectedPath === path.id ? PATH_COLORS[path.id] : '#b0b0d0',
              }}
              data-testid={`path-${path.id}`}
            >
              {path.icon} {path.name}
              <span className="text-xs ml-1 opacity-60">({pathProgress.percent}%)</span>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-[#0a0a1a] rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress.percent}%`,
            backgroundColor: PATH_COLORS[selectedPath],
          }}
          data-testid="path-progress"
        />
      </div>
      <p className="text-xs text-[#7070a0]">{progress.completed}/{progress.total} lessons completed ({progress.percent}%)</p>

      {/* Skill Tree */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="lesson-grid">
        {currentPath.lessons.map(lesson => {
          const isCompleted = completedLessons.has(lesson.id);
          const isAvailable = isLessonAvailable(lesson, completedLessons);
          const best = bestAccuracies[lesson.id];

          return (
            <button
              key={lesson.id}
              onClick={() => isAvailable && setSelectedLesson(lesson)}
              disabled={!isAvailable}
              className={`text-left rounded-xl p-4 border transition-all ${
                isCompleted
                  ? 'bg-[#69f0ae]/10 border-[#69f0ae]/30'
                  : isAvailable
                  ? 'bg-[#1a1a3e] border-[#2a2a5e] hover:border-[#e040fb]/40 cursor-pointer'
                  : 'bg-[#0a0a1a] border-[#1a1a3e] opacity-40 cursor-not-allowed'
              }`}
              data-testid={`lesson-${lesson.id}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {isCompleted ? '✅' : isAvailable ? '📖' : '🔒'}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {lesson.order}. {lesson.title}
                  </div>
                  <div className="text-xs text-[#7070a0]">{lesson.description}</div>
                  {best !== undefined && (
                    <div className="text-xs text-[#69f0ae] mt-1">Best: {best}%</div>
                  )}
                </div>
                {isCompleted && <span className="text-[#69f0ae] text-xs font-bold">DONE</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" data-testid="lesson-detail">
          <div className="bg-[#1a1a3e] rounded-2xl p-6 max-w-lg w-full border border-[#2a2a5e] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{selectedLesson.title}</h3>
              <button onClick={() => setSelectedLesson(null)} className="text-[#7070a0] hover:text-white text-xl">✕</button>
            </div>
            <p className="text-sm text-[#b0b0d0]">{selectedLesson.explanation}</p>
            <div className="flex items-center gap-4 text-xs text-[#7070a0]">
              <span>🎵 {selectedLesson.exerciseNotes.length} notes</span>
              <span>🎯 {selectedLesson.exerciseBpm} BPM</span>
              <span>✅ Pass: {selectedLesson.passingAccuracy}%</span>
            </div>
            <button
              onClick={() => { onStartLesson(selectedLesson); setSelectedLesson(null); }}
              className="w-full py-3 bg-[#e040fb] text-white font-bold rounded-xl hover:bg-[#e040fb]/80 transition-all"
              data-testid="start-lesson-btn"
            >
              ▶ Start Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curriculum;
