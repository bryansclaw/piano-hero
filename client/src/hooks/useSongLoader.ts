import { useState, useCallback, useMemo } from 'react';
import type { SongData, Difficulty, SongNote } from '../types';
import { generateAllSongs } from '../engine/songGenerator';
import { DIFFICULTY_PRESETS } from '../engine/difficulty';

interface UseSongLoaderReturn {
  songs: SongData[];
  currentSong: SongData | null;
  currentNotes: SongNote[];
  loadSong: (id: string, difficulty: Difficulty) => void;
  loadCustomSong: (song: SongData, difficulty: Difficulty) => void;
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
  const [customSong, setCustomSong] = useState<SongData | null>(null);

  const songs = useMemo(() => getAllSongs(), []);

  const currentSong = useMemo(() => {
    if (customSong) return customSong;
    return songs.find((s) => s.id === currentSongId) ?? null;
  }, [songs, currentSongId, customSong]);

  const currentNotes = useMemo(() => {
    if (!currentSong) return [];
    const allNotes = currentSong.notes[currentDifficulty] ?? currentSong.notes.expert;
    return DIFFICULTY_PRESETS[currentDifficulty].noteFilter(allNotes);
  }, [currentSong, currentDifficulty]);

  const loadSong = useCallback((id: string, difficulty: Difficulty) => {
    setIsLoading(true);
    setCustomSong(null); // Clear any custom song
    setCurrentSongId(id);
    setCurrentDifficulty(difficulty);
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  const loadCustomSong = useCallback((song: SongData, difficulty: Difficulty) => {
    setIsLoading(true);
    setCustomSong(song);
    setCurrentSongId(song.id);
    setCurrentDifficulty(difficulty);
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  return {
    songs,
    currentSong,
    currentNotes,
    loadSong,
    loadCustomSong,
    currentDifficulty,
    isLoading,
  };
}
