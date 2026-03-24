import type { SongMeta } from '../types';
import { getSongBlueprints } from '../engine/songGenerator';

const blueprints = getSongBlueprints();

export const SONG_CATALOG: SongMeta[] = blueprints.map((bp) => ({
  id: bp.id,
  title: bp.title,
  artist: bp.artist,
  bpm: bp.bpm,
  key: bp.key,
  duration: 120, // approximate
  album: bp.album,
  year: bp.year,
  difficulty: {
    easy: Math.max(1, Math.min(10, Math.round(bp.bpm / 30))),
    medium: Math.max(2, Math.min(10, Math.round(bp.bpm / 25))),
    hard: Math.max(4, Math.min(10, Math.round(bp.bpm / 20))),
    expert: Math.max(6, Math.min(10, Math.round(bp.bpm / 18))),
  },
}));

export function getSongMeta(id: string): SongMeta | undefined {
  return SONG_CATALOG.find((s) => s.id === id);
}
