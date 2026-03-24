import React from 'react';
import type { PerformanceReport, LetterGrade } from '../types';
import { Bot, X, Clock, Music, AlertCircle, ClipboardList, TrendingUp } from 'lucide-react';

interface AIFeedbackProps {
  report: PerformanceReport;
  improvementInsight?: string | null;
  onClose?: () => void;
}

const GRADE_COLORS: Record<LetterGrade, string> = {
  S: 'text-amber-400',
  A: 'text-emerald-400',
  B: 'text-cyan-400',
  C: 'text-pink-400',
  D: 'text-orange-400',
  F: 'text-rose-400',
};

const GRADE_BG: Record<LetterGrade, string> = {
  S: 'bg-amber-400',
  A: 'bg-emerald-400',
  B: 'bg-cyan-400',
  C: 'bg-pink-400',
  D: 'bg-orange-400',
  F: 'bg-rose-400',
};

const GRADE_LABELS: Record<LetterGrade, string> = {
  S: 'Superb!',
  A: 'Excellent',
  B: 'Great',
  C: 'Good',
  D: 'Needs Work',
  F: 'Keep Trying',
};

const AIFeedback: React.FC<AIFeedbackProps> = ({ report, improvementInsight, onClose }) => {
  const gradeColor = GRADE_COLORS[report.letterGrade];

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 space-y-5 max-w-2xl mx-auto" data-testid="ai-feedback">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Bot size={24} className="text-cyan-500" />
          AI Performance Analysis
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Grade & Accuracy */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div
            className={`text-6xl font-black ${gradeColor}`}
            data-testid="grade-display"
          >
            {report.letterGrade}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{GRADE_LABELS[report.letterGrade]}</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Overall Accuracy</span>
            <span className="text-slate-900 dark:text-white font-bold">{report.overallAccuracy.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900/60 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${GRADE_BG[report.letterGrade]}`}
              style={{ width: `${report.overallAccuracy}%` }}
              data-testid="accuracy-bar"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Score</span>
            <span className="text-slate-900 dark:text-white font-bold">{report.score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Improvement tracking */}
      {improvementInsight && (
        <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-500/20" data-testid="improvement-insight">
          <TrendingUp size={16} className="text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{improvementInsight}</p>
        </div>
      )}

      {/* Timing Analysis */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Clock size={16} />
          Timing Analysis
        </h4>
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">Average timing offset</span>
            <span className="text-slate-900 dark:text-white">{report.timingAnalysis.averageDeltaMs > 0 ? '+' : ''}{report.timingAnalysis.averageDeltaMs}ms</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">Rhythm steadiness</span>
            <span className="text-slate-900 dark:text-white">{report.timingAnalysis.steadiness}%</span>
          </div>
          {report.timingAnalysis.insights.map((insight, i) => (
            <p key={i} className="text-sm text-slate-600 dark:text-slate-400 mt-1" data-testid="timing-insight">
              <span className="text-cyan-500 mr-1">&#9679;</span> {insight}
            </p>
          ))}
        </div>
      </div>

      {/* Dynamics Analysis */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Music size={16} />
          Dynamics Analysis
        </h4>
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">Average velocity</span>
            <span className="text-slate-900 dark:text-white">{report.dynamicsAnalysis.averageVelocity}/127</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 dark:text-slate-500">Dynamic range</span>
            <span className="text-slate-900 dark:text-white">{report.dynamicsAnalysis.velocityRange}</span>
          </div>
          {report.dynamicsAnalysis.insights.map((insight, i) => (
            <p key={i} className="text-sm text-slate-600 dark:text-slate-400 mt-1" data-testid="dynamics-insight">
              <span className="text-cyan-500 mr-1">&#9679;</span> {insight}
            </p>
          ))}
        </div>
      </div>

      {/* Trouble Spots */}
      {report.troubleSpots.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <AlertCircle size={16} className="text-rose-400" />
            Trouble Spots
          </h4>
          <div className="space-y-1">
            {report.troubleSpots.map((spot, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 flex items-center gap-3" data-testid="trouble-spot">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                    spot.accuracy < 50
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-orange-500/10 text-orange-500'
                  }`}
                >
                  {spot.accuracy}%
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">{spot.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Suggestions */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <ClipboardList size={16} />
          Suggested Practice Plan
        </h4>
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 space-y-2">
          {report.practiceSuggestions.map((suggestion, i) => (
            <p key={i} className="text-sm text-emerald-600 dark:text-emerald-400" data-testid="suggestion">
              {i + 1}. {suggestion}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIFeedback;
