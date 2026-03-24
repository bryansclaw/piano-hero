import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Recorder from '../Recorder';
import type { Recording } from '../../types';

describe('Recorder', () => {
  const defaultProps = {
    isRecording: false,
    onStartRecording: vi.fn(),
    onStopRecording: vi.fn(),
    onPlayRecording: vi.fn(),
    currentRecordingDuration: 0,
    playbackRecording: null as Recording | null,
    playbackProgress: 0,
  };

  it('renders recorder panel', () => {
    render(<Recorder {...defaultProps} />);
    expect(screen.getByTestId('recorder')).toBeInTheDocument();
  });

  it('shows record button when not recording', () => {
    render(<Recorder {...defaultProps} />);
    expect(screen.getByTestId('record-btn')).toBeInTheDocument();
  });

  it('calls onStartRecording when record button clicked', () => {
    const onStartRecording = vi.fn();
    render(<Recorder {...defaultProps} onStartRecording={onStartRecording} />);
    fireEvent.click(screen.getByTestId('record-btn'));
    expect(onStartRecording).toHaveBeenCalled();
  });

  it('shows stop button when recording', () => {
    render(<Recorder {...defaultProps} isRecording={true} currentRecordingDuration={5.3} />);
    expect(screen.getByTestId('stop-btn')).toBeInTheDocument();
    expect(screen.getByText(/5.3s/)).toBeInTheDocument();
  });

  it('calls onStopRecording when stop button clicked', () => {
    const onStopRecording = vi.fn();
    render(<Recorder {...defaultProps} isRecording={true} onStopRecording={onStopRecording} />);
    fireEvent.click(screen.getByTestId('stop-btn'));
    expect(onStopRecording).toHaveBeenCalled();
  });

  it('shows empty recording library message', () => {
    render(<Recorder {...defaultProps} />);
    expect(screen.getByText(/No recordings yet/)).toBeInTheDocument();
  });

  it('shows playback panel when playing', () => {
    const recording: Recording = {
      id: 'rec-1', name: 'Test Recording', songId: 'love-story', difficulty: 'easy',
      date: new Date().toISOString(), duration: 60, events: [],
      score: 5000, accuracy: 85, journalNote: '',
    };
    render(<Recorder {...defaultProps} playbackRecording={recording} playbackProgress={0.5} />);
    expect(screen.getByTestId('playback-panel')).toBeInTheDocument();
  });
});
