import { useState, useCallback, useRef, useEffect } from 'react';
import type { PracticeToolsState, LoopRange } from '../types';

interface UsePracticeToolsReturn {
  state: PracticeToolsState;
  setTempo: (percent: number) => void;
  setLoopRange: (range: LoopRange | null) => void;
  toggleLoop: () => void;
  toggleMetronome: () => void;
  toggleCountIn: () => void;
  toggleAutoSpeedUp: () => void;
  setAutoSpeedUpTarget: (target: number) => void;
  onLoopComplete: (wasSuccessful: boolean) => void;
  getAdjustedTime: (time: number, bpm: number) => number;
  isInLoopRange: (measure: number) => boolean;
  metronomeTick: boolean;
  resetPracticeTools: () => void;
}

const DEFAULT_STATE: PracticeToolsState = {
  tempoPercent: 100,
  loopEnabled: false,
  loopRange: null,
  metronomeEnabled: false,
  countInEnabled: true,
  autoSpeedUp: false,
  autoSpeedUpTarget: 100,
  currentAutoTempo: 50,
};

export function usePracticeTools(bpm = 120): UsePracticeToolsReturn {
  const [state, setState] = useState<PracticeToolsState>(DEFAULT_STATE);
  const [metronomeTick, setMetronomeTick] = useState(false);
  const metronomeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setTempo = useCallback((percent: number) => {
    const clamped = Math.max(25, Math.min(150, percent));
    setState(prev => ({ ...prev, tempoPercent: clamped }));
  }, []);

  const setLoopRange = useCallback((range: LoopRange | null) => {
    setState(prev => ({ ...prev, loopRange: range }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, loopEnabled: !prev.loopEnabled }));
  }, []);

  const toggleMetronome = useCallback(() => {
    setState(prev => ({ ...prev, metronomeEnabled: !prev.metronomeEnabled }));
  }, []);

  const toggleCountIn = useCallback(() => {
    setState(prev => ({ ...prev, countInEnabled: !prev.countInEnabled }));
  }, []);

  const toggleAutoSpeedUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoSpeedUp: !prev.autoSpeedUp,
      currentAutoTempo: prev.autoSpeedUp ? prev.tempoPercent : Math.min(prev.tempoPercent, 50),
    }));
  }, []);

  const setAutoSpeedUpTarget = useCallback((target: number) => {
    setState(prev => ({ ...prev, autoSpeedUpTarget: Math.max(25, Math.min(150, target)) }));
  }, []);

  const onLoopComplete = useCallback((wasSuccessful: boolean) => {
    if (!state.autoSpeedUp) return;

    setState(prev => {
      if (!prev.autoSpeedUp || !wasSuccessful) return prev;
      const newTempo = Math.min(prev.currentAutoTempo + 5, prev.autoSpeedUpTarget);
      return {
        ...prev,
        currentAutoTempo: newTempo,
        tempoPercent: newTempo,
      };
    });
  }, [state.autoSpeedUp]);

  const getAdjustedTime = useCallback((time: number, _bpm: number): number => {
    const effectiveTempo = state.autoSpeedUp ? state.currentAutoTempo : state.tempoPercent;
    return time * (100 / effectiveTempo);
  }, [state.tempoPercent, state.autoSpeedUp, state.currentAutoTempo]);

  const isInLoopRange = useCallback((measure: number): boolean => {
    if (!state.loopEnabled || !state.loopRange) return true;
    return measure >= state.loopRange.startMeasure && measure <= state.loopRange.endMeasure;
  }, [state.loopEnabled, state.loopRange]);

  const resetPracticeTools = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Metronome tick
  useEffect(() => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }

    if (state.metronomeEnabled) {
      const effectiveTempo = state.autoSpeedUp ? state.currentAutoTempo : state.tempoPercent;
      const adjustedBpm = bpm * (effectiveTempo / 100);
      const intervalMs = (60 / adjustedBpm) * 1000;

      metronomeIntervalRef.current = setInterval(() => {
        setMetronomeTick(true);
        setTimeout(() => setMetronomeTick(false), 50);
      }, intervalMs);
    }

    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, [state.metronomeEnabled, state.tempoPercent, state.autoSpeedUp, state.currentAutoTempo, bpm]);

  return {
    state,
    setTempo,
    setLoopRange,
    toggleLoop,
    toggleMetronome,
    toggleCountIn,
    toggleAutoSpeedUp,
    setAutoSpeedUpTarget,
    onLoopComplete,
    getAdjustedTime,
    isInLoopRange,
    metronomeTick,
    resetPracticeTools,
  };
}
