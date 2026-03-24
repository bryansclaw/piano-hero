import { useState, useEffect, useCallback, useRef } from 'react';
import type { MidiDevice, MidiNoteEvent } from '../types';

interface UseMidiReturn {
  devices: MidiDevice[];
  selectedDevice: MidiDevice | null;
  isConnected: boolean;
  isSupported: boolean;
  activeNotes: Set<number>;
  selectDevice: (id: string) => void;
  lastNote: MidiNoteEvent | null;
}

export function useMidi(onNoteOn?: (event: MidiNoteEvent) => void, onNoteOff?: (event: MidiNoteEvent) => void): UseMidiReturn {
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSupported] = useState(() => !!navigator.requestMIDIAccess);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [lastNote, setLastNote] = useState<MidiNoteEvent | null>(null);
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);

  onNoteOnRef.current = onNoteOn;
  onNoteOffRef.current = onNoteOff;

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;
    const channel = data[0] & 0x0f;
    const note = data[1];
    const velocity = data[2];

    const noteEvent: MidiNoteEvent = {
      note,
      velocity,
      timestamp: performance.now(),
      channel,
    };

    if (status === 0x90 && velocity > 0) {
      // Note On
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(note);
        return next;
      });
      setLastNote(noteEvent);
      onNoteOnRef.current?.(noteEvent);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
      onNoteOffRef.current?.(noteEvent);
    }
  }, []);

  const updateDevices = useCallback((access: MIDIAccess) => {
    const deviceList: MidiDevice[] = [];
    access.inputs.forEach((input) => {
      deviceList.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state as 'connected' | 'disconnected',
      });
    });
    setDevices(deviceList);

    // Auto-select first device if none selected
    if (!selectedDeviceId && deviceList.length > 0) {
      setSelectedDeviceId(deviceList[0].id);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    navigator.requestMIDIAccess({ sysex: false }).then((access) => {
      if (cancelled) return;
      midiAccessRef.current = access;
      updateDevices(access);

      access.onstatechange = () => {
        updateDevices(access);
      };
    }).catch(() => {
      // MIDI access denied or not available
    });

    return () => {
      cancelled = true;
    };
  }, [isSupported, updateDevices]);

  // Connect to selected device
  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access || !selectedDeviceId) {
      setIsConnected(false);
      return;
    }

    // Disconnect from all first
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    const input = access.inputs.get(selectedDeviceId);
    if (input) {
      input.onmidimessage = handleMidiMessage;
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }

    return () => {
      if (input) input.onmidimessage = null;
    };
  }, [selectedDeviceId, handleMidiMessage]);

  const selectDevice = useCallback((id: string) => {
    setSelectedDeviceId(id);
  }, []);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) ?? null;

  return {
    devices,
    selectedDevice,
    isConnected,
    isSupported,
    activeNotes,
    selectDevice,
    lastNote,
  };
}
