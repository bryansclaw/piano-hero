import { useState, useCallback, useMemo } from 'react';
import type { SongData, Difficulty, SongNote } from '../types';
import { generateAllSongs } from '../engine/songGenerator';
import { DIFFICULTY_PRESETS } from '../engine/difficulty';

interface UseSongLoaderReturn {
  songs: SongData[];
  currentSong: SongData | null;
  currentNotes: SongNote[];
  loadSong: (id: string, difficulty: Difficulty) => void;
  currentDifficulty: Difficulty;
  isLoading: boolean;
}

// Generate all songs once (memoized at module level)
let cachedSongs: SongData[] | null = null;
function getAllSongs(): SongData[] {
  if (!cachedSongs) {
    cachedSongs = generateAllSongs();
  }
  return cachedSongs;
}

export function useSongLoader(): UseSongLoaderReturn {
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [isLoading, setIsLoading] = useState(false);

  const songs = useMemo(() => getAllSongs(), []);

  const currentSong = useMemo(
    () => songs.find((s) => s.id === currentSongId) ?? null,
    [songs, currentSongId],
  );

  const currentNotes = useMemo(() => {
    if (!currentSong) return [];
    const allNotes = currentSong.notes[currentDifficulty] ?? currentSong.notes.expert;
    return DIFFICULTY_PRESETS[currentDifficulty].noteFilter(allNotes);
  }, [currentSong, currentDifficulty]);

  const loadSong = useCallback((id: string, difficulty: Difficulty) => {
    setIsLoading(true);
    setCurrentSongId(id);
    setCurrentDifficulty(difficulty);
    // Simulate brief loading for UX
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  return {
    songs,
    currentSong,
    currentNotes,
    loadSong,
    currentDifficulty,
    isLoading,
  };
}
