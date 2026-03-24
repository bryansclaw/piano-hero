import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Leaderboard from '../Leaderboard';
import type { HighScore, Difficulty } from '../../types';

const mockHighScores: Record<string, Record<Difficulty, HighScore>> = {
  'love-story': {
    easy: { songId: 'love-story', difficulty: 'easy', score: 50000, stars: 4, accuracy: 90, maxCombo: 30, date: '2024-01-01' },
    medium: { songId: 'love-story', difficulty: 'medium', score: 30000, stars: 3, accuracy: 80, maxCombo: 20, date: '2024-01-01' },
    hard: { songId: 'love-story', difficulty: 'hard', score: 0, stars: 0, accuracy: 0, maxCombo: 0, date: '' },
    expert: { songId: 'love-story', difficulty: 'expert', score: 0, stars: 0, accuracy: 0, maxCombo: 0, date: '' },
  },
};

describe('Leaderboard', () => {
  it('renders leaderboard', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
  });

  it('shows global and friends tabs', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    expect(screen.getByTestId('global-tab')).toBeInTheDocument();
    expect(screen.getByTestId('friends-tab')).toBeInTheDocument();
  });

  it('displays leaderboard rows', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    const rows = screen.getAllByTestId('leaderboard-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('switches between global and friends tabs', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    fireEvent.click(screen.getByTestId('friends-tab'));
    expect(screen.getByTestId('friend-input')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('global-tab'));
    expect(screen.queryByTestId('friend-input')).not.toBeInTheDocument();
  });

  it('shows percentile on global tab', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    expect(screen.getByTestId('percentile-display')).toBeInTheDocument();
  });

  it('shows song selector', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    expect(screen.getByTestId('song-select')).toBeInTheDocument();
  });

  it('calls onAddFriend when adding a friend', () => {
    const onAddFriend = vi.fn();
    render(
      <Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" onAddFriend={onAddFriend} />
    );
    fireEvent.click(screen.getByTestId('friends-tab'));
    fireEvent.change(screen.getByTestId('friend-input'), { target: { value: 'NewFriend' } });
    fireEvent.click(screen.getByTestId('add-friend-btn'));
    expect(onAddFriend).toHaveBeenCalledWith('NewFriend');
  });

  it('shows player rank in percentile display', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    const rankDisplay = screen.getByTestId('player-rank');
    expect(rankDisplay).toBeInTheDocument();
    expect(rankDisplay.textContent).toContain('You are #');
  });

  it('highlights player row in leaderboard', () => {
    render(<Leaderboard highScores={mockHighScores} friends={[]} playerName="TestPlayer" />);
    const rows = screen.getAllByTestId('leaderboard-row');
    const playerRow = rows.find(row => row.textContent?.includes('(you)'));
    expect(playerRow).toBeDefined();
  });

  it('shows friends in friends tab', () => {
    const friends = [
      { username: 'Alice', avatarIndex: 0, level: 5, xp: 2000 },
      { username: 'Bob', avatarIndex: 1, level: 3, xp: 1000 },
    ];
    render(<Leaderboard highScores={mockHighScores} friends={friends} playerName="TestPlayer" />);
    fireEvent.click(screen.getByTestId('friends-tab'));
    const rows = screen.getAllByTestId('leaderboard-row');
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});
