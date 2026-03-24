import { describe, it, expect } from 'vitest';
import { generateAllSongs, getSongBlueprints } from '../songGenerator';

describe('songGenerator', () => {
  const songs = generateAllSongs();
  const blueprints = getSongBlueprints();

  it('generates 20 songs', () => {
    expect(songs.length).toBe(20);
  });

  it('all songs have valid IDs', () => {
    for (const song of songs) {
      expect(song.id).toBeTruthy();
      expect(typeof song.id).toBe('string');
    }
  });

  it('all songs have unique IDs', () => {
    const ids = songs.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all songs have title and artist', () => {
    for (const song of songs) {
      expect(song.title).toBeTruthy();
      expect(song.artist).toBe('Taylor Swift');
    }
  });

  it('all songs have correct BPM from blueprint', () => {
    for (let i = 0; i < songs.length; i++) {
      expect(songs[i].bpm).toBe(blueprints[i].bpm);
    }
  });

  it('all songs have notes for all difficulties', () => {
    for (const song of songs) {
      expect(song.notes.easy).toBeDefined();
      expect(song.notes.medium).toBeDefined();
      expect(song.notes.hard).toBeDefined();
      expect(song.notes.expert).toBeDefined();
    }
  });

  it('all songs have at least 20 notes in expert', () => {
    for (const song of songs) {
      expect(song.notes.expert.length).toBeGreaterThanOrEqual(20);
    }
  });

  it('all notes have valid MIDI numbers (0-127)', () => {
    for (const song of songs) {
      for (const note of song.notes.expert) {
        expect(note.midi).toBeGreaterThanOrEqual(0);
        expect(note.midi).toBeLessThanOrEqual(127);
      }
    }
  });

  it('all notes have positive time values', () => {
    for (const song of songs) {
      for (const note of song.notes.expert) {
        expect(note.time).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('notes are sorted by time', () => {
    for (const song of songs) {
      for (let i = 1; i < song.notes.expert.length; i++) {
        expect(song.notes.expert[i].time).toBeGreaterThanOrEqual(
          song.notes.expert[i - 1].time - 0.05, // allow slight overlap for humanize
        );
      }
    }
  });

  it('all notes have valid duration', () => {
    for (const song of songs) {
      for (const note of song.notes.expert) {
        expect(note.duration).toBeGreaterThan(0);
      }
    }
  });

  it('all notes have valid velocity', () => {
    for (const song of songs) {
      for (const note of song.notes.expert) {
        expect(note.velocity).toBeGreaterThan(0);
        expect(note.velocity).toBeLessThanOrEqual(127);
      }
    }
  });

  it('songs have positive duration', () => {
    for (const song of songs) {
      expect(song.duration).toBeGreaterThan(10);
    }
  });

  it('includes specific Taylor Swift songs', () => {
    const titles = songs.map((s) => s.title);
    expect(titles).toContain('Love Story');
    expect(titles).toContain('Shake It Off');
    expect(titles).toContain('Anti-Hero');
    expect(titles).toContain('Cruel Summer');
    expect(titles).toContain('All Too Well');
    expect(titles).toContain('Blank Space');
    expect(titles).toContain('Fortnight');
  });

  it('blueprints match songs', () => {
    expect(blueprints.length).toBe(20);
    for (const bp of blueprints) {
      const song = songs.find((s) => s.id === bp.id);
      expect(song).toBeDefined();
    }
  });
});
