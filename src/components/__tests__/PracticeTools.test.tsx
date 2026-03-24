import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PracticeTools from '../PracticeTools';
import type { PracticeToolsState } from '../../types';

const defaultState: PracticeToolsState = {
  tempoPercent: 100,
  loopEnabled: false,
  loopRange: null,
  metronomeEnabled: false,
  countInEnabled: true,
  autoSpeedUp: false,
  autoSpeedUpTarget: 100,
  currentAutoTempo: 50,
};

const defaultProps = {
  state: defaultState,
  onTempoChange: vi.fn(),
  onToggleLoop: vi.fn(),
  onSetLoopRange: vi.fn(),
  onToggleMetronome: vi.fn(),
  onToggleCountIn: vi.fn(),
  onToggleAutoSpeedUp: vi.fn(),
  onAutoSpeedUpTargetChange: vi.fn(),
  metronomeTick: false,
};

describe('PracticeTools', () => {
  it('renders practice tools panel', () => {
    render(<PracticeTools {...defaultProps} />);
    expect(screen.getByTestId('practice-tools')).toBeInTheDocument();
  });

  it('displays tempo slider', () => {
    render(<PracticeTools {...defaultProps} />);
    expect(screen.getByTestId('tempo-slider')).toBeInTheDocument();
  });

  it('shows current tempo percentage', () => {
    render(<PracticeTools {...defaultProps} />);
    expect(screen.getByText('Tempo: 100%')).toBeInTheDocument();
  });

  it('calls onTempoChange when slider moves', () => {
    const onTempoChange = vi.fn();
    render(<PracticeTools {...defaultProps} onTempoChange={onTempoChange} />);
    fireEvent.change(screen.getByTestId('tempo-slider'), { target: { value: '75' } });
    expect(onTempoChange).toHaveBeenCalledWith(75);
  });

  it('toggles loop on click', () => {
    const onToggleLoop = vi.fn();
    render(<PracticeTools {...defaultProps} onToggleLoop={onToggleLoop} />);
    fireEvent.click(screen.getByTestId('loop-toggle'));
    expect(onToggleLoop).toHaveBeenCalled();
  });

  it('shows loop range inputs when loop enabled', () => {
    render(<PracticeTools {...defaultProps} state={{ ...defaultState, loopEnabled: true, loopRange: { startMeasure: 1, endMeasure: 4 } }} />);
    expect(screen.getByTestId('loop-start')).toBeInTheDocument();
    expect(screen.getByTestId('loop-end')).toBeInTheDocument();
  });

  it('toggles metronome', () => {
    const onToggleMetronome = vi.fn();
    render(<PracticeTools {...defaultProps} onToggleMetronome={onToggleMetronome} />);
    fireEvent.click(screen.getByTestId('metronome-toggle'));
    expect(onToggleMetronome).toHaveBeenCalled();
  });

  it('toggles auto speed-up', () => {
    const onToggleAutoSpeedUp = vi.fn();
    render(<PracticeTools {...defaultProps} onToggleAutoSpeedUp={onToggleAutoSpeedUp} />);
    fireEvent.click(screen.getByTestId('autospeed-toggle'));
    expect(onToggleAutoSpeedUp).toHaveBeenCalled();
  });

  it('shows auto speed-up target when enabled', () => {
    render(<PracticeTools {...defaultProps} state={{ ...defaultState, autoSpeedUp: true }} />);
    expect(screen.getByTestId('autospeed-target')).toBeInTheDocument();
  });

  it('shows practice indicator', () => {
    render(<PracticeTools {...defaultProps} />);
    expect(screen.getByTestId('practice-indicator')).toBeInTheDocument();
  });

  it('shows metronome badge when enabled', () => {
    render(<PracticeTools {...defaultProps} state={{ ...defaultState, metronomeEnabled: true }} />);
    const metronomeElements = screen.getAllByText(/Metronome/);
    expect(metronomeElements.length).toBeGreaterThanOrEqual(1);
  });
});
