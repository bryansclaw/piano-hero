import React from 'react';
import type { PracticeToolsState, LoopRange } from '../types';

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
    <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] space-y-4" data-testid="practice-tools">
      {/* Practice Mode Indicator */}
      <div className="flex items-center gap-3 text-sm text-[#b0b0d0]" data-testid="practice-indicator">
        <span className="bg-[#e040fb]/20 text-[#e040fb] px-2 py-1 rounded text-xs font-bold">
          {state.autoSpeedUp ? `${state.currentAutoTempo}%` : `${state.tempoPercent}%`} tempo
        </span>
        {state.loopEnabled && state.loopRange && (
          <span className="bg-[#40c4ff]/20 text-[#40c4ff] px-2 py-1 rounded text-xs font-bold">
            Loop: m{state.loopRange.startMeasure}-{state.loopRange.endMeasure}
          </span>
        )}
        {state.metronomeEnabled && (
          <span className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
            metronomeTick ? 'bg-[#69f0ae] text-black' : 'bg-[#69f0ae]/20 text-[#69f0ae]'
          }`}>
            🔊 Metronome
          </span>
        )}
      </div>

      {/* Tempo Control */}
      <div>
        <label className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider block mb-2">
          Tempo: {state.tempoPercent}%
        </label>
        <input
          type="range"
          min={25}
          max={150}
          value={state.tempoPercent}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-full accent-[#e040fb]"
          data-testid="tempo-slider"
        />
        <div className="flex justify-between text-xs text-[#7070a0] mt-1">
          <span>25%</span>
          <span>100%</span>
          <span>150%</span>
        </div>
      </div>

      {/* Section Looping */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
            Section Loop
          </label>
          <button
            onClick={onToggleLoop}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              state.loopEnabled
                ? 'bg-[#40c4ff] text-white'
                : 'bg-[#0a0a1a] text-[#7070a0] border border-[#2a2a5e]'
            }`}
            data-testid="loop-toggle"
          >
            {state.loopEnabled ? '🔁 ON' : '🔁 OFF'}
          </button>
        </div>
        {state.loopEnabled && (
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#7070a0]">Start:</span>
              <input
                type="number"
                min={1}
                max={totalMeasures}
                value={state.loopRange?.startMeasure ?? 1}
                onChange={(e) => onSetLoopRange({
                  startMeasure: Number(e.target.value),
                  endMeasure: state.loopRange?.endMeasure ?? Math.min(Number(e.target.value) + 4, totalMeasures),
                })}
                className="w-16 bg-[#0a0a1a] border border-[#2a2a5e] rounded px-2 py-1 text-white text-xs text-center"
                data-testid="loop-start"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#7070a0]">End:</span>
              <input
                type="number"
                min={1}
                max={totalMeasures}
                value={state.loopRange?.endMeasure ?? 4}
                onChange={(e) => onSetLoopRange({
                  startMeasure: state.loopRange?.startMeasure ?? 1,
                  endMeasure: Number(e.target.value),
                })}
                className="w-16 bg-[#0a0a1a] border border-[#2a2a5e] rounded px-2 py-1 text-white text-xs text-center"
                data-testid="loop-end"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metronome */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
          Metronome
        </label>
        <button
          onClick={onToggleMetronome}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            state.metronomeEnabled
              ? 'bg-[#69f0ae] text-black'
              : 'bg-[#0a0a1a] text-[#7070a0] border border-[#2a2a5e]'
          }`}
          data-testid="metronome-toggle"
        >
          {state.metronomeEnabled ? '🔊 ON' : '🔇 OFF'}
        </button>
      </div>

      {/* Count-In */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
          Count-In (1-2-3-4)
        </label>
        <button
          onClick={onToggleCountIn}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            state.countInEnabled
              ? 'bg-[#ffdd00] text-black'
              : 'bg-[#0a0a1a] text-[#7070a0] border border-[#2a2a5e]'
          }`}
          data-testid="countin-toggle"
        >
          {state.countInEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Auto Speed-Up */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
            Auto Speed-Up
          </label>
          <button
            onClick={onToggleAutoSpeedUp}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              state.autoSpeedUp
                ? 'bg-[#e040fb] text-white'
                : 'bg-[#0a0a1a] text-[#7070a0] border border-[#2a2a5e]'
            }`}
            data-testid="autospeed-toggle"
          >
            {state.autoSpeedUp ? '🚀 ON' : '🚀 OFF'}
          </button>
        </div>
        {state.autoSpeedUp && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7070a0]">Target:</span>
            <input
              type="range"
              min={25}
              max={150}
              value={state.autoSpeedUpTarget}
              onChange={(e) => onAutoSpeedUpTargetChange(Number(e.target.value))}
              className="flex-1 accent-[#e040fb]"
              data-testid="autospeed-target"
            />
            <span className="text-xs text-white w-10 text-right">{state.autoSpeedUpTarget}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeTools;
