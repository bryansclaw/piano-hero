import React, { useState, useMemo } from 'react';
import type { SkillPath, Lesson, PracticePlan } from '../types';
import { getCurriculum, isLessonAvailable, getLessonProgress, generatePracticePlan, loadLessonBestAccuracies } from '../data/curriculum';
import { loadAnalytics } from '../engine/analyticsEngine';
import {
  GraduationCap, ClipboardList, X, Lock, CheckCircle2, BookOpen,
  Play, Music, Eye, Hand, Star, Dumbbell, Target,
} from 'lucide-react';

interface CurriculumProps {
  completedLessons: Set<string>;
  onStartLesson: (lesson: Lesson) => void;
}

const PATH_ICONS: Record<SkillPath, React.FC<{ size?: number; className?: string }>> = {
  fundamentals: Music,
  chords: Target,
  sightReading: Eye,
  technique: Hand,
  songMastery: Star,
};

const PATH_COLORS: Record<SkillPath, { bg: string; text: string; border: string; fill: string }> = {
  fundamentals: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30', fill: 'bg-pink-500' },
  chords: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', fill: 'bg-cyan-500' },
  sightReading: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', fill: 'bg-emerald-500' },
  technique: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', fill: 'bg-amber-500' },
  songMastery: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', fill: 'bg-rose-500' },
};

const ACTIVITY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  lesson: BookOpen,
  song: Music,
  technique: Dumbbell,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6" data-testid="curriculum">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <GraduationCap size={24} className="text-cyan-500" />
          Curriculum
        </h2>
        <button
          onClick={() => setShowPracticePlan(!showPracticePlan)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
          data-testid="practice-plan-btn"
        >
          <ClipboardList size={16} />
          {showPracticePlan ? 'Hide' : 'Daily'} Practice Plan
        </button>
      </div>

      {/* Practice Plan */}
      {showPracticePlan && practicePlan && (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-emerald-200 dark:border-emerald-500/30 space-y-3" data-testid="practice-plan">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <ClipboardList size={20} />
              Daily Practice Plan
            </h3>
            <div className="flex gap-2">
              {[15, 30, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setPlanDuration(d)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    planDuration === d
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
          {practicePlan.activities.map((activity, i) => {
            const ActivityIcon = ACTIVITY_ICONS[activity.type] || BookOpen;
            return (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ActivityIcon size={20} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{activity.title}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{activity.description}</div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/50">{activity.duration} min</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Path Tabs */}
      <div className="flex gap-2 flex-wrap" data-testid="skill-paths">
        {curriculum.map(path => {
          const pathProgress = getLessonProgress(path.lessons, completedLessons);
          const colors = PATH_COLORS[path.id];
          const PathIcon = PATH_ICONS[path.id];
          const isActive = selectedPath === path.id;
          return (
            <button
              key={path.id}
              onClick={() => { setSelectedPath(path.id); setSelectedLesson(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : 'border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/60'
              }`}
              data-testid={`path-${path.id}`}
            >
              <PathIcon size={16} />
              {path.name}
              <span className="text-xs opacity-60">({pathProgress.percent}%)</span>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-200 dark:bg-slate-900/60 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${PATH_COLORS[selectedPath].fill}`}
          style={{ width: `${progress.percent}%` }}
          data-testid="path-progress"
        />
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">{progress.completed}/{progress.total} lessons completed ({progress.percent}%)</p>

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
              className={`text-left rounded-xl p-4 border transition-all hover:scale-[1.01] ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30'
                  : isAvailable
                  ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
              }`}
              data-testid={`lesson-${lesson.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isCompleted
                    ? 'bg-emerald-500/10'
                    : isAvailable
                    ? 'bg-slate-100 dark:bg-slate-700/50'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : isAvailable ? (
                    <BookOpen size={20} className="text-slate-500 dark:text-slate-400" />
                  ) : (
                    <Lock size={20} className="text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {lesson.order}. {lesson.title}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{lesson.description}</div>
                  {best !== undefined && (
                    <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <Target size={10} />
                      Best: {best}%
                    </div>
                  )}
                  {!isAvailable && !isCompleted && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Lock size={10} />
                      Complete prerequisites to unlock
                    </div>
                  )}
                </div>
                {isCompleted && <span className="text-emerald-500 text-xs font-bold">DONE</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" data-testid="lesson-detail">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-700/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedLesson.title}</h3>
              <button onClick={() => setSelectedLesson(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedLesson.explanation}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><Music size={12} /> {selectedLesson.exerciseNotes.length} notes</span>
              <span className="flex items-center gap-1"><Target size={12} /> {selectedLesson.exerciseBpm} BPM</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Pass: {selectedLesson.passingAccuracy}%</span>
            </div>
            <button
              onClick={() => { onStartLesson(selectedLesson); setSelectedLesson(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all"
              data-testid="start-lesson-btn"
            >
              <Play size={18} />
              Start Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Curriculum;
