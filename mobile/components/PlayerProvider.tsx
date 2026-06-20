import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import type { Episode } from 'constants/types';
import { useUpdateProgressMutation } from 'store/api';

/** Frequently-changing playback state (re-renders on every status tick). */
export interface PlayerState {
  episode: Episode | null;
  isPlaying: boolean;
  isBuffering: boolean;
  /** Current position in seconds. */
  position: number;
  /** Total duration in seconds (from the loaded media, falls back to metadata). */
  duration: number;
  rate: number;
}

/** Stable controls (identity never changes → consumers don't re-render on ticks). */
export interface PlayerActions {
  playEpisode: (ep: Episode) => void;
  toggle: () => void;
  seekTo: (sec: number) => void;
  skip: (deltaSec: number) => void;
  setRate: (rate: number) => void;
  close: () => void;
}

export const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2];

const StateContext = createContext<PlayerState | null>(null);
const ActionsContext = createContext<PlayerActions | null>(null);

// Save listening position to the server at most this often while playing.
const SAVE_EVERY_SEC = 10;

export function PlayerProvider({ children }: { children: ReactNode }) {
  // One player for the whole app, created once.
  const playerRef = useRef<AudioPlayer | null>(null);
  if (!playerRef.current) {
    playerRef.current = createAudioPlayer(null, { updateInterval: 500 });
  }

  const [state, setState] = useState<PlayerState>({
    episode: null,
    isPlaying: false,
    isBuffering: false,
    position: 0,
    duration: 0,
    rate: 1,
  });

  // Refs the status listener / actions read without re-subscribing.
  const episodeRef = useRef<Episode | null>(null);
  const rateRef = useRef(1);
  const lastSavedRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);

  const [updateProgress] = useUpdateProgressMutation();
  const updateProgressRef = useRef(updateProgress);
  updateProgressRef.current = updateProgress;

  const saveProgress = useCallback((positionSec: number, completed = false) => {
    const ep = episodeRef.current;
    if (!ep) return;
    updateProgressRef.current({ id: ep.id, positionSec: Math.floor(positionSec), completed });
  }, []);

  useEffect(() => {
    const player = playerRef.current!;
    // Keep playing through the silent switch and in the background.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});

    const sub = player.addListener('playbackStatusUpdate', (s: AudioStatus) => {
      // currentTime can be undefined/NaN on some frames — coalesce once.
      const pos = Number.isFinite(s.currentTime) ? s.currentTime : 0;

      // Apply a pending resume once the media is actually loaded.
      if (s.isLoaded && pendingSeekRef.current != null) {
        const target = pendingSeekRef.current;
        pendingSeekRef.current = null;
        player.seekTo(target).catch(() => {});
      }

      setState((prev) => ({
        ...prev,
        isPlaying: s.playing,
        isBuffering: s.isBuffering,
        position: pos,
        duration: s.duration && s.duration > 0 ? s.duration : prev.duration,
      }));

      // Throttled progress persistence (never persist a NaN position).
      if (s.isLoaded && pos - lastSavedRef.current >= SAVE_EVERY_SEC) {
        lastSavedRef.current = pos;
        saveProgress(pos);
      }

      if (s.didJustFinish) {
        lastSavedRef.current = 0;
        saveProgress(0, true);
      }
    });

    return () => {
      sub.remove();
      player.remove();
    };
  }, [saveProgress]);

  const actions = useMemo<PlayerActions>(
    () => ({
      playEpisode: (ep) => {
        const player = playerRef.current!;
        if (!ep.audioUrl) return;

        // Same episode already loaded → just resume.
        if (episodeRef.current?.id === ep.id) {
          player.play();
          return;
        }

        // Persist the outgoing episode's position before switching.
        if (episodeRef.current) saveProgress(player.currentTime);

        const startAt = ep.progressSec && ep.progressSec > 2 ? ep.progressSec : 0;
        episodeRef.current = ep;
        lastSavedRef.current = startAt;
        pendingSeekRef.current = startAt > 0 ? startAt : null;

        setState((prev) => ({
          ...prev,
          episode: ep,
          position: startAt,
          duration: ep.durationSec || 0,
          isBuffering: true,
        }));

        player.replace({ uri: ep.audioUrl });
        try {
          player.setPlaybackRate(rateRef.current);
        } catch {
          // rate applies once loaded
        }
        // Show transport controls on the lock screen / notification shade so the
        // user can control playback from outside the app while it plays in the
        // background.
        try {
          player.setActiveForLockScreen(
            true,
            { title: ep.title, artist: ep.topic, albumTitle: 'Hey Podcast' },
            { showSeekForward: true, showSeekBackward: true }
          );
        } catch {
          // lock-screen controls unavailable on this platform/build
        }
        player.play();
      },

      toggle: () => {
        const player = playerRef.current!;
        if (player.playing) {
          player.pause();
          saveProgress(player.currentTime);
        } else {
          player.play();
        }
      },

      seekTo: (sec) => {
        playerRef.current?.seekTo(Math.max(0, sec)).catch(() => {});
      },

      skip: (deltaSec) => {
        const player = playerRef.current!;
        const max = player.duration || 0;
        const target = Math.max(0, Math.min(max, player.currentTime + deltaSec));
        player.seekTo(target).catch(() => {});
      },

      setRate: (rate) => {
        rateRef.current = rate;
        try {
          playerRef.current?.setPlaybackRate(rate);
        } catch {
          // ignore if not loaded yet
        }
        setState((prev) => ({ ...prev, rate }));
      },

      close: () => {
        const player = playerRef.current!;
        saveProgress(player.currentTime);
        player.pause();
        try {
          player.clearLockScreenControls();
        } catch {
          // ignore
        }
        episodeRef.current = null;
        setState((prev) => ({
          ...prev,
          episode: null,
          isPlaying: false,
          isBuffering: false,
          position: 0,
          duration: 0,
        }));
      },
    }),
    [saveProgress]
  );

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('usePlayer must be used within a <PlayerProvider>');
  return ctx;
}

export function usePlayerActions(): PlayerActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('usePlayerActions must be used within a <PlayerProvider>');
  return ctx;
}
