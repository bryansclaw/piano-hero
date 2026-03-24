import React from 'react';
import type { PerformanceReport, LetterGrade } from '../types';

interface AIFeedbackProps {
  report: PerformanceReport;
  improvementInsight?: string | null;
  onClose?: () => void;
}

const GRADE_COLORS: Record<LetterGrade, string> = {
  S: '#ffdd00',
  A: '#69f0ae',
  B: '#40c4ff',
  C: '#e040fb',
  D: '#ff8800',
  F: '#ff4444',
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
    <div className="bg-[#1a1a3e] rounded-xl p-6 border border-[#2a2a5e] space-y-5 max-w-2xl mx-auto" data-testid="ai-feedback">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🤖 AI Performance Analysis</h3>
        {onClose && (
          <button onClick={onClose} className="text-[#7070a0] hover:text-white text-lg">✕</button>
        )}
      </div>

      {/* Grade & Accuracy */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div
            className="text-6xl font-black"
            style={{ color: gradeColor, textShadow: `0 0 20px ${gradeColor}40` }}
            data-testid="grade-display"
          >
            {report.letterGrade}
          </div>
          <div className="text-sm text-[#b0b0d0]">{GRADE_LABELS[report.letterGrade]}</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#b0b0d0]">Overall Accuracy</span>
            <span className="text-white font-bold">{report.overallAccuracy.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-[#0a0a1a] rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${report.overallAccuracy}%`,
                backgroundColor: gradeColor,
              }}
              data-testid="accuracy-bar"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#b0b0d0]">Score</span>
            <span className="text-white font-bold">{report.score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Improvement tracking */}
      {improvementInsight && (
        <div className="bg-[#0a0a1a] rounded-lg p-3 border border-[#2a2a5e]" data-testid="improvement-insight">
          <p className="text-sm text-[#69f0ae]">📈 {improvementInsight}</p>
        </div>
      )}

      {/* Timing Analysis */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">⏱️ Timing Analysis</h4>
        <div className="bg-[#0a0a1a] rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#7070a0]">Average timing offset</span>
            <span className="text-white">{report.timingAnalysis.averageDeltaMs > 0 ? '+' : ''}{report.timingAnalysis.averageDeltaMs}ms</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7070a0]">Rhythm steadiness</span>
            <span className="text-white">{report.timingAnalysis.steadiness}%</span>
          </div>
          {report.timingAnalysis.insights.map((insight, i) => (
            <p key={i} className="text-sm text-[#b0b0d0] mt-1" data-testid="timing-insight">💡 {insight}</p>
          ))}
        </div>
      </div>

      {/* Dynamics Analysis */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">🎵 Dynamics Analysis</h4>
        <div className="bg-[#0a0a1a] rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#7070a0]">Average velocity</span>
            <span className="text-white">{report.dynamicsAnalysis.averageVelocity}/127</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7070a0]">Dynamic range</span>
            <span className="text-white">{report.dynamicsAnalysis.velocityRange}</span>
          </div>
          {report.dynamicsAnalysis.insights.map((insight, i) => (
            <p key={i} className="text-sm text-[#b0b0d0] mt-1" data-testid="dynamics-insight">💡 {insight}</p>
          ))}
        </div>
      </div>

      {/* Trouble Spots */}
      {report.troubleSpots.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">🔴 Trouble Spots</h4>
          <div className="space-y-1">
            {report.troubleSpots.map((spot, i) => (
              <div key={i} className="bg-[#0a0a1a] rounded-lg p-3 flex items-center gap-3" data-testid="trouble-spot">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: spot.accuracy < 50 ? '#ff444440' : '#ff880040',
                    color: spot.accuracy < 50 ? '#ff4444' : '#ff8800',
                  }}
                >
                  {spot.accuracy}%
                </div>
                <span className="text-sm text-[#b0b0d0]">{spot.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Suggestions */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">📋 Suggested Practice Plan</h4>
        <div className="bg-[#0a0a1a] rounded-lg p-3 space-y-2">
          {report.practiceSuggestions.map((suggestion, i) => (
            <p key={i} className="text-sm text-[#69f0ae]" data-testid="suggestion">
              {i + 1}. {suggestion}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIFeedback;
