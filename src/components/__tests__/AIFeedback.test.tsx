import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIFeedback from '../AIFeedback';
import type { PerformanceReport } from '../../types';

const mockReport: PerformanceReport = {
  songId: 'love-story',
  difficulty: 'easy',
  date: new Date().toISOString(),
  duration: 120,
  overallAccuracy: 85.5,
  letterGrade: 'B',
  score: 25000,
  timingAnalysis: {
    averageDeltaMs: 12.5,
    leftHandAvgDelta: 15,
    rightHandAvgDelta: 10,
    rushingTendency: false,
    draggingTendency: false,
    steadiness: 78,
    insights: ['Your timing is solid overall.'],
  },
  dynamicsAnalysis: {
    averageVelocity: 82,
    velocityRange: 45,
    uniformity: 60,
    insights: ['Good dynamic range in your playing.'],
  },
  troubleSpots: [
    { measureStart: 5, measureEnd: 7, accuracy: 45, description: 'Measures 5-7: ~45% accuracy' },
  ],
  practiceSuggestions: [
    'Focus on measures 5-7 at 60% speed, then increase gradually.',
    'Use auto speed-up mode starting at 75% to gradually build speed.',
  ],
  noteTimings: [],
};

describe('AIFeedback', () => {
  it('renders the feedback panel', () => {
    render(<AIFeedback report={mockReport} />);
    expect(screen.getByTestId('ai-feedback')).toBeInTheDocument();
  });

  it('displays the letter grade', () => {
    render(<AIFeedback report={mockReport} />);
    expect(screen.getByTestId('grade-display')).toHaveTextContent('B');
  });

  it('displays overall accuracy', () => {
    render(<AIFeedback report={mockReport} />);
    expect(screen.getByText('85.5%')).toBeInTheDocument();
  });

  it('displays score', () => {
    render(<AIFeedback report={mockReport} />);
    expect(screen.getByText('25,000')).toBeInTheDocument();
  });

  it('renders timing insights', () => {
    render(<AIFeedback report={mockReport} />);
    const insights = screen.getAllByTestId('timing-insight');
    expect(insights.length).toBeGreaterThan(0);
  });

  it('renders dynamics insights', () => {
    render(<AIFeedback report={mockReport} />);
    const insights = screen.getAllByTestId('dynamics-insight');
    expect(insights.length).toBeGreaterThan(0);
  });

  it('renders trouble spots', () => {
    render(<AIFeedback report={mockReport} />);
    const spots = screen.getAllByTestId('trouble-spot');
    expect(spots.length).toBe(1);
  });

  it('renders practice suggestions', () => {
    render(<AIFeedback report={mockReport} />);
    const suggestions = screen.getAllByTestId('suggestion');
    expect(suggestions.length).toBe(2);
  });

  it('displays improvement insight when provided', () => {
    render(<AIFeedback report={mockReport} improvementInsight="Your accuracy improved from 72% to 85%!" />);
    expect(screen.getByTestId('improvement-insight')).toBeInTheDocument();
    expect(screen.getByText(/72%/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<AIFeedback report={mockReport} onClose={onClose} />);
    // Close button is now an icon button - find by its parent structure
    const header = screen.getByText('AI Performance Analysis').closest('div');
    const closeBtn = header?.querySelector('button');
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders different grades with correct styling', () => {
    const sReport = { ...mockReport, letterGrade: 'S' as const, overallAccuracy: 99 };
    const { rerender } = render(<AIFeedback report={sReport} />);
    expect(screen.getByTestId('grade-display')).toHaveTextContent('S');

    const fReport = { ...mockReport, letterGrade: 'F' as const, overallAccuracy: 30 };
    rerender(<AIFeedback report={fReport} />);
    expect(screen.getByTestId('grade-display')).toHaveTextContent('F');
  });
});
