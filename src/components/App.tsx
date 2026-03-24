import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { AppMode, Difficulty, HighScore, GameConfig, MidiNoteEvent, NoteTimingData, PerformanceReport, Recording, Lesson, PlayerProfile, Friend } from '../types';
import { TIMING_WINDOWS, FALL_SPEEDS } from '../utils/constants';
import Header from './Header';
import SongLibrary from './SongLibrary';
import PianoKeyboard from './PianoKeyboard';
import SheetMusic from './SheetMusic';
import FallingNotes from './FallingNotes';
import ScoreDisplay from './ScoreDisplay';
import GameOverScreen from './GameOverScreen';
import DifficultySelector from './DifficultySelector';
import MidiConnection from './MidiConnection';
import PracticeTools from './PracticeTools';
import AIFeedback from './AIFeedback';
import Leaderboard from './Leaderboard';
import SocialFeed from './SocialFeed';
import Analytics from './Analytics';
import Curriculum from './Curriculum';
import Recorder from './Recorder';
import Profile from './Profile';
import { useMidi } from '../hooks/useMidi';
import { useSongLoader } from '../hooks/useSongLoader';
import { useGameEngine } from '../hooks/useGameEngine';
import { usePracticeTools } from '../hooks/usePracticeTools';
import { useTheme } from '../hooks/useTheme';
import { createInitialScore } from '../engine/scoring';
import { generatePerformanceReport, savePerformanceReport, getImprovementInsight } from '../engine/performanceAnalyzer';
import { timeToMeasure } from '../engine/performanceAnalyzer';
import { loadProfile, saveProfile, loadFriends, saveFriends, updateStreak, calculateXpFromScore, checkAchievements, generateWeeklyChallenge, levelFromXp } from '../engine/socialEngine';
import { loadAnalytics, saveAnalytics, recordSession } from '../engine/analyticsEngine';
import { saveRecording, generateRecordingId, createRecordingSession, startRecording, stopRecording, addRecordingEvent, getRecordingDuration } from '../engine/recordingEngine';
import { loadCompletedLessons } from '../data/curriculum';
import {
  Play, Pause, Music, Library, Volume2, Monitor, Settings as SettingsIcon,
} from 'lucide-react';

function loadHighScores(): Record<string, Record<Difficulty, HighScore>> {
  try {
    const data = localStorage.getItem('piano-hero-scores');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveHighScores(scores: Record<string, Record<Difficulty, HighScore>>) {
  try {
    localStorage.setItem('piano-hero-scores', JSON.stringify(scores));
  } catch (e) {
    console.error('[PianoHero] Failed to save high scores:', e);
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('library');
  const [highScores, setHighScores] = useState(loadHighScores);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [volume, setVolume] = useState(80);

  const { theme, toggleTheme } = useTheme();

  // New feature state
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [friends, setFriends] = useState<Friend[]>(loadFriends);
  const [analytics, setAnalytics] = useState(loadAnalytics);
  const [completedLessons] = useState(loadCompletedLessons);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [noteTimings, setNoteTimings] = useState<NoteTimingData[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<string[]>([]);
  const [recordingSession, setRecordingSession] = useState(createRecordingSession('', 'easy'));
  const [playbackRecording, setPlaybackRecording] = useState<Recording | null>(null);

  const weeklyChallenge = useMemo(() => generateWeeklyChallenge(), []);

  const { currentSong, currentNotes, loadSong, loadCustomSong } = useSongLoader();

  const practiceTools = usePracticeTools(currentSong?.bpm ?? 120);

  const gameConfig: GameConfig | null = currentSong
    ? {
        difficulty: selectedDifficulty,
        songId: currentSong.id,
        fallSpeed: FALL_SPEEDS[selectedDifficulty],
        timingWindows: TIMING_WINDOWS[selectedDifficulty],
      }
    : null;

  const {
    engineState,
    start: startGame,
    pause: pauseGameFn,
    resume: resumeGame,
    reset: resetGame,
    handleNote,
    gameState,
  } = useGameEngine(gameConfig, currentNotes, currentSong?.duration ?? 120, 600);

  const onMidiNoteOn = useCallback(
    (event: MidiNoteEvent) => {
      handleNote(event);

      if (engineState && engineState.gameState === 'playing' && currentSong) {
        const bestMatch = engineState.fallingNotes.find(
          n => !n.hit && n.midi === event.note && Math.abs((engineState.currentTime - n.time) * 1000) <= 300
        );
        if (bestMatch) {
          const deltaMs = (engineState.currentTime - bestMatch.time) * 1000;
          const measure = timeToMeasure(bestMatch.time, currentSong.bpm);
          const timing: NoteTimingData = {
            noteId: bestMatch.id,
            midi: bestMatch.midi,
            expectedTime: bestMatch.time,
            actualTime: engineState.currentTime,
            deltaMs,
            velocity: event.velocity,
            hand: bestMatch.hand,
            rating: bestMatch.rating || 'miss',
            measure,
          };
          setNoteTimings(prev => [...prev, timing]);
        }
      }

      if (recordingSession.isRecording) {
        setRecordingSession(prev => addRecordingEvent(prev, event.note, event.velocity, 'noteOn'));
      }
    },
    [handleNote, engineState, currentSong, recordingSession.isRecording],
  );

  const midi = useMidi(onMidiNoteOn);

  const handleSelectSong = useCallback(
    (songId: string, difficulty: Difficulty) => {
      // Auto-stop recording if active
      if (recordingSession.isRecording) {
        setRecordingSession(() => createRecordingSession('', 'easy'));
      }
      resetGame();
      loadSong(songId, difficulty);
      setSelectedDifficulty(difficulty);
      setMode('game');
      setPerformanceReport(null);
      setNoteTimings([]);
    },
    [loadSong, resetGame, recordingSession.isRecording],
  );

  const handleStartGame = useCallback(() => {
    setNoteTimings([]);
    setPerformanceReport(null);
    startGame();
  }, [startGame]);

  const handleRetry = useCallback(() => {
    setNoteTimings([]);
    setPerformanceReport(null);
    resetGame();
    setTimeout(() => startGame(), 100);
  }, [resetGame, startGame]);

  const handleBackToLibrary = useCallback(() => {
    resetGame();
    setPerformanceReport(null);
    setMode('library');
  }, [resetGame]);

  // Save high score and generate report when game completes
  useEffect(() => {
    if (gameState === 'complete' && engineState && currentSong) {
      const score = engineState.score;
      const existing = highScores[currentSong.id]?.[selectedDifficulty];
      if (!existing || score.points > existing.score) {
        const newScores = { ...highScores };
        if (!newScores[currentSong.id]) {
          newScores[currentSong.id] = {} as Record<Difficulty, HighScore>;
        }
        newScores[currentSong.id][selectedDifficulty] = {
          songId: currentSong.id,
          difficulty: selectedDifficulty,
          score: score.points,
          stars: score.stars,
          accuracy: score.accuracy,
          maxCombo: score.maxCombo,
          date: new Date().toISOString(),
        };
        setHighScores(newScores);
        saveHighScores(newScores);
      }

      const report = generatePerformanceReport(
        currentSong.id,
        selectedDifficulty,
        noteTimings,
        score.points,
        engineState.currentTime,
        currentSong.bpm,
      );
      setPerformanceReport(report);
      savePerformanceReport(report);

      const session = {
        songId: currentSong.id,
        difficulty: selectedDifficulty,
        date: new Date().toISOString(),
        score: score.points,
        accuracy: score.accuracy,
        duration: engineState.currentTime,
      };
      const updatedAnalytics = recordSession(analytics, session, noteTimings);
      setAnalytics(updatedAnalytics);
      saveAnalytics(updatedAnalytics);

      const xpEarned = calculateXpFromScore(score.points, score.accuracy, score.stars);
      const updatedProfile = updateStreak({
        ...profile,
        xp: profile.xp + xpEarned,
        level: levelFromXp(profile.xp + xpEarned),
        songsPlayed: profile.songsPlayed + 1,
        totalPracticeTime: profile.totalPracticeTime + engineState.currentTime / 60,
        songsMastered: score.stars >= 5 ? profile.songsMastered + 1 : profile.songsMastered,
      });

      const newUnlocks = checkAchievements(
        updatedProfile,
        highScores,
        score.maxCombo,
        score.accuracy,
        score.stars,
        selectedDifficulty,
      );
      setRecentUnlocks(newUnlocks);
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleKeyboardNoteOn = useCallback(
    (note: number) => {
      const event: MidiNoteEvent = {
        note,
        velocity: 100,
        timestamp: performance.now(),
        channel: 0,
      };
      onMidiNoteOn(event);
    },
    [onMidiNoteOn],
  );

  const handleUpdateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const handleAddFriend = useCallback((username: string) => {
    setFriends(prev => {
      const updated = [...prev, { username, avatarIndex: Math.floor(Math.random() * 12), level: Math.floor(Math.random() * 10) + 1, xp: Math.floor(Math.random() * 5000) }];
      saveFriends(updated);
      return updated;
    });
  }, []);

  const handleRemoveFriend = useCallback((username: string) => {
    setFriends(prev => {
      const updated = prev.filter(f => f.username !== username);
      saveFriends(updated);
      return updated;
    });
  }, []);

  const handleStartRecording = useCallback(() => {
    if (currentSong) {
      // Stop any existing recording first
      if (recordingSession.isRecording) {
        setRecordingSession(prev => stopRecording(prev));
      }
      setRecordingSession(startRecording(createRecordingSession(currentSong.id, selectedDifficulty)));
    }
  }, [currentSong, selectedDifficulty, recordingSession.isRecording]);

  const handleStopRecording = useCallback(() => {
    if (!recordingSession.isRecording) return;
    const stopped = stopRecording(recordingSession);
    // Only save recordings with actual events
    if (stopped.events.length > 0 && currentSong) {
      const recording: Recording = {
        id: generateRecordingId(),
        name: `${currentSong.title} — ${new Date().toLocaleTimeString()}`,
        songId: currentSong.id,
        difficulty: selectedDifficulty,
        date: new Date().toISOString(),
        duration: getRecordingDuration(stopped),
        events: stopped.events,
        score: engineState?.score.points ?? 0,
        accuracy: engineState?.score.accuracy ?? 0,
        journalNote: '',
      };
      saveRecording(recording);
    }
    setRecordingSession(createRecordingSession('', 'easy'));
  }, [recordingSession, currentSong, selectedDifficulty, engineState]);

  const handlePlayRecording = useCallback((recording: Recording) => {
    setPlaybackRecording(recording);
    setTimeout(() => setPlaybackRecording(null), recording.duration * 1000);
  }, []);

  const handleStartLesson = useCallback((lesson: Lesson) => {
    resetGame();
    practiceTools.resetPracticeTools();
    // Curriculum lessons use exerciseNotes — inject them as a custom song
    if (lesson.exerciseNotes && lesson.exerciseNotes.length > 0) {
      loadCustomSong({
        id: lesson.id,
        title: lesson.title,
        artist: 'Curriculum',
        bpm: lesson.exerciseBpm || 80,
        key: 'C',
        duration: Math.max(...lesson.exerciseNotes.map(n => n.time + n.duration), 30),
        notes: {
          easy: lesson.exerciseNotes,
          medium: lesson.exerciseNotes,
          hard: lesson.exerciseNotes,
          expert: lesson.exerciseNotes,
        },
      }, 'easy');
    } else {
      loadSong(lesson.id, 'easy');
    }
    setSelectedDifficulty('easy');
    setMode('game');
    setPerformanceReport(null);
    setNoteTimings([]);
  }, [loadSong, loadCustomSong, resetGame, practiceTools]);

  const handleModeChange = useCallback((newMode: AppMode) => {
    // Auto-stop recording if active when switching modes
    if (recordingSession.isRecording) {
      setRecordingSession(() => createRecordingSession('', 'easy'));
    }
    // Reset game engine when leaving game mode to prevent stale state
    if (newMode !== 'game') {
      resetGame();
      setPerformanceReport(null);
    }
    // Stop metronome when leaving practice mode
    if (mode === 'practice' && newMode !== 'practice') {
      practiceTools.resetPracticeTools();
    }
    setMode(newMode);
  }, [resetGame, recordingSession.isRecording, mode, practiceTools]);

  const improvementInsight = useMemo(() => {
    if (!currentSong) return null;
    return getImprovementInsight(analytics.sessionHistory, currentSong.id);
  }, [analytics.sessionHistory, currentSong]);

  const score = engineState?.score ?? createInitialScore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-hidden">
      <Header
        currentMode={mode}
        onModeChange={handleModeChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {mode === 'library' && (
          <SongLibrary onSelectSong={handleSelectSong} highScores={highScores} />
        )}

        {mode === 'practice' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Practice Mode</h2>
            {currentSong ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Sheet Music (wider) */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Music size={16} />
                    Playing: {currentSong.title} by {currentSong.artist}
                  </p>
                  <SheetMusic notes={currentNotes} currentTime={0} />
                  <PianoKeyboard
                    activeNotes={midi.activeNotes}
                    showNoteNames={showNoteNames}
                    onNoteOn={handleKeyboardNoteOn}
                  />
                </div>
                {/* Right: Practice Tools sidebar */}
                <div className="space-y-4">
                  <PracticeTools
                    state={practiceTools.state}
                    onTempoChange={practiceTools.setTempo}
                    onToggleLoop={practiceTools.toggleLoop}
                    onSetLoopRange={practiceTools.setLoopRange}
                    onToggleMetronome={practiceTools.toggleMetronome}
                    onToggleCountIn={practiceTools.toggleCountIn}
                    onToggleAutoSpeedUp={practiceTools.toggleAutoSpeedUp}
                    onAutoSpeedUpTargetChange={practiceTools.setAutoSpeedUpTarget}
                    metronomeTick={practiceTools.metronomeTick}
                  />
                  <Recorder
                    isRecording={recordingSession.isRecording}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onPlayRecording={handlePlayRecording}
                    currentRecordingDuration={getRecordingDuration(recordingSession)}
                    playbackRecording={playbackRecording}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Library size={48} className="text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Select a song from the Library to start practicing.
                </p>
                <button
                  onClick={() => setMode('library')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  <Library size={16} />
                  Go to Library
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'game' && (
          <div className="flex flex-col">
            {gameState === 'complete' && engineState ? (
              <div className="space-y-6">
                <GameOverScreen
                  score={engineState.score}
                  songTitle={currentSong?.title ?? 'Unknown'}
                  onRetry={handleRetry}
                  onBackToLibrary={handleBackToLibrary}
                />
                {performanceReport && (
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                    <AIFeedback
                      report={performanceReport}
                      improvementInsight={improvementInsight}
                      onClose={() => setPerformanceReport(null)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <ScoreDisplay
                  score={score}
                  lastRating={engineState?.lastRating}
                  songProgress={
                    currentSong
                      ? (engineState?.currentTime ?? 0) / currentSong.duration
                      : 0
                  }
                />

                <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-4">
                  <DifficultySelector
                    selected={selectedDifficulty}
                    onSelect={(d) => {
                      // Reset game when changing difficulty during gameplay
                      if (gameState === 'playing' || gameState === 'paused' || gameState === 'countdown') {
                        resetGame();
                      }
                      setSelectedDifficulty(d);
                      if (currentSong) loadSong(currentSong.id, d);
                    }}
                  />

                  {gameState === 'idle' && (
                    <button
                      onClick={handleStartGame}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
                      disabled={!currentSong}
                    >
                      <Play size={18} />
                      Play
                    </button>
                  )}
                  {gameState === 'playing' && (
                    <button
                      onClick={pauseGameFn}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg border border-slate-600 active:scale-95 transition-all"
                    >
                      <Pause size={18} />
                      Pause
                    </button>
                  )}
                  {gameState === 'paused' && (
                    <button
                      onClick={resumeGame}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg active:scale-95 transition-all"
                    >
                      <Play size={18} />
                      Resume
                    </button>
                  )}
                </div>

                <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                  <FallingNotes
                    fallingNotes={engineState?.fallingNotes ?? []}
                    gameState={gameState}
                    countdown={engineState?.countdown ?? 0}
                  />
                </div>

                <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
                  <PianoKeyboard
                    activeNotes={midi.activeNotes}
                    showNoteNames={showNoteNames}
                    onNoteOn={handleKeyboardNoteOn}
                  />
                </div>

                {!currentSong && gameState === 'idle' && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Music size={48} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 text-center">
                      Select a song from the Library to play
                    </p>
                    <button
                      onClick={() => setMode('library')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Library size={16} />
                      Go to Library
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'curriculum' && (
          <Curriculum
            completedLessons={completedLessons}
            onStartLesson={handleStartLesson}
          />
        )}

        {mode === 'analytics' && (
          <Analytics analytics={analytics} />
        )}

        {mode === 'leaderboard' && (
          <div className="space-y-6">
            <Leaderboard
              highScores={highScores}
              friends={friends}
              playerName={profile.username}
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
            />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
              <SocialFeed
                weeklyChallenge={weeklyChallenge}
                unlockedBadges={profile.badges}
                recentUnlocks={recentUnlocks}
              />
            </div>
          </div>
        )}

        {mode === 'profile' && (
          <Profile
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {mode === 'settings' && (
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6" data-testid="settings-page">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
              <SettingsIcon size={24} className="text-cyan-500" />
              Settings
            </h2>

            <MidiConnection
              devices={midi.devices}
              selectedDevice={midi.selectedDevice}
              isConnected={midi.isConnected}
              isSupported={midi.isSupported}
              onSelectDevice={midi.selectDevice}
            />

            <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Monitor size={16} />
                Display
              </h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-900 dark:text-white">Show Note Names</span>
                <input
                  type="checkbox"
                  checked={showNoteNames}
                  onChange={(e) => setShowNoteNames(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  data-testid="note-names-toggle"
                />
              </label>
            </div>

            <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Volume2 size={16} />
                Audio
              </h3>
              <label className="flex items-center justify-between gap-4">
                <span className="text-slate-900 dark:text-white shrink-0">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-cyan-500"
                  data-testid="volume-slider"
                />
                <span className="text-slate-500 dark:text-slate-400 text-sm w-12 text-right">{volume}%</span>
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
