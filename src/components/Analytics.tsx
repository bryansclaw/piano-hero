import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { AnalyticsData } from '../types';
import { aggregatePracticeTime, calculateAccuracyTrend, calculateTotalStats } from '../engine/analyticsEngine';
import { SONG_CATALOG } from '../data/songCatalog';

interface AnalyticsProps {
  analytics: AnalyticsData;
}

// ===== Canvas Chart Components =====
function drawBarChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  values: number[],
  color: string,
  title: string,
  yLabel: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#b0b0d0';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 20);

  if (values.length === 0) {
    ctx.fillStyle = '#7070a0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...values, 1);

  // Y axis
  ctx.strokeStyle = '#2a2a5e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillStyle = '#7070a0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), padding.left - 5, y + 4);
  }

  // Bars
  const barWidth = Math.max(4, (chartW / values.length) * 0.7);
  const gap = chartW / values.length;

  values.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const x = padding.left + i * gap + (gap - barWidth) / 2;
    const y = padding.top + chartH - barH;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barH);

    // Label
    if (labels[i] && values.length <= 14) {
      ctx.fillStyle = '#7070a0';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barWidth / 2, h - padding.bottom + 15);
    }
  });

  // Y label
  ctx.save();
  ctx.translate(12, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#7070a0';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawLineChart(
  canvas: HTMLCanvasElement,
  _labels: string[],
  values: number[],
  color: string,
  title: string,
  yLabel: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#b0b0d0';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 20);

  if (values.length === 0) {
    ctx.fillStyle = '#7070a0';
    ctx.fillText('No data yet', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  // Grid
  ctx.strokeStyle = '#2a2a5e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillStyle = '#7070a0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxVal - (range / 4) * i)), padding.left - 5, y + 4);
  }

  // Line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((val, i) => {
    const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((val - minVal) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points
  values.forEach((val, i) => {
    const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((val - minVal) / range) * chartH;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(12, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#7070a0';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

// ===== Key Heatmap =====
function drawKeyHeatmap(
  canvas: HTMLCanvasElement,
  keyAccuracy: { midi: number; accuracy: number }[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#b0b0d0';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Key Accuracy Heatmap', w / 2, 20);

  const accuracyMap = new Map<number, number>();
  for (const ka of keyAccuracy) {
    accuracyMap.set(ka.midi, ka.accuracy);
  }

  // Draw simplified keyboard (3 octaves centered on middle C)
  const startNote = 48; // C3
  const endNote = 84; // C6
  const blackKeys = [1, 3, 6, 8, 10];

  let whiteCount = 0;
  for (let n = startNote; n <= endNote; n++) {
    if (!blackKeys.includes(n % 12)) whiteCount++;
  }

  const keyW = (w - 40) / whiteCount;
  const keyH = h - 60;
  let whiteIdx = 0;

  // White keys
  for (let n = startNote; n <= endNote; n++) {
    if (blackKeys.includes(n % 12)) continue;

    const x = 20 + whiteIdx * keyW;
    const accuracy = accuracyMap.get(n);

    let color = '#f0f0f0';
    if (accuracy !== undefined) {
      const r = Math.round(255 * (1 - accuracy / 100));
      const g = Math.round(255 * (accuracy / 100));
      color = `rgb(${r}, ${g}, 80)`;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x + 1, 35, keyW - 2, keyH);
    ctx.strokeStyle = '#2a2a5e';
    ctx.strokeRect(x + 1, 35, keyW - 2, keyH);

    whiteIdx++;
  }

  // Black keys
  whiteIdx = 0;
  for (let n = startNote; n <= endNote; n++) {
    if (blackKeys.includes(n % 12)) {
      const x = 20 + (whiteIdx - 0.35) * keyW;
      const accuracy = accuracyMap.get(n);

      let color = '#1a1a2e';
      if (accuracy !== undefined) {
        const r = Math.round(200 * (1 - accuracy / 100));
        const g = Math.round(200 * (accuracy / 100));
        color = `rgb(${r}, ${g}, 60)`;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, 35, keyW * 0.6, keyH * 0.6);
    } else {
      whiteIdx++;
    }
  }

  // Legend
  const legendX = w - 120;
  const gradient = ctx.createLinearGradient(legendX, h - 20, legendX + 80, h - 20);
  gradient.addColorStop(0, 'rgb(255, 0, 80)');
  gradient.addColorStop(0.5, 'rgb(127, 127, 80)');
  gradient.addColorStop(1, 'rgb(0, 255, 80)');
  ctx.fillStyle = gradient;
  ctx.fillRect(legendX, h - 25, 80, 10);
  ctx.fillStyle = '#7070a0';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('0%', legendX, h - 5);
  ctx.textAlign = 'right';
  ctx.fillText('100%', legendX + 80, h - 5);
}

const Analytics: React.FC<AnalyticsProps> = ({ analytics }) => {
  const practiceChartRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedSongId, setSelectedSongId] = useState('');

  const stats = useMemo(() => calculateTotalStats(analytics), [analytics]);
  const practiceData = useMemo(() => aggregatePracticeTime(analytics.dailyPractice, period), [analytics.dailyPractice, period]);

  const songTrend = useMemo(() => {
    const trends = selectedSongId ? analytics.songAccuracyTrends[selectedSongId] : undefined;
    return trends ? calculateAccuracyTrend(trends) : { labels: [], values: [] };
  }, [analytics.songAccuracyTrends, selectedSongId]);

  const favoriteSongName = useMemo(() => {
    const song = SONG_CATALOG.find(s => s.id === stats.favoriteSong);
    return song ? song.title : stats.favoriteSong || 'None yet';
  }, [stats.favoriteSong]);

  // Draw practice time chart
  useEffect(() => {
    if (practiceChartRef.current) {
      drawBarChart(practiceChartRef.current, practiceData.labels, practiceData.values, '#e040fb', 'Practice Time', 'minutes');
    }
  }, [practiceData]);

  // Draw accuracy trend chart
  useEffect(() => {
    if (accuracyChartRef.current) {
      drawLineChart(accuracyChartRef.current, songTrend.labels, songTrend.values, '#40c4ff', 'Accuracy Trend', '%');
    }
  }, [songTrend]);

  // Draw heatmap
  useEffect(() => {
    if (heatmapRef.current) {
      drawKeyHeatmap(heatmapRef.current, analytics.keyAccuracy);
    }
  }, [analytics.keyAccuracy]);

  const songsWithTrends = useMemo(() => {
    return Object.keys(analytics.songAccuracyTrends).map(id => {
      const song = SONG_CATALOG.find(s => s.id === id);
      return { id, title: song ? `${song.title} — ${song.artist}` : id };
    });
  }, [analytics.songAccuracyTrends]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" data-testid="analytics-dashboard">
      <h2 className="text-2xl font-bold text-white">📊 Practice Analytics</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="stats-cards">
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#e040fb]">{stats.totalMinutes}</div>
          <div className="text-xs text-[#7070a0] uppercase">Minutes Practiced</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#40c4ff]">{stats.songsCompleted}</div>
          <div className="text-xs text-[#7070a0] uppercase">Sessions</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#69f0ae]">{stats.averageAccuracy}%</div>
          <div className="text-xs text-[#7070a0] uppercase">Avg Accuracy</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-2xl font-bold text-[#ffdd00]">{stats.longestStreak}</div>
          <div className="text-xs text-[#7070a0] uppercase">Longest Streak</div>
        </div>
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] text-center">
          <div className="text-lg font-bold text-[#ff4081] truncate">{favoriteSongName}</div>
          <div className="text-xs text-[#7070a0] uppercase">Favorite Song</div>
        </div>
      </div>

      {/* Practice Time Chart */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase">Practice Time</h3>
          <div className="flex gap-1">
            {(['week', 'month', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  period === p ? 'bg-[#e040fb]/20 text-[#e040fb]' : 'text-[#7070a0]'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <canvas ref={practiceChartRef} width={700} height={250} className="w-full" data-testid="practice-chart" />
      </div>

      {/* Accuracy Trend */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase">Accuracy Trends</h3>
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="bg-[#0a0a1a] border border-[#2a2a5e] rounded px-2 py-1 text-white text-xs"
            aria-label="Select song for trend"
          >
            <option value="">Select a song...</option>
            {songsWithTrends.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <canvas ref={accuracyChartRef} width={700} height={250} className="w-full" data-testid="accuracy-chart" />
      </div>

      {/* Key Heatmap */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase mb-3">Key Accuracy Heatmap</h3>
        <canvas ref={heatmapRef} width={700} height={200} className="w-full" data-testid="key-heatmap" />
      </div>

      {/* Session History */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase mb-3">Recent Sessions</h3>
        {analytics.sessionHistory.length === 0 ? (
          <p className="text-[#7070a0] text-sm">No sessions recorded yet. Start playing!</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto" data-testid="session-history">
            {[...analytics.sessionHistory].reverse().slice(0, 20).map((session, i) => {
              const songName = SONG_CATALOG.find(s => s.id === session.songId)?.title ?? session.songId;
              return (
                <div key={i} className="flex items-center justify-between bg-[#0a0a1a] rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm text-white font-medium">{songName}</span>
                    <span className="text-xs text-[#7070a0] ml-2">{session.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#7070a0]">{new Date(session.date).toLocaleDateString()}</span>
                    <span className="text-white">{session.score.toLocaleString()}</span>
                    <span className="text-[#69f0ae]">{Math.round(session.accuracy)}%</span>
                    <span className="text-[#7070a0]">{Math.round(session.duration)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
