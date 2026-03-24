import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Analytics from '../Analytics';
import type { AnalyticsData } from '../../types';

const emptyAnalytics: AnalyticsData = {
  dailyPractice: [],
  keyAccuracy: [],
  sessionHistory: [],
  songAccuracyTrends: {},
};

const populatedAnalytics: AnalyticsData = {
  dailyPractice: [
    { date: new Date().toISOString().split('T')[0], totalMinutes: 45, sessions: 3, averageAccuracy: 82, songsPlayed: ['love-story', 'anti-hero'] },
  ],
  keyAccuracy: [
    { midi: 60, totalHits: 50, correctHits: 45, accuracy: 90 },
    { midi: 62, totalHits: 30, correctHits: 20, accuracy: 67 },
  ],
  sessionHistory: [
    { songId: 'love-story', difficulty: 'easy', date: new Date().toISOString(), score: 25000, accuracy: 85, duration: 120 },
    { songId: 'anti-hero', difficulty: 'medium', date: new Date().toISOString(), score: 18000, accuracy: 78, duration: 90 },
  ],
  songAccuracyTrends: {
    'love-story': [
      { date: '2024-01-01', accuracy: 70 },
      { date: '2024-01-05', accuracy: 82 },
      { date: '2024-01-10', accuracy: 90 },
    ],
  },
};

describe('Analytics', () => {
  it('renders the analytics dashboard', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
  });

  it('shows stats cards', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
  });

  it('renders practice time chart canvas', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByTestId('practice-chart')).toBeInTheDocument();
  });

  it('renders accuracy trend chart canvas', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByTestId('accuracy-chart')).toBeInTheDocument();
  });

  it('renders key heatmap canvas', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByTestId('key-heatmap')).toBeInTheDocument();
  });

  it('shows session history when data exists', () => {
    render(<Analytics analytics={populatedAnalytics} />);
    expect(screen.getByTestId('session-history')).toBeInTheDocument();
  });

  it('shows correct total minutes', () => {
    render(<Analytics analytics={populatedAnalytics} />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('shows number of sessions', () => {
    render(<Analytics analytics={populatedAnalytics} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows empty state for session history', () => {
    render(<Analytics analytics={emptyAnalytics} />);
    expect(screen.getByText(/No sessions recorded/)).toBeInTheDocument();
  });
});
