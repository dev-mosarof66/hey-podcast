import type { Episode } from 'constants/types';
import { topicUi } from 'constants/topicUi';
import type { ApiContinueItem, ApiEpisode } from 'store/api';

function relativeTime(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 12) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  return `${days}d ago`;
}

/** Adapt a server episode to the shape the UI components render. */
export function toUiEpisode(e: ApiEpisode): Episode {
  const ui = topicUi(e.topic?.slug);
  return {
    id: e.id,
    title: e.title,
    topic: e.topic?.label ?? 'For You',
    durationMin: Math.max(1, Math.round((e.durationSec ?? 0) / 60)),
    durationSec: e.durationSec ?? 0,
    published: relativeTime(e.publishedAt ?? e.createdAt),
    color: ui.color,
    icon: ui.icon,
    audioUrl: e.audioUrl,
  };
}

/** Like toUiEpisode, but carries the user's listening progress (0–1). */
export function toUiContinue(item: ApiContinueItem): Episode {
  const dur = item.durationSec ?? 0;
  return {
    ...toUiEpisode(item),
    progress: item.completed ? 1 : dur > 0 ? Math.min(1, item.progressSec / dur) : 0,
    progressSec: item.completed ? 0 : item.progressSec,
  };
}
