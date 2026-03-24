import React from 'react';
import type { PracticeToolsState, LoopRange } from '../types';
import { Timer, Repeat, Volume2, VolumeX, Gauge, Zap } from 'lucide-react';

interface PracticeToolsProps {
  state: PracticeToolsState;
  onTempoChange: (percent: number) => void;
  onToggleLoop: () => void;
  onSetLoopRange: (range: LoopRange | null) => void;
  onToggleMetronome: () => void;
  onToggleCountIn: () => void;
  onToggleAutoSpeedUp: () => void;
  onAutoSpeedUpTargetChange: (target: number) => void;
  metronomeTick: boolean;
  totalMeasures?: number;
}

const PracticeTools: React.FC<PracticeToolsProps> = ({
  state,
  onTempoChange,
  onToggleLoop,
  onSetLoopRange,
  onToggleMetronome,
  onToggleCountIn,
  onToggleAutoSpeedUp,
  onAutoSpeedUpTargetChange,
  metronomeTick,
  totalMeasures = 32,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 space-y-4" data-testid="practice-tools">
      {/* Practice Tools Label */}
      <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider" title="These tools are only active in Practice mode — they do not affect Game mode" data-testid="practice-tools-label">
        🎯 Tools — practice only, not active in Game
      </div>
      {/* Practice Mode Indicator */}
      <div className="flex items-center gap-3 text-sm flex-wrap" data-testid="practice-indicator">
        <span className="bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2.5 py-1 rounded-md text-xs font-bold">
          {state.autoSpeedUp ? `${state.currentAutoTempo}%` : `${state.tempoPercent}%`} tempo
        </span>
        {state.loopEnabled && state.loopRange && (
          <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <Repeat size={12} />
            Loop: m{state.loopRange.startMeasure}-{state.loopRange.endMeasure}
          </span>
        )}
        {state.metronomeEnabled && (
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
            metronomeTick
              ? 'bg-emerald-400 text-white dark:text-slate-900'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Timer size={12} />
            Metronome
          </span>
        )}
      </div>

      {/* Tempo Control */}
      <div>
        <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
          Tempo: {state.tempoPercent}%
        </label>
        <input
          type="range"
          min={25}
          max={150}
          value={state.tempoPercent}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-full accent-pink-500"
          data-testid="tempo-slider"
        />
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
          <span>25%</span>
          <span>100%</span>
          <span>150%</span>
        </div>
      </div>

      {/* Section Looping */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Section Loop
          </label>
          <button
            onClick={onToggleLoop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              state.loopEnabled
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
            }`}
            data-testid="loop-toggle"
          >
            <Repeat size={14} />
            {state.loopEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {state.loopEnabled && (
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">Start:</span>
              <input
                type="number"
                min={1}
                max={totalMeasures}
                value={state.loopRange?.startMeasure ?? 1}
                onChange={(e) => onSetLoopRange({
                  startMeasure: Number(e.target.value),
                  endMeasure: state.loopRange?.endMeasure ?? Math.min(Number(e.target.value) + 4, totalMeasures),
                })}
                className="w-16 rounded-md border px-2 py-1 text-xs text-center bg-white border-slate-200 text-slate-900 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-white"
                data-testid="loop-start"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">End:</span>
              <input
                type="number"
                min={1}
                max={totalMeasures}
                value={state.loopRange?.endMeasure ?? 4}
                onChange={(e) => onSetLoopRange({
                  startMeasure: state.loopRange?.startMeasure ?? 1,
                  endMeasure: Number(e.target.value),
                })}
                className="w-16 rounded-md border px-2 py-1 text-xs text-center bg-white border-slate-200 text-slate-900 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-white"
                data-testid="loop-end"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metronome */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Metronome
        </label>
        <button
          onClick={onToggleMetronome}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            state.metronomeEnabled
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
          }`}
          data-testid="metronome-toggle"
        >
          {state.metronomeEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {state.metronomeEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Count-In */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Count-In (1-2-3-4)
        </label>
        <button
          onClick={onToggleCountIn}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            state.countInEnabled
              ? 'bg-amber-400 text-slate-900'
              : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
          }`}
          data-testid="countin-toggle"
        >
          <Gauge size={14} />
          {state.countInEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Auto Speed-Up */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Auto Speed-Up
          </label>
          <button
            onClick={onToggleAutoSpeedUp}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              state.autoSpeedUp
                ? 'bg-pink-500 text-white'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50'
            }`}
            data-testid="autospeed-toggle"
          >
            <Zap size={14} />
            {state.autoSpeedUp ? 'ON' : 'OFF'}
          </button>
        </div>
        {state.autoSpeedUp && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Target:</span>
            <input
              type="range"
              min={25}
              max={150}
              value={state.autoSpeedUpTarget}
              onChange={(e) => onAutoSpeedUpTargetChange(Number(e.target.value))}
              className="flex-1 accent-pink-500"
              data-testid="autospeed-target"
            />
            <span className="text-xs text-slate-700 dark:text-white w-10 text-right">{state.autoSpeedUpTarget}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeTools;
