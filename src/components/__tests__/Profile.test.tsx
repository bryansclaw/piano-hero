import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Profile from '../Profile';
import type { PlayerProfile } from '../../types';

const mockProfile: PlayerProfile = {
  username: 'PianoMaster',
  avatarIndex: 0,
  xp: 2500,
  level: 3,
  badges: ['combo-10', 'five-stars'],
  songsPlayed: 15,
  songsMastered: 3,
  totalPracticeTime: 120,
  joinDate: '2024-01-01T00:00:00Z',
  dailyStreak: 5,
  longestStreak: 12,
  lastPlayedDate: new Date().toISOString().split('T')[0],
  streakFreezes: 2,
};

describe('Profile', () => {
  const defaultProps = {
    profile: mockProfile,
    onUpdateProfile: vi.fn(),
  };

  it('renders profile page', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('profile')).toBeInTheDocument();
  });

  it('displays username', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('username-display')).toHaveTextContent('PianoMaster');
  });

  it('displays level', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('level-display')).toBeInTheDocument();
    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  it('displays avatar', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('avatar-display')).toBeInTheDocument();
  });

  it('displays XP bar', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('xp-bar')).toBeInTheDocument();
  });

  it('displays daily streak', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('streak-display')).toHaveTextContent('5');
  });

  it('displays badges', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByTestId('badges-display')).toBeInTheDocument();
  });

  it('shows songs played count', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows songs mastered count', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('allows editing username', () => {
    render(<Profile {...defaultProps} />);
    fireEvent.click(screen.getByText('✏️'));
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
  });

  it('allows selecting avatar', () => {
    const onUpdateProfile = vi.fn();
    render(<Profile {...defaultProps} onUpdateProfile={onUpdateProfile} />);
    fireEvent.click(screen.getByTestId('avatar-option-3'));
    expect(onUpdateProfile).toHaveBeenCalledWith({ avatarIndex: 3 });
  });

  it('shows streak freezes', () => {
    render(<Profile {...defaultProps} />);
    expect(screen.getByText(/2 freezes/)).toBeInTheDocument();
  });

  it('shows empty badges message when no badges', () => {
    render(<Profile {...defaultProps} profile={{ ...mockProfile, badges: [] }} />);
    expect(screen.getByText(/No badges earned/)).toBeInTheDocument();
  });
});
