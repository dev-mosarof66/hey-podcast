import type { IoniconName } from 'constants/types';

interface TopicUi {
  icon: IoniconName;
  color: string;
}

// Presentation per topic slug — a UI concern, kept on the client.
export const TOPIC_UI: Record<string, TopicUi> = {
  tech: { icon: 'hardware-chip', color: '#7c3aed' },
  ai: { icon: 'sparkles', color: '#db2777' },
  science: { icon: 'planet', color: '#2563eb' },
  space: { icon: 'rocket', color: '#4f46e5' },
  business: { icon: 'trending-up', color: '#0F6E56' },
  finance: { icon: 'cash', color: '#059669' },
  world: { icon: 'earth', color: '#721378' },
  politics: { icon: 'megaphone', color: '#475569' },
  sports: { icon: 'football', color: '#ea580c' },
  health: { icon: 'fitness', color: '#0891b2' },
  climate: { icon: 'leaf', color: '#16a34a' },
  film: { icon: 'film', color: '#ca8a04' },
  music: { icon: 'musical-notes', color: '#e11d48' },
  gaming: { icon: 'game-controller', color: '#9333ea' },
  travel: { icon: 'airplane', color: '#0ea5e9' },
  food: { icon: 'restaurant', color: '#f97316' },
};

// Topicless episodes — the personalized "Your daily digest" and on-demand
// generations — have no single topic, so they use this intentional digest
// identity instead of a per-topic icon.
export const FALLBACK_TOPIC_UI: TopicUi = { icon: 'newspaper', color: '#721378' };

export function topicUi(slug?: string): TopicUi {
  return (slug && TOPIC_UI[slug]) || FALLBACK_TOPIC_UI;
}
