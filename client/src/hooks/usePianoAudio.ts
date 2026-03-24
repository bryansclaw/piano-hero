import { useRef, useCallback } from 'react';
import * as Tone from 'tone';

/**
 * Hook that provides a polyphonic piano synth for playing notes.
 * Uses Tone.js PolySynth for multi-note support.
 */
export function usePianoAudio(volume: number = 80) {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const startedRef = useRef(false);

  const ensureSynth = useCallback(async () => {
    // Tone.js requires a user gesture to start audio context
    if (!startedRef.current) {
      await Tone.start();
      startedRef.current = true;
    }

    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: 0.4,
          release: 0.8,
        },
      }).toDestination();
    }

    // Update volume (-60 to 0 dB range)
    synthRef.current.volume.value = -60 + (volume / 100) * 60;

    return synthRef.current;
  }, [volume]);

  const noteOn = useCallback((midiNote: number, velocity: number = 100) => {
    // Fire-and-forget — don't block on async
    ensureSynth().then(synth => {
      const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
      const vel = Math.max(0.01, velocity / 127);
      synth.triggerAttack(freq, Tone.now(), vel);
    }).catch(err => {
      console.warn('[PianoAudio] Failed to play note:', err);
    });
  }, [ensureSynth]);

  const noteOff = useCallback((midiNote: number) => {
    // Only release if synth already exists (don't create one just to release)
    if (synthRef.current && startedRef.current) {
      try {
        const freq = Tone.Frequency(midiNote, 'midi').toFrequency();
        synthRef.current.triggerRelease(freq, Tone.now());
      } catch (err) {
        console.warn('[PianoAudio] Failed to release note:', err);
      }
    }
  }, []);

  const allNotesOff = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll();
    }
  }, []);

  return { noteOn, noteOff, allNotesOff };
}
