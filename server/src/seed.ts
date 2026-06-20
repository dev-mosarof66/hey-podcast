import { AppDataSource } from './data-source';
import { Topic } from './entities/Topic';
import { logger } from './config/logger';
import { TOPIC_CATALOG } from './config/personalization';

// Placeholder audio for the on-demand generator's no-engine fallback
// (controllers/episode.controller.ts). Royalty-free instrumentals (SoundHelix).
export const SAMPLE_AUDIO = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
];

/** Insert any catalog topics that don't exist yet (by slug). Episodes are no
 * longer seeded — they come from the generation engine / admin panel. */
export async function seed() {
  const topicRepo = AppDataSource.getRepository(Topic);

  const existing = await topicRepo.find();
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const toAdd = TOPIC_CATALOG.filter((t) => !existingSlugs.has(t.slug));
  if (toAdd.length) {
    await topicRepo.save(toAdd.map((t) => topicRepo.create(t)));
    logger.info(`Seeded ${toAdd.length} topics`);
  }
}
