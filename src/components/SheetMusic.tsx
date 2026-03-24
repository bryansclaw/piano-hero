import React, { useRef, useEffect } from 'react';
import type { SongNote } from '../types';


interface SheetMusicProps {
  notes: SongNote[];
  currentTime: number;
  playedNotes?: Map<number, 'correct' | 'wrong'>;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ notes, currentTime, playedNotes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, width, height);

    // Draw staff lines
    const staffY = 60;
    const lineSpacing = 12;
    ctx.strokeStyle = '#3a3a6e';
    ctx.lineWidth = 1;

    // Treble staff
    for (let i = 0; i < 5; i++) {
      const y = staffY + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Bass staff
    const bassStaffY = staffY + 80;
    for (let i = 0; i < 5; i++) {
      const y = bassStaffY + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Draw clef labels
    ctx.fillStyle = '#b0b0d0';
    ctx.font = '20px serif';
    ctx.fillText('𝄞', 10, staffY + 35);
    ctx.fillText('𝄢', 10, bassStaffY + 35);

    // Draw notes
    if (notes.length === 0) {
      ctx.fillStyle = '#7070a0';
      ctx.font = '14px sans-serif';
      ctx.fillText('No notes to display', width / 2 - 60, height / 2);
      return;
    }

    const visibleWindowStart = Math.max(0, currentTime - 2);
    const visibleWindowEnd = currentTime + 8;
    const pixelsPerSecond = (width - 80) / 10;

    const visibleNotes = notes.filter(
      (n) => n.time >= visibleWindowStart && n.time <= visibleWindowEnd,
    );

    for (const note of visibleNotes) {
      const x = 60 + (note.time - visibleWindowStart) * pixelsPerSecond;
      const isRight = note.hand === 'right';

      // Simple vertical mapping: higher MIDI = higher on staff
      const baseY = isRight ? staffY : bassStaffY;
      const noteY = baseY + 40 - ((note.midi - 48) / 40) * 60;

      // Color based on played status
      const noteIdx = notes.indexOf(note);
      const status = playedNotes?.get(noteIdx);
      if (note.time < currentTime) {
        ctx.fillStyle = status === 'correct' ? '#69f0ae' : status === 'wrong' ? '#ff4444' : '#7070a0';
      } else {
        ctx.fillStyle = '#e040fb';
      }

      // Draw note head
      ctx.beginPath();
      ctx.ellipse(x, noteY, 6, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw note stem
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 5, noteY);
      ctx.lineTo(x + 5, noteY - 25);
      ctx.stroke();
    }

    // Draw current time marker
    const markerX = 60 + 2 * pixelsPerSecond;
    ctx.strokeStyle = '#ff408180';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(markerX, staffY - 10);
    ctx.lineTo(markerX, bassStaffY + 4 * lineSpacing + 10);
    ctx.stroke();
  }, [notes, currentTime, playedNotes]);

  return (
    <div ref={containerRef} className="w-full" data-testid="sheet-music">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  );
};

export default SheetMusic;
