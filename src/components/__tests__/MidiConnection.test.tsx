import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MidiConnection from '../MidiConnection';

describe('MidiConnection', () => {
  it('shows unsupported message when MIDI not available', () => {
    render(
      <MidiConnection
        devices={[]}
        selectedDevice={null}
        isConnected={false}
        isSupported={false}
        onSelectDevice={vi.fn()}
      />,
    );
    expect(screen.getByText(/Web MIDI API not supported/)).toBeInTheDocument();
  });

  it('shows no devices message', () => {
    render(
      <MidiConnection
        devices={[]}
        selectedDevice={null}
        isConnected={false}
        isSupported={true}
        onSelectDevice={vi.fn()}
      />,
    );
    expect(screen.getByText(/No MIDI devices detected/)).toBeInTheDocument();
  });

  it('renders device selector when devices available', () => {
    const devices = [
      { id: '1', name: 'Test Piano', manufacturer: 'Test Corp', state: 'connected' as const },
    ];
    render(
      <MidiConnection
        devices={devices}
        selectedDevice={devices[0]}
        isConnected={true}
        isSupported={true}
        onSelectDevice={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Select MIDI device')).toBeInTheDocument();
    expect(screen.getByText(/Connected to Test Piano/)).toBeInTheDocument();
  });

  it('shows disconnected state', () => {
    const devices = [
      { id: '1', name: 'Test Piano', manufacturer: 'Test Corp', state: 'connected' as const },
    ];
    render(
      <MidiConnection
        devices={devices}
        selectedDevice={devices[0]}
        isConnected={false}
        isSupported={true}
        onSelectDevice={vi.fn()}
      />,
    );
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('calls onSelectDevice when changing selection', () => {
    const onSelect = vi.fn();
    const devices = [
      { id: '1', name: 'Piano A', manufacturer: 'Corp', state: 'connected' as const },
      { id: '2', name: 'Piano B', manufacturer: 'Corp', state: 'connected' as const },
    ];
    render(
      <MidiConnection
        devices={devices}
        selectedDevice={devices[0]}
        isConnected={true}
        isSupported={true}
        onSelectDevice={onSelect}
      />,
    );
    fireEvent.change(screen.getByLabelText('Select MIDI device'), { target: { value: '2' } });
    expect(onSelect).toHaveBeenCalledWith('2');
  });
});
