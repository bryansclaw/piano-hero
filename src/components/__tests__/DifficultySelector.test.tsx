import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DifficultySelector from '../DifficultySelector';

describe('DifficultySelector', () => {
  const onSelect = vi.fn();

  it('renders all difficulty options', () => {
    render(<DifficultySelector selected="easy" onSelect={onSelect} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('marks selected difficulty', () => {
    render(<DifficultySelector selected="medium" onSelect={onSelect} />);
    const mediumBtn = screen.getByRole('radio', { name: /Medium/ });
    expect(mediumBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSelect when clicking', () => {
    render(<DifficultySelector selected="easy" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Hard'));
    expect(onSelect).toHaveBeenCalledWith('hard');
  });

  it('disables locked difficulties', () => {
    render(
      <DifficultySelector
        selected="easy"
        onSelect={onSelect}
        lockedDifficulties={new Set(['medium', 'hard', 'expert'])}
      />,
    );
    expect(screen.getByText(/Medium/)).toBeDisabled();
    expect(screen.getByText(/Hard/)).toBeDisabled();
    expect(screen.getByText(/Expert/)).toBeDisabled();
  });

  it('does not call onSelect for locked difficulties', () => {
    const fn = vi.fn();
    render(
      <DifficultySelector
        selected="easy"
        onSelect={fn}
        lockedDifficulties={new Set(['medium'])}
      />,
    );
    fireEvent.click(screen.getByText(/Medium/));
    expect(fn).not.toHaveBeenCalled();
  });
});
