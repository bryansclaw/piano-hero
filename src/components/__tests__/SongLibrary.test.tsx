import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SongLibrary from '../SongLibrary';

describe('SongLibrary', () => {
  const onSelectSong = vi.fn();
  const highScores = {};

  it('renders song library', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    expect(screen.getByTestId('song-library')).toBeInTheDocument();
    expect(screen.getByText('Song Library')).toBeInTheDocument();
  });

  it('renders song grid', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    expect(screen.getByTestId('song-grid')).toBeInTheDocument();
  });

  it('renders Taylor Swift songs', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    expect(screen.getByText('Love Story')).toBeInTheDocument();
    expect(screen.getByText('Shake It Off')).toBeInTheDocument();
    expect(screen.getByText('Anti-Hero')).toBeInTheDocument();
  });

  it('search filters songs', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    const searchInput = screen.getByTestId('song-search');
    fireEvent.change(searchInput, { target: { value: 'Love Story' } });
    expect(screen.getByText('Love Story')).toBeInTheDocument();
    expect(screen.queryByText('Shake It Off')).not.toBeInTheDocument();
  });

  it('shows no results message for invalid search', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    const searchInput = screen.getByTestId('song-search');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
  });

  it('calls onSelectSong when clicking a song', () => {
    render(<SongLibrary onSelectSong={onSelectSong} highScores={highScores} />);
    fireEvent.click(screen.getByTestId('song-card-love-story'));
    expect(onSelectSong).toHaveBeenCalledWith('love-story', 'easy');
  });
});
