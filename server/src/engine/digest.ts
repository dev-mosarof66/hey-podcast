import { MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Episode } from '../entities/Episode';
import { GenerationJob, JobTrigger } from '../entities/GenerationJob';
import { Topic } from '../entities/Topic';
import { TopicFollow } from '../entities/TopicFollow';
import { GlobalDigestState } from '../entities/GlobalDigestState';
import { logger } from '../config/logger';
import { env } from '../config/env';
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
  const follows = await followRepo.find({
    where: { userId },
    relations: { topic: true },
    order: { createdAt: 'ASC' },
  });
  const labels = follows.map((f) => f.topic?.label).filter(Boolean) as string[];
  if (!labels.length) return null;

  // Tag the digest with the user's primary (first-followed) topic so it shows a
  // topic-specific icon/label in the app rather than the generic "For You".
  const primaryTopicId = follows.find((f) => f.topic)?.topicId ?? null;

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
    topicId: primaryTopicId,
    publishedAt: null,
  });
  await episodeRepo.save(episode);

  const job = jobRepo.create({
    episodeId: episode.id,
    topicId: primaryTopicId,
    trigger,
    status: 'queued',
  });
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

  const job = jobRepo.create({ episodeId: episode.id, topicId, trigger, status: 'queued' });
  await jobRepo.save(job);

  enqueue(episode.id);
  return episode.id;
}

/**
 * Queue an episode for a B2B briefing (a branded client show). Like the topic
 * digest, but tagged with briefingId so it lands in that briefing's RSS feed.
 */
export async function generateBriefingEpisode(briefing: {
  id: string;
  title: string;
  prompt: string;
}): Promise<string> {
  const episodeRepo = AppDataSource.getRepository(Episode);
  const jobRepo = AppDataSource.getRepository(GenerationJob);

  const episode = episodeRepo.create({
    title: briefing.title,
    prompt: briefing.prompt,
    summary: null,
    durationSec: null,
    audioUrl: null,
    status: 'generating',
    isShared: false,
    userId: null,
    topicId: null,
    briefingId: briefing.id,
    publishedAt: null,
  });
  await episodeRepo.save(episode);

  const job = jobRepo.create({ episodeId: episode.id, trigger: 'on_demand', status: 'queued' });
  await jobRepo.save(job);

  enqueue(episode.id);
  return episode.id;
}

// How many topics the global cron generates per day. Kept low to stay under
// Gemini's free-tier daily quota; the rest are covered on following days.
const GLOBAL_TOPICS_PER_DAY = 2;

/** Today's date key in the digest timezone, e.g. '2026-06-22'. */
function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.digestTz }).format(new Date());
}

/**
 * The scheduled global batch: generates a small, fixed number of shared topic
 * digests per day (GLOBAL_TOPICS_PER_DAY), rotating through the catalog via a
 * persistent cursor so every topic gets refreshed over time. A per-day guard
 * (lastRunOn) keeps it to exactly N/day even if the cron fires more than once
 * (e.g. in-process cron + external cron-job.org). Episodes are enqueued in
 * order; the worker processes them one at a time, so they run sequentially.
 */
export async function generateGlobalDigests(): Promise<void> {
  const topicRepo = AppDataSource.getRepository(Topic);
  const stateRepo = AppDataSource.getRepository(GlobalDigestState);

  // Stable order so the cursor advances predictably across runs.
  const topics = await topicRepo.find({ order: { createdAt: 'ASC', id: 'ASC' } });
  if (!topics.length) {
    logger.info('global digest cron: no topics, skipping');
    return;
  }

  let state = await stateRepo.findOneBy({ id: 1 });
  if (!state) state = stateRepo.create({ id: 1, cursor: 0, lastRunOn: null });

  const today = todayKey();
  if (state.lastRunOn === today) {
    logger.info({ today }, 'global digest cron: already ran today, skipping');
    return;
  }

  // Pick the next N topics starting at the cursor, wrapping around the catalog.
  const count = Math.min(GLOBAL_TOPICS_PER_DAY, topics.length);
  const picked: Topic[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(topics[(state.cursor + i) % topics.length]);
  }

  for (const topic of picked) {
    await generateTopicDigest(topic.id, topic.label, 'cron');
  }

  // Advance the cursor and stamp today so a repeat run is a no-op.
  state.cursor = (state.cursor + count) % topics.length;
  state.lastRunOn = today;
  await stateRepo.save(state);

  logger.info(
    { picked: picked.map((t) => t.label), nextCursor: state.cursor, today },
    'global digest cron: queued rotating topics'
  );
}
