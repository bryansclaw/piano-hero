import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  const onModeChange = vi.fn();

  it('renders PianoHero title', () => {
    render(<Header currentMode="library" onModeChange={onModeChange} />);
    expect(screen.getByText('PianoHero')).toBeInTheDocument();
  });

  it('renders all navigation tabs', () => {
    render(<Header currentMode="library" onModeChange={onModeChange} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Game')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Curriculum')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('marks current mode as active', () => {
    render(<Header currentMode="game" onModeChange={onModeChange} />);
    const gameBtn = screen.getByText('Game').closest('button');
    expect(gameBtn).toHaveAttribute('aria-current', 'page');
  });

  it('calls onModeChange when clicking a tab', () => {
    render(<Header currentMode="library" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText('Game'));
    expect(onModeChange).toHaveBeenCalledWith('game');
  });

  it('switches between all tabs', () => {
    const fn = vi.fn();
    render(<Header currentMode="library" onModeChange={fn} />);
    
    fireEvent.click(screen.getByText('Practice'));
    expect(fn).toHaveBeenCalledWith('practice');
    
    fireEvent.click(screen.getByText('Settings'));
    expect(fn).toHaveBeenCalledWith('settings');
    
    fireEvent.click(screen.getByText('Curriculum'));
    expect(fn).toHaveBeenCalledWith('curriculum');

    fireEvent.click(screen.getByText('Analytics'));
    expect(fn).toHaveBeenCalledWith('analytics');
  });
});
