import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { AnalyticsData } from '../types';
import { aggregatePracticeTime, calculateAccuracyTrend, calculateTotalStats } from '../engine/analyticsEngine';
import { SONG_CATALOG } from '../data/songCatalog';
import { BarChart3, Clock, Music, Target, Flame, Heart } from 'lucide-react';

interface AnalyticsProps {
  analytics: AnalyticsData;
}

// ===== Canvas Chart Components =====
function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    bg: isDark ? '#0f172a' : '#f8fafc',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    text: isDark ? '#64748b' : '#94a3b8',
    label: isDark ? '#94a3b8' : '#64748b',
  };
}

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
  const colors = getChartColors();

  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = colors.label;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 20);

  if (values.length === 0) {
    ctx.fillStyle = colors.text;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...values, 1);

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), padding.left - 5, y + 4);
  }

  const barWidth = Math.max(4, (chartW / values.length) * 0.7);
  const gap = chartW / values.length;

  values.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const x = padding.left + i * gap + (gap - barWidth) / 2;
    const y = padding.top + chartH - barH;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barH);

    if (labels[i] && values.length <= 14) {
      ctx.fillStyle = colors.text;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barWidth / 2, h - padding.bottom + 15);
    }
  });

  ctx.save();
  ctx.translate(12, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.text;
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
  const colors = getChartColors();

  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = colors.label;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 20);

  if (values.length === 0) {
    ctx.fillStyle = colors.text;
    ctx.fillText('No data yet', w / 2, h / 2);
    return;
  }

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxVal - (range / 4) * i)), padding.left - 5, y + 4);
  }

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
  ctx.fillStyle = colors.text;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function drawKeyHeatmap(
  canvas: HTMLCanvasElement,
  keyAccuracy: { midi: number; accuracy: number }[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const colors = getChartColors();

  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = colors.label;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Key Accuracy Heatmap', w / 2, 20);

  const accuracyMap = new Map<number, number>();
  for (const ka of keyAccuracy) {
    accuracyMap.set(ka.midi, ka.accuracy);
  }

  const startNote = 48;
  const endNote = 84;
  const blackKeys = [1, 3, 6, 8, 10];

  let whiteCount = 0;
  for (let n = startNote; n <= endNote; n++) {
    if (!blackKeys.includes(n % 12)) whiteCount++;
  }

  const keyW = (w - 40) / whiteCount;
  const keyH = h - 60;
  let whiteIdx = 0;

  for (let n = startNote; n <= endNote; n++) {
    if (blackKeys.includes(n % 12)) continue;

    const x = 20 + whiteIdx * keyW;
    const accuracy = accuracyMap.get(n);

    let color = document.documentElement.classList.contains('dark') ? '#f0f0f0' : '#e2e8f0';
    if (accuracy !== undefined) {
      const r = Math.round(255 * (1 - accuracy / 100));
      const g = Math.round(255 * (accuracy / 100));
      color = `rgb(${r}, ${g}, 80)`;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x + 1, 35, keyW - 2, keyH);
    ctx.strokeStyle = colors.grid;
    ctx.strokeRect(x + 1, 35, keyW - 2, keyH);

    whiteIdx++;
  }

  whiteIdx = 0;
  for (let n = startNote; n <= endNote; n++) {
    if (blackKeys.includes(n % 12)) {
      const x = 20 + (whiteIdx - 0.35) * keyW;
      const accuracy = accuracyMap.get(n);

      let color = document.documentElement.classList.contains('dark') ? '#1e293b' : '#334155';
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

  const legendX = w - 120;
  const gradient = ctx.createLinearGradient(legendX, h - 20, legendX + 80, h - 20);
  gradient.addColorStop(0, 'rgb(255, 0, 80)');
  gradient.addColorStop(0.5, 'rgb(127, 127, 80)');
  gradient.addColorStop(1, 'rgb(0, 255, 80)');
  ctx.fillStyle = gradient;
  ctx.fillRect(legendX, h - 25, 80, 10);
  ctx.fillStyle = colors.text;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('0%', legendX, h - 5);
  ctx.textAlign = 'right';
  ctx.fillText('100%', legendX + 80, h - 5);
}

const STAT_ICONS = [
  { icon: Clock, color: 'text-pink-500' },
  { icon: Music, color: 'text-cyan-500' },
  { icon: Target, color: 'text-emerald-500' },
  { icon: Flame, color: 'text-amber-500' },
  { icon: Heart, color: 'text-rose-500' },
];

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

  useEffect(() => {
    if (practiceChartRef.current) {
      drawBarChart(practiceChartRef.current, practiceData.labels, practiceData.values, '#ec4899', 'Practice Time', 'minutes');
    }
  }, [practiceData]);

  useEffect(() => {
    if (accuracyChartRef.current) {
      drawLineChart(accuracyChartRef.current, songTrend.labels, songTrend.values, '#06b6d4', 'Accuracy Trend', '%');
    }
  }, [songTrend]);

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

  const statCards = [
    { value: stats.totalMinutes, label: 'Minutes Practiced' },
    { value: stats.songsCompleted, label: 'Sessions' },
    { value: `${stats.averageAccuracy}%`, label: 'Avg Accuracy' },
    { value: stats.longestStreak, label: 'Longest Streak' },
    { value: favoriteSongName, label: 'Favorite Song' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6" data-testid="analytics-dashboard">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <BarChart3 size={24} className="text-cyan-500" />
        Practice Analytics
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="stats-cards">
        {statCards.map((stat, i) => {
          const StatIcon = STAT_ICONS[i].icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              <StatIcon size={20} className={`mx-auto mb-2 ${STAT_ICONS[i].color}`} />
              <div className={`text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent ${typeof stat.value === 'string' && stat.value.length > 8 ? 'text-lg' : ''}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 uppercase mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Practice Time Chart */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Practice Time</h3>
          <div className="flex gap-1">
            {(['week', 'month', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Accuracy Trends</h3>
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="rounded-md border px-2 py-1 text-xs bg-white border-slate-200 text-slate-700 dark:bg-slate-900/60 dark:border-slate-700/50 dark:text-white"
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
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Key Accuracy Heatmap</h3>
        <canvas ref={heatmapRef} width={700} height={200} className="w-full" data-testid="key-heatmap" />
      </div>

      {/* Session History */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recent Sessions</h3>
        {analytics.sessionHistory.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">No sessions recorded yet. Play your first song to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto" data-testid="session-history">
            {[...analytics.sessionHistory].reverse().slice(0, 20).map((session, i) => {
              const songName = SONG_CATALOG.find(s => s.id === session.songId)?.title ?? session.songId;
              return (
                <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                  i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-800/30'
                }`}>
                  <div>
                    <span className="text-sm text-slate-900 dark:text-white font-medium">{songName}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{session.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400 dark:text-slate-500">{new Date(session.date).toLocaleDateString()}</span>
                    <span className="text-slate-900 dark:text-white font-medium">{session.score.toLocaleString()}</span>
                    <span className="text-emerald-500">{Math.round(session.accuracy)}%</span>
                    <span className="text-slate-400 dark:text-slate-500">{Math.round(session.duration)}s</span>
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
