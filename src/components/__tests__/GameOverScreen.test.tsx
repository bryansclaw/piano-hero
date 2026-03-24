import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameOverScreen from '../GameOverScreen';
import type { GameScore } from '../../types';

describe('GameOverScreen', () => {
  const mockScore: GameScore = {
    points: 5000,
    combo: 0,
    maxCombo: 25,
    multiplier: 1,
    perfect: 20,
    great: 10,
    good: 5,
    miss: 3,
    accuracy: 92.1,
    stars: 4,
  };

  const onRetry = vi.fn();
  const onBackToLibrary = vi.fn();

  it('renders game over screen', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Test Song" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    expect(screen.getByTestId('game-over-screen')).toBeInTheDocument();
    expect(screen.getByText('Song Complete!')).toBeInTheDocument();
  });

  it('displays song title', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Love Story" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    expect(screen.getByText('Love Story')).toBeInTheDocument();
  });

  it('displays stars', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Test" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    expect(screen.getByTestId('stars-display')).toBeInTheDocument();
  });

  it('displays final score', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Test" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    expect(screen.getByTestId('final-score')).toHaveTextContent('5,000');
  });

  it('calls onRetry when retry button clicked', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Test" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('displays score breakdown', () => {
    render(
      <GameOverScreen score={mockScore} songTitle="Test" onRetry={onRetry} onBackToLibrary={onBackToLibrary} />,
    );
    expect(screen.getByText('P:20')).toBeInTheDocument();
    expect(screen.getByText('M:3')).toBeInTheDocument();
  });
});
