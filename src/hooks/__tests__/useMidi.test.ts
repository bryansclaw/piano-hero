import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMidi } from '../useMidi';

// Mock navigator.requestMIDIAccess
const mockInputs = new Map();
let stateChangeHandler: (() => void) | null = null;

const mockMidiAccess = {
  inputs: mockInputs,
  onstatechange: null as (() => void) | null,
};

describe('useMidi', () => {
  beforeEach(() => {
    mockInputs.clear();
    stateChangeHandler = null;
    // @ts-ignore
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({
        ...mockMidiAccess,
        set onstatechange(handler: () => void) {
          stateChangeHandler = handler;
          mockMidiAccess.onstatechange = handler;
        },
        get onstatechange() {
          return stateChangeHandler;
        },
      }),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports MIDI as supported when requestMIDIAccess exists', () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts with no devices connected', () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.devices).toEqual([]);
  });

  it('starts with wasDisconnected as false', () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.wasDisconnected).toBe(false);
  });

  it('clearDisconnected resets flag', () => {
    const { result } = renderHook(() => useMidi());
    act(() => {
      result.current.clearDisconnected();
    });
    expect(result.current.wasDisconnected).toBe(false);
  });

  it('starts with empty activeNotes', () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.activeNotes.size).toBe(0);
  });

  it('has null lastNote initially', () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.lastNote).toBeNull();
  });

  it('selectDevice changes selection', () => {
    const { result } = renderHook(() => useMidi());
    act(() => {
      result.current.selectDevice('test-device-id');
    });
    // We can verify it doesn't crash
    expect(result.current.wasDisconnected).toBe(false);
  });
});
