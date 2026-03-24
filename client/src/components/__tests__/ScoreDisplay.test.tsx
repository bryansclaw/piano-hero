import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDisplay from '../ScoreDisplay';
import { createInitialScore } from '../../engine/scoring';

describe('ScoreDisplay', () => {
  it('renders score', () => {
    const score = { ...createInitialScore(), points: 1500 };
    render(<ScoreDisplay score={score} />);
    expect(screen.getByTestId('score-points')).toHaveTextContent('1,500');
  });

  it('renders accuracy', () => {
    const score = { ...createInitialScore(), accuracy: 95.5 };
    render(<ScoreDisplay score={score} />);
    expect(screen.getByTestId('accuracy-display')).toHaveTextContent('95.5%');
  });

  it('renders combo when active', () => {
    const score = { ...createInitialScore(), combo: 15, multiplier: 2 };
    render(<ScoreDisplay score={score} />);
    expect(screen.getByTestId('combo-display')).toHaveTextContent('15x combo');
  });

  it('does not render combo when zero', () => {
    const score = createInitialScore();
    render(<ScoreDisplay score={score} />);
    expect(screen.queryByTestId('combo-display')).not.toBeInTheDocument();
  });

  it('renders last rating', () => {
    const score = createInitialScore();
    render(<ScoreDisplay score={score} lastRating="perfect" />);
    expect(screen.getByTestId('last-rating')).toHaveTextContent('perfect');
  });

  it('renders progress bar', () => {
    const score = createInitialScore();
    render(<ScoreDisplay score={score} songProgress={0.5} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
