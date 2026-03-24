import { useRef, useCallback } from 'react';

/**
 * Simple piano audio using raw Web Audio API.
 * No external dependencies. Works reliably across browsers.
 */

// Convert MIDI note to frequency
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function usePianoAudio(volume: number = 80) {
  const ctxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef<Map<number, { osc: OscillatorNode; gain: GainNode }>>(new Map());

  const getContext = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const noteOn = useCallback((midiNote: number, velocity: number = 100) => {
    try {
      const ctx = getContext();

      // Stop existing note if still playing (prevent overlaps on same key)
      const existing = activeRef.current.get(midiNote);
      if (existing) {
        try {
          existing.osc.stop();
          existing.osc.disconnect();
          existing.gain.disconnect();
        } catch { /* already stopped */ }
        activeRef.current.delete(midiNote);
      }

      const freq = midiToFreq(midiNote);
      const vol = (volume / 100) * (velocity / 127) * 0.3; // 0.3 max to avoid clipping

      // Create oscillator — triangle wave sounds piano-like
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Gain envelope for natural attack/decay
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01); // Fast attack
      gain.gain.exponentialRampToValueAtTime(vol * 0.6, ctx.currentTime + 0.1); // Quick decay
      gain.gain.exponentialRampToValueAtTime(vol * 0.3, ctx.currentTime + 0.5); // Sustain decay

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);

      activeRef.current.set(midiNote, { osc, gain });

      // Auto-stop after 3 seconds if noteOff never called
      setTimeout(() => {
        const entry = activeRef.current.get(midiNote);
        if (entry && entry.osc === osc) {
          try {
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
          } catch { /* already stopped */ }
          activeRef.current.delete(midiNote);
        }
      }, 3000);
    } catch (err) {
      console.warn('[PianoAudio] noteOn failed:', err);
    }
  }, [getContext, volume]);

  const noteOff = useCallback((midiNote: number) => {
    const entry = activeRef.current.get(midiNote);
    if (!entry) return;

    try {
      const ctx = ctxRef.current;
      if (ctx) {
        // Fade out over 200ms for natural release
        entry.gain.gain.cancelScheduledValues(ctx.currentTime);
        entry.gain.gain.setValueAtTime(entry.gain.gain.value, ctx.currentTime);
        entry.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        entry.osc.stop(ctx.currentTime + 0.2);
      } else {
        entry.osc.stop();
      }
    } catch { /* already stopped */ }

    activeRef.current.delete(midiNote);
  }, []);

  const allNotesOff = useCallback(() => {
    for (const [note] of activeRef.current) {
      noteOff(note);
    }
  }, [noteOff]);

  return { noteOn, noteOff, allNotesOff };
}
