import React, { useState } from 'react';
import type { Recording } from '../types';
import {
  loadRecordings, deleteRecording, updateRecordingJournal,
  exportRecordingSummary,
} from '../engine/recordingEngine';
import { SONG_CATALOG } from '../data/songCatalog';

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
      // Fallback: create a temporary textarea
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
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider mb-3">🎙️ Recording</h3>
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="px-4 py-2 bg-[#ff4444] text-white font-bold rounded-lg hover:bg-[#ff4444]/80 transition-all flex items-center gap-2"
              data-testid="record-btn"
            >
              <span className="w-3 h-3 rounded-full bg-white" />
              Record
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="px-4 py-2 bg-[#ff4444] text-white font-bold rounded-lg animate-pulse flex items-center gap-2"
              data-testid="stop-btn"
            >
              <span className="w-3 h-3 bg-white" />
              Stop ({currentRecordingDuration.toFixed(1)}s)
            </button>
          )}

          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4444] animate-pulse" />
              <span className="text-sm text-[#ff4444]">Recording...</span>
            </div>
          )}
        </div>
      </div>

      {/* Playback progress */}
      {playbackRecording && (
        <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#40c4ff]/30" data-testid="playback-panel">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-medium">
              ▶ Playing: {playbackRecording.name}
            </span>
            <span className="text-xs text-[#7070a0]">
              {Math.round(playbackProgress * playbackRecording.duration)}s / {Math.round(playbackRecording.duration)}s
            </span>
          </div>
          <div className="w-full bg-[#0a0a1a] rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#40c4ff] transition-all"
              style={{ width: `${playbackProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recording Library */}
      <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e]">
        <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider mb-3">
          📼 Recording Library ({recordings.length})
        </h3>

        {recordings.length === 0 ? (
          <p className="text-[#7070a0] text-sm">No recordings yet. Start playing and hit Record!</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto" data-testid="recording-list">
            {[...recordings].reverse().map(recording => {
              const songName = SONG_CATALOG.find(s => s.id === recording.songId)?.title ?? recording.songId;
              return (
                <div key={recording.id} className="bg-[#0a0a1a] rounded-lg p-3 space-y-2" data-testid="recording-item">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white font-medium">{recording.name}</span>
                      <div className="text-xs text-[#7070a0]">
                        {songName} • {recording.difficulty} • {new Date(recording.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white">{recording.score.toLocaleString()}</span>
                      <span className="text-[#69f0ae]">{recording.accuracy}%</span>
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
                        className="flex-1 bg-[#1a1a3e] border border-[#2a2a5e] rounded px-2 py-1 text-white text-xs"
                        data-testid="journal-input"
                      />
                      <button
                        onClick={() => handleSaveJournal(recording.id)}
                        className="text-xs text-[#69f0ae] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : recording.journalNote ? (
                    <p className="text-xs text-[#b0b0d0] italic">📝 {recording.journalNote}</p>
                  ) : null}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPlayRecording(recording)}
                      className="px-3 py-1 bg-[#40c4ff]/20 text-[#40c4ff] rounded text-xs font-bold"
                      data-testid="play-recording-btn"
                    >
                      ▶ Play
                    </button>
                    <button
                      onClick={() => {
                        setEditingJournalId(recording.id);
                        setJournalText(recording.journalNote || '');
                      }}
                      className="px-3 py-1 bg-[#e040fb]/20 text-[#e040fb] rounded text-xs font-bold"
                    >
                      📝 Note
                    </button>
                    <button
                      onClick={() => handleExport(recording)}
                      className="px-3 py-1 bg-[#69f0ae]/20 text-[#69f0ae] rounded text-xs font-bold"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="px-3 py-1 bg-[#ff4444]/20 text-[#ff4444] rounded text-xs font-bold"
                      data-testid="delete-recording-btn"
                    >
                      🗑️
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
