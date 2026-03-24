import React from 'react';
import type { MidiDevice } from '../types';
import { AlertTriangle, Cable } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
        <Cable size={16} />
        MIDI Connection
      </h3>

      {!isSupported ? (
        <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-sm">
          <AlertTriangle size={16} />
          Web MIDI API not supported in this browser. Use Chrome or Edge.
        </div>
      ) : devices.length === 0 ? (
        <div className="text-slate-500 dark:text-slate-400 text-sm space-y-1">
          <p>No MIDI devices detected.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Connect a MIDI keyboard and refresh, or use the on-screen keyboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <select
            value={selectedDevice?.id ?? ''}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 bg-white border-slate-200 text-slate-900 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-white dark:focus:border-cyan-400"
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
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isConnected ? `Connected to ${selectedDevice?.name}` : 'Disconnected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MidiConnection;
