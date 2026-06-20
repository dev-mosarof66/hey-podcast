import { MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Episode } from '../entities/Episode';
import { GenerationJob, JobTrigger } from '../entities/GenerationJob';
import { Topic } from '../entities/Topic';
import { TopicFollow } from '../entities/TopicFollow';
import { logger } from '../config/logger';
import { enqueue } from './worker';

/** Start of the current day — used to make the cron runs idempotent. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Today's cron-generated episodes, for skipping work already done. */
async function todaysCronEpisodes(): Promise<Episode[]> {
  const jobRepo = AppDataSource.getRepository(GenerationJob);
  const jobs = await jobRepo.find({
    where: { trigger: 'cron', createdAt: MoreThanOrEqual(startOfToday()) },
    relations: { episode: true },
  });
  return jobs.map((j) => j.episode).filter(Boolean) as Episode[];
}

/**
 * Queue a daily-digest episode for one user, built from the topics they follow.
 * Returns the new episode id, or null if the user follows nothing.
 */
export async function generateUserDigest(
  userId: string,
  trigger: JobTrigger
): Promise<string | null> {
  const followRepo = AppDataSource.getRepository(TopicFollow);
  const follows = await followRepo.find({ where: { userId }, relations: { topic: true } });
  const labels = follows.map((f) => f.topic?.label).filter(Boolean) as string[];
  if (!labels.length) return null;

  const episodeRepo = AppDataSource.getRepository(Episode);
  const jobRepo = AppDataSource.getRepository(GenerationJob);

  const episode = episodeRepo.create({
    title: 'Your daily digest',
    // The worker passes prompt to the pipeline as the topic to research.
    prompt: `Today's most important developments across: ${labels.join(', ')}`,
    summary: null,
    durationSec: null,
    audioUrl: null,
    status: 'generating',
    isShared: false,
    userId,
    topicId: null,
    publishedAt: null,
  });
  await episodeRepo.save(episode);

  const job = jobRepo.create({ episodeId: episode.id, trigger, status: 'queued' });
  await jobRepo.save(job);

  enqueue(episode.id);
  return episode.id;
}

/**
 * The scheduled batch: pre-generate today's digest for every user who follows
 * at least one topic. Idempotent — users who already got a cron digest today
 * are skipped, so a restart won't double-generate.
 *
 * Cost note (guide §9): this is the "naive daily-for-everyone" policy. Before
 * real scale, gate this on engagement (only likely-to-listen users) and add the
 * hybrid-caching shared news segment. For the beta it's fine.
 */
export async function generateDailyDigests(): Promise<void> {
  const followRepo = AppDataSource.getRepository(TopicFollow);

  // Who already has a personalized cron digest today? (Shared episodes have a
  // null userId, so they don't count here.)
  const todays = await todaysCronEpisodes();
  const done = new Set(todays.map((e) => e.userId).filter(Boolean) as string[]);

  // Group followed-topic labels by user.
  const follows = await followRepo.find({ relations: { topic: true } });
  const byUser = new Map<string, string[]>();
  for (const f of follows) {
    if (!f.topic) continue;
    const arr = byUser.get(f.userId) ?? [];
    arr.push(f.topic.label);
    byUser.set(f.userId, arr);
  }

  let queued = 0;
  for (const userId of byUser.keys()) {
    if (done.has(userId)) continue;
    const id = await generateUserDigest(userId, 'cron');
    if (id) queued++;
  }

  logger.info(
    { eligible: byUser.size, skipped: done.size, queued },
    'digest cron: queued daily digests'
  );
}

/**
 * Queue a shared "global" digest for one topic — a single episode (isShared,
 * no owner) that every user following the topic sees in their feed. This is the
 * guide's hybrid-caching lever: generate the general segment once, not per user.
 */
export async function generateTopicDigest(
  topicId: string,
  label: string,
  trigger: JobTrigger
): Promise<string | null> {
  const episodeRepo = AppDataSource.getRepository(Episode);
  const jobRepo = AppDataSource.getRepository(GenerationJob);

  const episode = episodeRepo.create({
    title: `${label} — Today`,
    prompt: `The most important and genuinely interesting recent developments in ${label}`,
    summary: null,
    durationSec: null,
    audioUrl: null,
    status: 'generating',
    isShared: true,
    userId: null,
    topicId,
    publishedAt: null,
  });
  await episodeRepo.save(episode);

  const job = jobRepo.create({ episodeId: episode.id, trigger, status: 'queued' });
  await jobRepo.save(job);

  enqueue(episode.id);
  return episode.id;
}

/**
 * The scheduled global batch: one fresh shared episode per topic in the
 * catalog, generated once for everyone. Idempotent per topic per day.
 */
export async function generateGlobalDigests(): Promise<void> {
  const topicRepo = AppDataSource.getRepository(Topic);

  // Topics that already have a shared cron episode today.
  const todays = await todaysCronEpisodes();
  const done = new Set(
    todays.filter((e) => e.isShared && e.topicId).map((e) => e.topicId) as string[]
  );

  const topics = await topicRepo.find();
  let queued = 0;
  for (const topic of topics) {
    if (done.has(topic.id)) continue;
    const id = await generateTopicDigest(topic.id, topic.label, 'cron');
    if (id) queued++;
  }

  logger.info(
    { topics: topics.length, skipped: done.size, queued },
    'global digest cron: queued topic digests'
  );
}
