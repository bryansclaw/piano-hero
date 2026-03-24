import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePracticeTools } from '../usePracticeTools';

describe('usePracticeTools', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => usePracticeTools(120));
    expect(result.current.state.tempoPercent).toBe(100);
    expect(result.current.state.loopEnabled).toBe(false);
    expect(result.current.state.metronomeEnabled).toBe(false);
    expect(result.current.state.countInEnabled).toBe(true);
    expect(result.current.state.autoSpeedUp).toBe(false);
  });

  it('sets tempo within bounds', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.setTempo(75); });
    expect(result.current.state.tempoPercent).toBe(75);

    act(() => { result.current.setTempo(10); });
    expect(result.current.state.tempoPercent).toBe(25);

    act(() => { result.current.setTempo(200); });
    expect(result.current.state.tempoPercent).toBe(150);
  });

  it('toggles loop', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.toggleLoop(); });
    expect(result.current.state.loopEnabled).toBe(true);

    act(() => { result.current.toggleLoop(); });
    expect(result.current.state.loopEnabled).toBe(false);
  });

  it('sets loop range', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.setLoopRange({ startMeasure: 5, endMeasure: 10 }); });
    expect(result.current.state.loopRange).toEqual({ startMeasure: 5, endMeasure: 10 });

    act(() => { result.current.setLoopRange(null); });
    expect(result.current.state.loopRange).toBeNull();
  });

  it('toggles metronome', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.toggleMetronome(); });
    expect(result.current.state.metronomeEnabled).toBe(true);

    act(() => { result.current.toggleMetronome(); });
    expect(result.current.state.metronomeEnabled).toBe(false);
  });

  it('toggles count-in', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.toggleCountIn(); });
    expect(result.current.state.countInEnabled).toBe(false);

    act(() => { result.current.toggleCountIn(); });
    expect(result.current.state.countInEnabled).toBe(true);
  });

  it('toggles auto speed-up', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.toggleAutoSpeedUp(); });
    expect(result.current.state.autoSpeedUp).toBe(true);
    expect(result.current.state.currentAutoTempo).toBeLessThanOrEqual(50);

    act(() => { result.current.toggleAutoSpeedUp(); });
    expect(result.current.state.autoSpeedUp).toBe(false);
  });

  it('sets auto speed-up target', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.setAutoSpeedUpTarget(120); });
    expect(result.current.state.autoSpeedUpTarget).toBe(120);

    act(() => { result.current.setAutoSpeedUpTarget(200); });
    expect(result.current.state.autoSpeedUpTarget).toBe(150);
  });

  it('getAdjustedTime adjusts time based on tempo', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => { result.current.setTempo(50); });
    const adjusted = result.current.getAdjustedTime(2, 120);
    expect(adjusted).toBe(4); // Half tempo = double time
  });

  it('isInLoopRange works correctly', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    // Without loop enabled, everything is in range
    expect(result.current.isInLoopRange(5)).toBe(true);

    act(() => {
      result.current.toggleLoop();
      result.current.setLoopRange({ startMeasure: 3, endMeasure: 7 });
    });

    expect(result.current.isInLoopRange(5)).toBe(true);
    expect(result.current.isInLoopRange(1)).toBe(false);
    expect(result.current.isInLoopRange(10)).toBe(false);
  });

  it('resets to default state', () => {
    const { result } = renderHook(() => usePracticeTools(120));

    act(() => {
      result.current.setTempo(50);
      result.current.toggleLoop();
      result.current.toggleMetronome();
    });

    act(() => { result.current.resetPracticeTools(); });
    expect(result.current.state.tempoPercent).toBe(100);
    expect(result.current.state.loopEnabled).toBe(false);
    expect(result.current.state.metronomeEnabled).toBe(false);
  });
});
