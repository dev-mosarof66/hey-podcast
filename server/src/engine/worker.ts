import { AppDataSource } from '../data-source';
import { Episode } from '../entities/Episode';
import { GenerationJob } from '../entities/GenerationJob';
import { Notification } from '../entities/Notification';
import { logger } from '../config/logger';
import { runPipeline } from './pipeline';
import { sendPushToUser } from './push';

// Simple in-process queue. The guide's production design uses QStash; for this
// single-server build an in-memory FIFO is enough, and running one job at a
// time keeps us under Gemini's free-tier rate limit.
const queue: string[] = [];
let processing = false;

export function enqueue(episodeId: string): void {
  queue.push(episodeId);
  void drain();
}

async function drain(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (queue.length) {
      const id = queue.shift()!;
      await processEpisode(id);
    }
  } finally {
    processing = false;
  }
}

async function processEpisode(episodeId: string): Promise<void> {
  const episodeRepo = AppDataSource.getRepository(Episode);
  const jobRepo = AppDataSource.getRepository(GenerationJob);

  const episode = await episodeRepo.findOne({ where: { id: episodeId } });
  if (!episode) return;

  const job = await jobRepo.findOne({
    where: { episodeId },
    order: { createdAt: 'DESC' },
  });

  try {
    if (job) {
      job.status = 'running';
      await jobRepo.save(job);
    }
    episode.status = 'generating';
    await episodeRepo.save(episode);

    const topic = episode.prompt?.trim() || episode.title;
    const result = await runPipeline(topic);

    episode.title = result.title;
    episode.summary = result.summary;
    episode.audioUrl = result.audioUrl;
    episode.durationSec = result.durationSec;
    episode.transcript = result.transcript;
    episode.hosts = result.hosts;
    episode.status = 'ready';
    episode.publishedAt = new Date();
    await episodeRepo.save(episode);

    if (job) {
      job.status = 'done';
      job.finishedAt = new Date();
      await jobRepo.save(job);
    }
    logger.info({ episodeId }, 'engine: episode ready');

    // Notify the owner that their episode is ready: store an in-app notification
    // and send a push. Shared/global episodes have no single owner, so skip.
    if (episode.userId) {
      const notifRepo = AppDataSource.getRepository(Notification);
      await notifRepo.save(
        notifRepo.create({
          userId: episode.userId,
          type: 'episode_ready',
          title: 'Your digest is ready',
          body: episode.title,
          episodeId: episode.id,
        })
      );
      await sendPushToUser(episode.userId, {
        title: '🎧 Your digest is ready',
        body: episode.title,
        data: { episodeId: episode.id, type: 'episode_ready' },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, episodeId }, 'engine: generation failed');

    episode.status = 'failed';
    await episodeRepo.save(episode);

    if (job) {
      job.status = 'failed';
      job.error = message;
      job.finishedAt = new Date();
      await jobRepo.save(job);
    }
  }
}

/** On boot, re-enqueue any jobs left queued/running by a previous process. */
export async function resumePending(): Promise<void> {
  const jobRepo = AppDataSource.getRepository(GenerationJob);
  const pending = await jobRepo.find({
    where: [{ status: 'queued' }, { status: 'running' }],
  });
  for (const job of pending) enqueue(job.episodeId);
  if (pending.length) logger.info(`engine: resumed ${pending.length} pending job(s)`);
}
