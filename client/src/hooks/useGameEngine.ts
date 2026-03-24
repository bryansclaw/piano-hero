import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameConfig, SongNote, MidiNoteEvent, GameState } from '../types';
import {
  createGameEngine,
  startCountdown,
  startPlaying,
  pauseGame,
  resumeGame,
  updateGame,
  handleNoteInput,
  type GameEngineState,
} from '../engine/gameEngine';

interface UseGameEngineReturn {
  engineState: GameEngineState | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  handleNote: (event: MidiNoteEvent) => void;
  gameState: GameState;
}

export function useGameEngine(
  config: GameConfig | null,
  notes: SongNote[],
  songDuration: number,
  canvasHeight: number,
): UseGameEngineReturn {
  const [engineState, setEngineState] = useState<GameEngineState | null>(null);
  const engineRef = useRef<GameEngineState | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync ref with state
  useEffect(() => {
    engineRef.current = engineState;
  }, [engineState]);

  const gameLoop = useCallback(() => {
    const state = engineRef.current;
    if (!state || state.gameState !== 'playing') return;

    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const newState = updateGame(state, delta, canvasHeight);
    engineRef.current = newState;
    setEngineState(newState);

    if (newState.gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [canvasHeight]);

  const start = useCallback(() => {
    if (!config) return;

    const initial = createGameEngine(config, notes, songDuration);
    const counting = startCountdown(initial);
    engineRef.current = counting;
    setEngineState(counting);

    // Countdown timer
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const state = engineRef.current;
        if (state) {
          const playing = startPlaying(state);
          engineRef.current = playing;
          setEngineState(playing);
          lastTimeRef.current = performance.now();
          animFrameRef.current = requestAnimationFrame(gameLoop);
        }
      } else {
        setEngineState((prev) => prev ? { ...prev, countdown: count } : null);
      }
    }, 1000);
  }, [config, notes, songDuration, gameLoop]);

  const pause = useCallback(() => {
    const state = engineRef.current;
    if (state) {
      cancelAnimationFrame(animFrameRef.current);
      const paused = pauseGame(state);
      engineRef.current = paused;
      setEngineState(paused);
    }
  }, []);

  const resume = useCallback(() => {
    const state = engineRef.current;
    if (state) {
      const resumed = resumeGame(state);
      engineRef.current = resumed;
      setEngineState(resumed);
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    engineRef.current = null;
    setEngineState(null);
  }, []);

  const handleNote = useCallback((event: MidiNoteEvent) => {
    const state = engineRef.current;
    if (state && state.gameState === 'playing') {
      const newState = handleNoteInput(state, event.note, event.timestamp, canvasHeight);
      engineRef.current = newState;
      setEngineState(newState);
    }
  }, [canvasHeight]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return {
    engineState,
    start,
    pause,
    resume,
    reset,
    handleNote,
    gameState: engineState?.gameState ?? 'idle',
  };
}
