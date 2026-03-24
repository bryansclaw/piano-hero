import React from 'react';
import type { MidiDevice } from '../types';

interface MidiConnectionProps {
  devices: MidiDevice[];
  selectedDevice: MidiDevice | null;
  isConnected: boolean;
  isSupported: boolean;
  onSelectDevice: (id: string) => void;
}

const MidiConnection: React.FC<MidiConnectionProps> = ({
  devices,
  selectedDevice,
  isConnected,
  isSupported,
  onSelectDevice,
}) => {
  return (
    <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
      <h3 className="text-sm font-semibold text-[#b0b0d0] mb-3 uppercase tracking-wider">
        MIDI Connection
      </h3>

      {!isSupported ? (
        <div className="text-red-400 text-sm">
          ⚠️ Web MIDI API not supported in this browser. Use Chrome or Edge.
        </div>
      ) : devices.length === 0 ? (
        <div className="text-[#b0b0d0] text-sm">
          <p>No MIDI devices detected.</p>
          <p className="text-xs mt-1 text-[#7070a0]">
            Connect a MIDI keyboard and refresh, or use the on-screen keyboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <select
            value={selectedDevice?.id ?? ''}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="w-full bg-[#0a0a1a] border border-[#2a2a5e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e040fb]"
            aria-label="Select MIDI device"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.manufacturer})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#69f0ae]' : 'bg-red-400'}`}
            />
            <span className="text-xs text-[#b0b0d0]">
              {isConnected ? `Connected to ${selectedDevice?.name}` : 'Disconnected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MidiConnection;
