import React, { useRef, useEffect, useCallback } from 'react';
import type { FallingNote, Particle, GameState } from '../types';
import { getNoteColor, HIT_LINE_Y_PERCENT, NOTE_BORDER_RADIUS, THEME } from '../utils/constants';
import { noteToX, noteDisplayWidth } from '../engine/noteMapper';

interface FallingNotesProps {
  fallingNotes: FallingNote[];
  gameState: GameState;
  countdown: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

const FallingNotes: React.FC<FallingNotesProps> = ({
  fallingNotes,
  gameState,
  countdown,
  canvasWidth = 1200,
  canvasHeight = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevNotesRef = useRef<Map<string, boolean>>(new Map());

  // Spawn particles on hit
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const hitLineY = canvasHeight * HIT_LINE_Y_PERCENT;

    // Detect newly hit notes and spawn particles
    const prevMap = prevNotesRef.current;
    for (const note of fallingNotes) {
      if (note.hit && !prevMap.get(note.id) && note.rating !== 'miss') {
        const x = noteToX(note.midi, canvasWidth);
        const color = getNoteColor(note.midi);
        const count = note.rating === 'perfect' ? 20 : note.rating === 'great' ? 12 : 6;
        spawnParticles(x, hitLineY, color, count);
      }
      prevMap.set(note.id, note.hit);
    }

    // Clear canvas
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw subtle grid lines
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvasWidth; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }

    // Draw hit line
    ctx.strokeStyle = THEME.hitLineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, hitLineY);
    ctx.lineTo(canvasWidth, hitLineY);
    ctx.stroke();

    // Glow on hit line
    const gradient = ctx.createLinearGradient(0, hitLineY - 20, 0, hitLineY + 20);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, '#ffffff10');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, hitLineY - 20, canvasWidth, 40);

    // Draw falling notes (viewport culling — only render notes in visible Y range)
    for (const note of fallingNotes) {
      if (note.hit && note.rating !== 'miss') continue; // Don't draw hit notes (particles replace them)
      const noteHeight = Math.max(10, note.duration * 50);
      if (note.y - noteHeight > canvasHeight + 10 || note.y < -noteHeight - 10) continue; // Off screen

      const x = noteToX(note.midi, canvasWidth);
      const w = noteDisplayWidth(note.midi, canvasWidth);
      const color = getNoteColor(note.midi);

      // Note rectangle
      const y = note.y - noteHeight;

      if (note.hit && note.rating === 'miss') {
        ctx.globalAlpha = 0.3;
      }

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      ctx.fillStyle = color;
      roundRect(ctx, x - w / 2, y, w, noteHeight, NOTE_BORDER_RADIUS);
      ctx.fill();

      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = `${color}40`;
      roundRect(ctx, x - w / 2 + 2, y + 2, w - 4, noteHeight - 4, NOTE_BORDER_RADIUS - 1);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Draw particles
    const dt = 1 / 60;
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.life -= dt / p.maxLife;

      if (p.life <= 0) return false;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      return true;
    });

    // Draw countdown
    if (gameState === 'countdown') {
      ctx.fillStyle = '#00000080';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 30;
      ctx.fillText(String(countdown), canvasWidth / 2, canvasHeight / 2);
      ctx.shadowBlur = 0;
    }

    // Idle state message
    if (gameState === 'idle') {
      ctx.fillStyle = '#ffffff40';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select a song and press Play to begin!', canvasWidth / 2, canvasHeight / 2);
    }

    // Paused overlay
    if (gameState === 'paused') {
      ctx.fillStyle = '#00000060';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2);
    }
  }, [fallingNotes, gameState, countdown, canvasWidth, canvasHeight, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
      data-testid="falling-notes-canvas"
    />
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default FallingNotes;
