import React, { useState } from 'react';
import type { Recording } from '../types';
import {
  loadRecordings, deleteRecording, updateRecordingJournal,
  exportRecordingSummary,
} from '../engine/recordingEngine';
import { SONG_CATALOG } from '../data/songCatalog';
import { Circle, Square, Play, Pencil, Clipboard, Trash2, Mic, Archive } from 'lucide-react';

interface RecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: (recording: Recording) => void;
  currentRecordingDuration?: number;
  playbackRecording?: Recording | null;
  playbackProgress?: number; // 0-1
}

const Recorder: React.FC<RecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  currentRecordingDuration = 0,
  playbackRecording,
  playbackProgress = 0,
}) => {
  const [recordings, setRecordings] = useState(() => loadRecordings());
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');

  const refreshRecordings = () => setRecordings(loadRecordings());

  const handleDelete = (id: string) => {
    deleteRecording(id);
    refreshRecordings();
  };

  const handleSaveJournal = (id: string) => {
    updateRecordingJournal(id, journalText);
    setEditingJournalId(null);
    refreshRecordings();
  };

  const handleExport = (recording: Recording) => {
    const summary = exportRecordingSummary(recording);
    navigator.clipboard.writeText(summary).catch(() => {
      const el = document.createElement('textarea');
      el.value = summary;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  };

  return (
    <div className="space-y-4" data-testid="recorder">
      {/* Recording Controls */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          <Mic size={16} />
          Recording
        </h3>
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 active:scale-95 transition-all"
              data-testid="record-btn"
            >
              <Circle size={14} className="fill-white" />
              Record
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-medium rounded-lg animate-pulse active:scale-95 transition-all"
              data-testid="stop-btn"
            >
              <Square size={14} className="fill-white" />
              Stop ({currentRecordingDuration.toFixed(1)}s)
            </button>
          )}

          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm text-rose-500">Recording...</span>
            </div>
          )}
        </div>
      </div>

      {/* Playback progress */}
      {playbackRecording && (
        <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-cyan-200 dark:border-cyan-500/30" data-testid="playback-panel">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-medium">
              <Play size={14} className="text-cyan-500" />
              Playing: {playbackRecording.name}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {Math.round(playbackProgress * playbackRecording.duration)}s / {Math.round(playbackRecording.duration)}s
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-900/60 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-cyan-500 transition-all"
              style={{ width: `${playbackProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recording Library */}
      <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          <Archive size={16} />
          Recording Library ({recordings.length})
        </h3>

        {recordings.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">No recordings yet. Start playing and hit Record!</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto" data-testid="recording-list">
            {[...recordings].reverse().map(recording => {
              const songName = SONG_CATALOG.find(s => s.id === recording.songId)?.title ?? recording.songId;
              return (
                <div key={recording.id} className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3 space-y-2" data-testid="recording-item">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-slate-900 dark:text-white font-medium">{recording.name}</span>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {songName} &bull; {recording.difficulty} &bull; {new Date(recording.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-900 dark:text-white">{recording.score.toLocaleString()}</span>
                      <span className="text-emerald-500">{recording.accuracy}%</span>
                    </div>
                  </div>

                  {/* Journal note */}
                  {editingJournalId === recording.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={journalText}
                        onChange={(e) => setJournalText(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 rounded-md border px-2 py-1 text-xs bg-white border-slate-200 text-slate-900 dark:bg-slate-800/60 dark:border-slate-700/50 dark:text-white"
                        data-testid="journal-input"
                      />
                      <button
                        onClick={() => handleSaveJournal(recording.id)}
                        className="text-xs text-emerald-500 font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : recording.journalNote ? (
                    <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 italic">
                      <Pencil size={10} />
                      {recording.journalNote}
                    </p>
                  ) : null}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPlayRecording(recording)}
                      className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-md text-xs font-bold"
                      data-testid="play-recording-btn"
                    >
                      <Play size={12} />
                      Play
                    </button>
                    <button
                      onClick={() => {
                        setEditingJournalId(recording.id);
                        setJournalText(recording.journalNote || '');
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-md text-xs font-bold"
                    >
                      <Pencil size={12} />
                      Note
                    </button>
                    <button
                      onClick={() => handleExport(recording)}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-bold"
                    >
                      <Clipboard size={12} />
                      Copy
                    </button>
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md text-xs font-bold"
                      data-testid="delete-recording-btn"
                    >
                      <Trash2 size={12} />
                    </button>
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

export default Recorder;
