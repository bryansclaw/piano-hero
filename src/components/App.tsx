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
import { createInitialScore } from '../engine/scoring';
import { generatePerformanceReport, savePerformanceReport, getImprovementInsight } from '../engine/performanceAnalyzer';
import { timeToMeasure } from '../engine/performanceAnalyzer';
import { loadProfile, saveProfile, loadFriends, saveFriends, updateStreak, calculateXpFromScore, checkAchievements, generateWeeklyChallenge, levelFromXp } from '../engine/socialEngine';
import { loadAnalytics, saveAnalytics, recordSession } from '../engine/analyticsEngine';
import { saveRecording, generateRecordingId, createRecordingSession, startRecording, stopRecording, addRecordingEvent, getRecordingDuration } from '../engine/recordingEngine';
import { loadCompletedLessons } from '../data/curriculum';

function loadHighScores(): Record<string, Record<Difficulty, HighScore>> {
  try {
    const data = localStorage.getItem('piano-hero-scores');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveHighScores(scores: Record<string, Record<Difficulty, HighScore>>) {
  localStorage.setItem('piano-hero-scores', JSON.stringify(scores));
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('library');
  const [highScores, setHighScores] = useState(loadHighScores);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [volume, setVolume] = useState(80);

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

  const { currentSong, currentNotes, loadSong } = useSongLoader();

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

      // Track note timing for performance analysis
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

      // Recording
      if (recordingSession.isRecording) {
        setRecordingSession(prev => addRecordingEvent(prev, event.note, event.velocity, 'noteOn'));
      }
    },
    [handleNote, engineState, currentSong, recordingSession.isRecording],
  );

  const midi = useMidi(onMidiNoteOn);

  const handleSelectSong = useCallback(
    (songId: string, difficulty: Difficulty) => {
      loadSong(songId, difficulty);
      setSelectedDifficulty(difficulty);
      setMode('game');
      setPerformanceReport(null);
      setNoteTimings([]);
    },
    [loadSong],
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

      // Generate performance report
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

      // Update analytics
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

      // Update profile: XP, streak, achievements
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

  // Handle on-screen keyboard clicks as MIDI input
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

  // Profile updates
  const handleUpdateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      saveProfile(updated);
      return updated;
    });
  }, []);

  // Friends management
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

  // Recording
  const handleStartRecording = useCallback(() => {
    if (currentSong) {
      setRecordingSession(startRecording(createRecordingSession(currentSong.id, selectedDifficulty)));
    }
  }, [currentSong, selectedDifficulty]);

  const handleStopRecording = useCallback(() => {
    const stopped = stopRecording(recordingSession);
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
    // Auto-clear after duration
    setTimeout(() => setPlaybackRecording(null), recording.duration * 1000);
  }, []);

  // Curriculum lesson start
  const handleStartLesson = useCallback((lesson: Lesson) => {
    // Load lesson exercise as a custom song
    loadSong(lesson.id, 'easy');
    setSelectedDifficulty('easy');
    setMode('game');
  }, [loadSong]);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
    if (newMode !== 'game') {
      setPerformanceReport(null);
    }
  }, []);

  const improvementInsight = useMemo(() => {
    if (!currentSong) return null;
    return getImprovementInsight(analytics.sessionHistory, currentSong.id);
  }, [analytics.sessionHistory, currentSong]);

  const score = engineState?.score ?? createInitialScore();

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col">
      <Header currentMode={mode} onModeChange={handleModeChange} />

      <main className="flex-1">
        {mode === 'library' && (
          <SongLibrary onSelectSong={handleSelectSong} highScores={highScores} />
        )}

        {mode === 'practice' && (
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Practice Mode</h2>
            {currentSong ? (
              <>
                <p className="text-[#b0b0d0]">
                  Playing: {currentSong.title} by {currentSong.artist}
                </p>
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
                <SheetMusic notes={currentNotes} currentTime={0} />
                <PianoKeyboard
                  activeNotes={midi.activeNotes}
                  showNoteNames={showNoteNames}
                  onNoteOn={handleKeyboardNoteOn}
                />
              </>
            ) : (
              <p className="text-[#b0b0d0]">
                Select a song from the Library to start practicing.
              </p>
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
                  <div className="px-4 pb-6">
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
                <div className="relative">
                  <ScoreDisplay
                    score={score}
                    lastRating={engineState?.lastRating}
                    songProgress={
                      currentSong
                        ? (engineState?.currentTime ?? 0) / currentSong.duration
                        : 0
                    }
                  />
                </div>

                <div className="px-4 py-2 flex items-center gap-4">
                  <DifficultySelector
                    selected={selectedDifficulty}
                    onSelect={(d) => {
                      setSelectedDifficulty(d);
                      if (currentSong) loadSong(currentSong.id, d);
                    }}
                  />

                  {gameState === 'idle' && (
                    <button
                      onClick={handleStartGame}
                      className="px-6 py-2 bg-[#e040fb] text-white font-bold rounded-xl hover:bg-[#e040fb]/80 transition-all"
                      disabled={!currentSong}
                    >
                      ▶ Play
                    </button>
                  )}
                  {gameState === 'playing' && (
                    <button
                      onClick={pauseGameFn}
                      className="px-6 py-2 bg-[#40c4ff] text-white font-bold rounded-xl hover:bg-[#40c4ff]/80 transition-all"
                    >
                      ⏸ Pause
                    </button>
                  )}
                  {gameState === 'paused' && (
                    <button
                      onClick={resumeGame}
                      className="px-6 py-2 bg-[#69f0ae] text-black font-bold rounded-xl hover:bg-[#69f0ae]/80 transition-all"
                    >
                      ▶ Resume
                    </button>
                  )}
                </div>

                <FallingNotes
                  fallingNotes={engineState?.fallingNotes ?? []}
                  gameState={gameState}
                  countdown={engineState?.countdown ?? 0}
                />

                <div className="px-4 py-2">
                  <PianoKeyboard
                    activeNotes={midi.activeNotes}
                    showNoteNames={showNoteNames}
                    onNoteOn={handleKeyboardNoteOn}
                  />
                </div>
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
            <div className="px-6 pb-6">
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
          <div className="p-6 space-y-6 max-w-lg" data-testid="settings-page">
            <h2 className="text-2xl font-bold">Settings</h2>

            <MidiConnection
              devices={midi.devices}
              selectedDevice={midi.selectedDevice}
              isConnected={midi.isConnected}
              isSupported={midi.isSupported}
              onSelectDevice={midi.selectDevice}
            />

            <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] space-y-4">
              <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
                Display
              </h3>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-white">Show Note Names</span>
                <input
                  type="checkbox"
                  checked={showNoteNames}
                  onChange={(e) => setShowNoteNames(e.target.checked)}
                  className="w-5 h-5 accent-[#e040fb]"
                  data-testid="note-names-toggle"
                />
              </label>
            </div>

            <div className="bg-[#1a1a3e] rounded-xl p-4 border border-[#2a2a5e] space-y-4">
              <h3 className="text-sm font-semibold text-[#b0b0d0] uppercase tracking-wider">
                Audio
              </h3>
              <label className="flex items-center justify-between">
                <span className="text-white">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-48 accent-[#e040fb]"
                  data-testid="volume-slider"
                />
                <span className="text-[#b0b0d0] text-sm w-12 text-right">{volume}%</span>
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
