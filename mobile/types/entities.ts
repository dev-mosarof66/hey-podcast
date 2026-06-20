/**
 * Domain entities — the canonical data model for Hey Podcast.
 *
 * Derived from the guide's implied schema (§5 "stores users / topic-follows /
 * episode metadata", §8 Phase 2 "auth, users, topic-follows, episodes") and
 * the screens that consume them (feed, discover/follow, library, profile).
 *
 * These describe the BACKEND shape (Supabase/Postgres rows). UI-only concerns
 * like a topic's icon/colour live in the presentation layer, not here.
 *
 * Convention: ids are uuids, timestamps are ISO-8601 strings.
 */

// ── User ───────────────────────────────────────────────────────────────────
// Backed by Supabase auth.
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// ── Topic ──────────────────────────────────────────────────────────────────
// A followable subject. The product is topic-first.
export interface Topic {
  id: string;
  slug: string; // 'technology'
  label: string; // 'Technology'
  createdAt: string;
}

// ── TopicFollow ──────────────────────────────────────────────────────────────
// Join table: which user follows which topic — the "preference" that drives
// the daily digest. (guide §5 "topic-follows")
export interface TopicFollow {
  id: string;
  userId: string;
  topicId: string;
  createdAt: string;
}

// ── Episode ──────────────────────────────────────────────────────────────────
// Generated audio + metadata. The MP3 lives on R2 (guide §5/§7); the row only
// holds metadata + the CDN url.
export type EpisodeStatus = 'queued' | 'generating' | 'ready' | 'failed';

export interface Episode {
  id: string;
  /** Topic this episode covers; null for a free-form on-demand prompt. */
  topicId: string | null;
  /** Owner for a personal/on-demand episode; null for a shared digest. */
  userId: string | null;
  title: string;
  summary: string | null;
  /** The free-text prompt for on-demand generation, if any. */
  prompt: string | null;
  /** R2 CDN url — null until status is 'ready'. */
  audioUrl: string | null;
  durationSec: number | null;
  status: EpisodeStatus;
  /** Hybrid caching: a segment/episode shared across users (guide §9). */
  isShared: boolean;
  publishedAt: string | null;
  createdAt: string;
}

// ── EpisodeProgress ──────────────────────────────────────────────────────────
// Per-user playback position — powers "Continue listening".
export interface EpisodeProgress {
  id: string;
  userId: string;
  episodeId: string;
  positionSec: number;
  completed: boolean;
  updatedAt: string;
}

// ── SavedEpisode ─────────────────────────────────────────────────────────────
// Library: bookmarked and/or downloaded for offline.
export interface SavedEpisode {
  id: string;
  userId: string;
  episodeId: string;
  downloaded: boolean;
  /** Local file uri once downloaded for offline playback. */
  localUri: string | null;
  savedAt: string;
}

// ── GenerationJob ────────────────────────────────────────────────────────────
// The async pipeline job behind the queue (guide §4/§5: enqueue → worker → R2).
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
export type JobTrigger = 'cron' | 'on_demand';

export interface GenerationJob {
  id: string;
  episodeId: string;
  trigger: JobTrigger;
  status: JobStatus;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

// ── Subscription ─────────────────────────────────────────────────────────────
// Paid from day one (guide §9). Gates unlimited generation / downloads.
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  /** Next renewal, when active. */
  renewsAt: string | null;
  createdAt: string;
}
