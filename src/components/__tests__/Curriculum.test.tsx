import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Curriculum from '../Curriculum';

describe('Curriculum', () => {
  const defaultProps = {
    completedLessons: new Set<string>(),
    onStartLesson: vi.fn(),
  };

  it('renders curriculum page', () => {
    render(<Curriculum {...defaultProps} />);
    expect(screen.getByTestId('curriculum')).toBeInTheDocument();
  });

  it('shows all 5 skill path tabs', () => {
    render(<Curriculum {...defaultProps} />);
    expect(screen.getByTestId('skill-paths')).toBeInTheDocument();
    expect(screen.getByTestId('path-fundamentals')).toBeInTheDocument();
    expect(screen.getByTestId('path-chords')).toBeInTheDocument();
    expect(screen.getByTestId('path-sightReading')).toBeInTheDocument();
    expect(screen.getByTestId('path-technique')).toBeInTheDocument();
    expect(screen.getByTestId('path-songMastery')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<Curriculum {...defaultProps} />);
    expect(screen.getByTestId('path-progress')).toBeInTheDocument();
  });

  it('shows lesson grid', () => {
    render(<Curriculum {...defaultProps} />);
    expect(screen.getByTestId('lesson-grid')).toBeInTheDocument();
  });

  it('first lesson is available (not locked)', () => {
    render(<Curriculum {...defaultProps} />);
    const firstLesson = screen.getByTestId('lesson-fund-01');
    expect(firstLesson).toBeInTheDocument();
    expect(firstLesson).not.toBeDisabled();
  });

  it('second lesson is locked without prerequisites', () => {
    render(<Curriculum {...defaultProps} />);
    const secondLesson = screen.getByTestId('lesson-fund-02');
    expect(secondLesson).toBeDisabled();
  });

  it('second lesson unlocks when first is completed', () => {
    render(<Curriculum {...defaultProps} completedLessons={new Set(['fund-01'])} />);
    const secondLesson = screen.getByTestId('lesson-fund-02');
    expect(secondLesson).not.toBeDisabled();
  });

  it('shows lesson detail on click', () => {
    render(<Curriculum {...defaultProps} />);
    fireEvent.click(screen.getByTestId('lesson-fund-01'));
    expect(screen.getByTestId('lesson-detail')).toBeInTheDocument();
  });

  it('switches between paths', () => {
    render(<Curriculum {...defaultProps} />);
    fireEvent.click(screen.getByTestId('path-chords'));
    expect(screen.getByTestId('lesson-chord-01')).toBeInTheDocument();
  });

  it('shows practice plan button', () => {
    render(<Curriculum {...defaultProps} />);
    expect(screen.getByTestId('practice-plan-btn')).toBeInTheDocument();
  });

  it('shows practice plan on toggle', () => {
    render(<Curriculum {...defaultProps} />);
    fireEvent.click(screen.getByTestId('practice-plan-btn'));
    expect(screen.getByTestId('practice-plan')).toBeInTheDocument();
  });

  it('shows completed status for completed lessons', () => {
    render(<Curriculum {...defaultProps} completedLessons={new Set(['fund-01'])} />);
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });

  it('calls onStartLesson when start button clicked', () => {
    const onStartLesson = vi.fn();
    render(<Curriculum {...defaultProps} onStartLesson={onStartLesson} />);
    fireEvent.click(screen.getByTestId('lesson-fund-01'));
    fireEvent.click(screen.getByTestId('start-lesson-btn'));
    expect(onStartLesson).toHaveBeenCalled();
  });
});
