import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { AppMode, Difficulty, HighScore, GameConfig, MidiNoteEvent, NoteTimingData, PerformanceReport, Recording, Lesson, PlayerProfile, Friend } from '../types';
import { TIMING_WINDOWS, FALL_SPEEDS } from '../utils/constants';
import ErrorBoundary from './ErrorBoundary';
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
import { useAuth } from '../contexts/AuthContext';
import { useMidi } from '../hooks/useMidi';
import { useSongLoader } from '../hooks/useSongLoader';
import { useGameEngine } from '../hooks/useGameEngine';
import { usePracticeTools } from '../hooks/usePracticeTools';
import { usePianoAudio } from '../hooks/usePianoAudio';
import { useTheme } from '../hooks/useTheme';
import { createInitialScore } from '../engine/scoring';
import { generatePerformanceReport, savePerformanceReport, getImprovementInsight } from '../engine/performanceAnalyzer';
import { timeToMeasure } from '../engine/performanceAnalyzer';
import { updateStreak, calculateXpFromScore, checkAchievements, generateWeeklyChallenge, levelFromXp, createDefaultProfile } from '../engine/socialEngine';
import { getNextLesson, getCurriculum } from '../data/curriculum';
import NextLessonCountdown from './NextLessonCountdown';
import { createRecordingSession, startRecording, stopRecording, addRecordingEvent, getRecordingDuration, generateRecordingId } from '../engine/recordingEngine';


// API imports
import { getScores as apiGetScores, saveScore as apiSaveScore } from '../api/scores';
import { getProfile as apiGetProfile, updateProfileAfterGame as apiUpdateProfile } from '../api/profile';
import { getAnalytics as apiGetAnalytics, recordSession as apiRecordSession, updateKeyAccuracy as apiUpdateKeyAccuracy } from '../api/analytics';
import { getFriends as apiGetFriends, addFriend as apiAddFriend, removeFriend as apiRemoveFriend } from '../api/friends';
import { saveRecording as apiSaveRecording } from '../api/recordings';
import { getCurriculumProgress as apiGetCurriculum } from '../api/curriculum';

import {
  Play, Pause, Music, Library, Volume2, Monitor, Settings as SettingsIcon,
} from 'lucide-react';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<AppMode>('library');
  const [highScores, setHighScores] = useState<Record<string, Record<Difficulty, HighScore>>>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [volume, setVolume] = useState(80);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // New feature state
  const [profile, setProfile] = useState<PlayerProfile>(createDefaultProfile);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [analytics, setAnalytics] = useState({
    dailyPractice: [] as any[],
    keyAccuracy: [] as any[],
    sessionHistory: [] as any[],
    songAccuracyTrends: {} as Record<string, any[]>,
  });
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [noteTimings, setNoteTimings] = useState<NoteTimingData[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<string[]>([]);
  const [recordingSession, setRecordingSession] = useState(createRecordingSession('', 'easy'));
  const [playbackRecording, setPlaybackRecording] = useState<Recording | null>(null);

  const weeklyChallenge = useMemo(() => generateWeeklyChallenge(), []);

  // Load data from API on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [scoresRes, profileRes, analyticsRes, friendsRes, curriculumRes] = await Promise.all([
          apiGetScores(),
          apiGetProfile(),
          apiGetAnalytics(),
          apiGetFriends(),
          apiGetCurriculum(),
        ]);

        if (cancelled) return;

        if (scoresRes.success && scoresRes.data) {
          setHighScores(scoresRes.data);
        }
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (analyticsRes.success && analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
        if (friendsRes.success && friendsRes.data) {
          setFriends(friendsRes.data);
        }
        if (curriculumRes.success && curriculumRes.data) {
          setCompletedLessons(new Set(curriculumRes.data.completedLessons));
        }
      } catch (err) {
        console.error('[PianoHero] Failed to load data from API, using defaults:', err);
      } finally {
        if (!cancelled) setDataLoaded(true);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

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
  const pianoAudio = usePianoAudio(volume);

  // Track locally-pressed notes (mouse/keyboard clicks) for visual feedback
  const [localActiveNotes, setLocalActiveNotes] = useState<Set<number>>(new Set());

  // Merged active notes = MIDI hardware + local mouse/keyboard
  const mergedActiveNotes = useMemo(() => {
    const merged = new Set(midi.activeNotes);
    for (const n of localActiveNotes) merged.add(n);
    return merged;
  }, [midi.activeNotes, localActiveNotes]);

  // Auto-pause game when MIDI disconnects
  useEffect(() => {
    if (midi.wasDisconnected && gameState === 'playing') {
      pauseGameFn();
    }
  }, [midi.wasDisconnected, gameState, pauseGameFn]);

  const handleSelectSong = useCallback(
    (songId: string, difficulty: Difficulty) => {
      // Auto-stop recording if active
      if (recordingSession.isRecording) {
        setRecordingSession(() => createRecordingSession('', 'easy'));
      }
      resetGame();
      setCurrentLessonId(null);
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
    setCurrentLessonId(null);
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

        // Save to API
        apiSaveScore({
          songId: currentSong.id,
          difficulty: selectedDifficulty,
          score: score.points,
          stars: score.stars,
          accuracy: score.accuracy,
          maxCombo: score.maxCombo,
        }).catch(err => console.error('[PianoHero] Failed to save score:', err));
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

      // Record analytics session via API
      apiRecordSession({
        songId: currentSong.id,
        difficulty: selectedDifficulty,
        score: score.points,
        accuracy: score.accuracy,
        duration: engineState.currentTime,
      }).catch(err => console.error('[PianoHero] Failed to record session:', err));

      // Update key accuracy via API
      if (noteTimings.length > 0) {
        const keyUpdates = new Map<number, { correct: number; total: number }>();
        for (const t of noteTimings) {
          const existing = keyUpdates.get(t.midi) || { correct: 0, total: 0 };
          existing.total += 1;
          if (t.rating !== 'miss') existing.correct += 1;
          keyUpdates.set(t.midi, existing);
        }
        const keys = Array.from(keyUpdates.entries()).map(([midi, data]) => ({
          midi, correct: data.correct, total: data.total,
        }));
        apiUpdateKeyAccuracy(keys).catch(err => console.error('[PianoHero] Failed to update key accuracy:', err));
      }

      // Update local analytics state
      const session = {
        songId: currentSong.id,
        difficulty: selectedDifficulty,
        date: new Date().toISOString(),
        score: score.points,
        accuracy: score.accuracy,
        duration: engineState.currentTime,
      };
      setAnalytics(prev => {
        const updated = { ...prev };
        updated.sessionHistory = [...updated.sessionHistory, session].slice(-200);
        return updated;
      });

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

      // Save profile to API
      apiUpdateProfile(updatedProfile).catch(err => console.error('[PianoHero] Failed to save profile:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const handleKeyboardNoteOn = useCallback(
    (note: number) => {
      // Visual feedback — add to local active notes
      setLocalActiveNotes(prev => {
        const next = new Set(prev);
        next.add(note);
        return next;
      });

      // Play sound
      pianoAudio.noteOn(note);

      // Feed into game engine
      const event: MidiNoteEvent = {
        note,
        velocity: 100,
        timestamp: performance.now(),
        channel: 0,
      };
      onMidiNoteOn(event);
    },
    [onMidiNoteOn, pianoAudio],
  );

  const handleKeyboardNoteOff = useCallback(
    (note: number) => {
      setLocalActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
      pianoAudio.noteOff(note);
    },
    [pianoAudio],
  );

  const handleUpdateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      // Save to API
      apiUpdateProfile(updated).catch(err => console.error('[PianoHero] Failed to save profile:', err));
      return updated;
    });
  }, []);

  const handleAddFriend = useCallback((username: string) => {
    apiAddFriend(username).then(res => {
      if (res.success && res.data) {
        setFriends(prev => [...prev, res.data!]);
      }
    }).catch(err => console.error('[PianoHero] Failed to add friend:', err));
  }, []);

  const handleRemoveFriend = useCallback((username: string) => {
    apiRemoveFriend(username).then(res => {
      if (res.success) {
        setFriends(prev => prev.filter(f => f.username !== username));
      }
    }).catch(err => console.error('[PianoHero] Failed to remove friend:', err));
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
      // Save to API
      apiSaveRecording(recording).catch(err => console.error('[PianoHero] Failed to save recording:', err));
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
    setCurrentLessonId(lesson.id);
    // Curriculum lessons use exerciseNotes — inject them as a custom song
    if (lesson.exerciseNotes && lesson.exerciseNotes.length > 0) {
      loadCustomSong({
        id: lesson.id,
        title: lesson.title,
        artist: 'Curriculum',
        bpm: lesson.exerciseBpm || 80,
        key: 'C',
        duration: Math.max(...lesson.exerciseNotes.map(n => n.time + n.duration)) + 3,
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

  // Compute next lesson for autoplay (Netflix-style)
  const nextLesson = useMemo(() => {
    if (!currentLessonId) return null;
    // Add current lesson to completed set for next-lesson lookup
    const updatedCompleted = new Set(completedLessons);
    updatedCompleted.add(currentLessonId);
    return getNextLesson(currentLessonId, updatedCompleted);
  }, [currentLessonId, completedLessons]);

  // Get the current lesson's passing accuracy threshold
  const currentLessonPassingAccuracy = useMemo((): number | null => {
    if (!currentLessonId) return null;
    const curriculum = getCurriculum();
    for (const path of curriculum) {
      const lesson = path.lessons.find(l => l.id === currentLessonId);
      if (lesson) return lesson.passingAccuracy;
    }
    return null;
  }, [currentLessonId]);

  // Whether the completed lesson passed (met accuracy threshold)
  const lessonPassed = useMemo(() => {
    if (!currentLessonId || gameState !== 'complete' || !engineState || currentLessonPassingAccuracy == null) return false;
    return engineState.score.accuracy >= currentLessonPassingAccuracy;
  }, [currentLessonId, gameState, engineState, currentLessonPassingAccuracy]);

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-2xl animate-pulse">
            <span className="text-3xl">🎹</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-hidden">
      <Header
        currentMode={mode}
        onModeChange={handleModeChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* MIDI Disconnection Overlay */}
      {midi.wasDisconnected && (mode === 'game' || mode === 'practice') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="midi-disconnect-overlay">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm mx-4 text-center space-y-4 border border-slate-200 dark:border-slate-700">
            <div className="text-4xl">🔌</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">MIDI Device Disconnected</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your MIDI device was disconnected. Reconnect it and click Resume, or continue with the on-screen keyboard.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  midi.clearDisconnected();
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Use Keyboard
              </button>
              <button
                onClick={() => {
                  midi.clearDisconnected();
                  if (gameState === 'paused') resumeGame();
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
                disabled={!midi.isConnected}
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

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
                    activeNotes={mergedActiveNotes}
                    showNoteNames={showNoteNames}
                    onNoteOn={handleKeyboardNoteOn}
                    onNoteOff={handleKeyboardNoteOff}
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
                  isLesson={!!currentLessonId}
                  lessonPassed={lessonPassed}
                  passingAccuracy={currentLessonPassingAccuracy}
                  onBackToCurriculum={() => {
                    resetGame();
                    setPerformanceReport(null);
                    setCurrentLessonId(null);
                    setMode('curriculum');
                  }}
                />
                {/* Netflix-style autoplay for curriculum lessons */}
                {lessonPassed && nextLesson && (
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <NextLessonCountdown
                      nextLesson={nextLesson}
                      countdownSeconds={15}
                      onStartLesson={handleStartLesson}
                      onCancel={() => {
                        setCurrentLessonId(null);
                        setMode('curriculum');
                      }}
                    />
                  </div>
                )}
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
                  passingAccuracy={currentLessonPassingAccuracy}
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
                    activeNotes={mergedActiveNotes}
                    showNoteNames={showNoteNames}
                    onNoteOn={handleKeyboardNoteOn}
                    onNoteOff={handleKeyboardNoteOff}
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

            {/* Account section */}
            <div className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Account
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 dark:text-white font-medium">{user?.username}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live region for screen reader score announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="score-announcer"
      >
        {gameState === 'complete' && engineState && (
          <span>
            Game complete! Score: {engineState.score.points.toLocaleString()}.
            Accuracy: {engineState.score.accuracy}%.
            {engineState.score.stars} stars.
          </span>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;
