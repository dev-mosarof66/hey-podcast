import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * The shape an episode is rendered as. Server episodes are adapted into this
 * view-model in utils/episode.ts; the UI never sees the raw API shape.
 */
export interface Episode {
  id: string;
  title: string;
  topic: string;
  durationMin: number;
  /** Total length in seconds (for the player scrubber/resume). */
  durationSec: number;
  published: string;
  /** Artwork tint. */
  color: string;
  icon: IoniconName;
  /** Streamable audio URL, when the episode is ready. */
  audioUrl: string | null;
  /** 0–1 listening progress, when started. */
  progress?: number;
  /** Saved listening position in seconds (for resume). */
  progressSec?: number;
}
