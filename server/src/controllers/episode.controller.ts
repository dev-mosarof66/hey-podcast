import { NextFunction, Request, Response } from 'express';
import { EpisodeRepository } from '../repositories/episode.repository';
import { HttpError } from '../utils/http-error';
import { SAMPLE_AUDIO } from '../seed';
import { engineEnabled } from '../config/env';
import { AppDataSource } from '../data-source';
import { GenerationJob } from '../entities/GenerationJob';
import { TopicFollow } from '../entities/TopicFollow';
import { Topic } from '../entities/Topic';
import { enqueue } from '../engine/worker';
import { generateUserDigest } from '../engine/digest';

function titleFromPrompt(prompt: string): string {
  return prompt.length > 80 ? `${prompt.slice(0, 77)}…` : prompt;
}

/**
 * Best-effort topic for an AI-generated episode, so it carries a topic-specific
 * icon/label instead of the generic "For You". Prefers an explicit topicId from
 * the client; otherwise matches the prompt against the catalog by label/slug.
 * Returns null when nothing matches (a truly free-form prompt).
 */
async function resolveTopicId(prompt: string, explicitId?: unknown): Promise<string | null> {
  const topicRepo = AppDataSource.getRepository(Topic);

  if (explicitId) {
    const byId = await topicRepo.findOneBy({ id: String(explicitId) });
    if (byId) return byId.id;
  }

  const text = prompt.toLowerCase();
  const topics = await topicRepo.find();
  const match =
    topics.find((t) => text.includes(t.label.toLowerCase())) ??
    topics.find((t) => text.includes(t.slug.toLowerCase()));
  return match?.id ?? null;
}

// GET /api/episodes — the feed (ready episodes, newest first, with topic).
export async function listEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const episodes = await EpisodeRepository.findFeed(req.user!.sub);
    res.json(episodes);
  } catch (err) {
    next(err);
  }
}

// GET /api/episodes/digest-hero — the home hero card.
// Returns only the newest episode owned by the logged-in user (never a shared
// global digest), so the home screen fetches one row instead of the whole feed.
export async function getDigestHero(req: Request, res: Response, next: NextFunction) {
  try {
    const episode = await EpisodeRepository.findHeroForUser(req.user!.sub);
    res.json(episode ?? null);
  } catch (err) {
    next(err);
  }
}

// GET /api/episodes/:id
export async function getEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const episode = await EpisodeRepository.findByIdWithTopic(req.params.id);
    if (!episode) {
      throw new HttpError(404, 'Episode not found');
    }
    res.json(episode);
  } catch (err) {
    next(err);
  }
}

// POST /api/episodes/generate  { prompt }
// On-demand generation. With engine keys configured this queues a real async
// job (fetch → script → TTS → host) and returns a 'generating' episode the app
// polls until it's ready. Without keys it falls back to an instant placeholder.
export async function generateEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const prompt = String(req.body.prompt ?? '').trim();
    if (!prompt) {
      throw new HttpError(400, 'A prompt is required');
    }

    // Associate the generated episode with a topic when we can identify one.
    const topicId = await resolveTopicId(prompt, req.body.topicId);

    if (!engineEnabled) {
      // No GEMINI/DEEPGRAM keys → instant placeholder (keeps the app working).
      const stub = EpisodeRepository.create({
        title: titleFromPrompt(prompt),
        prompt,
        summary: null,
        durationSec: 8 * 60,
        audioUrl: SAMPLE_AUDIO[Math.floor(Math.random() * SAMPLE_AUDIO.length)],
        status: 'ready',
        isShared: false,
        userId,
        topicId,
        publishedAt: new Date(),
      });
      await EpisodeRepository.save(stub);
      return res.status(201).json(await EpisodeRepository.findByIdWithTopic(stub.id));
    }

    // Real generation: create a placeholder 'generating' episode + queue a job.
    const episode = EpisodeRepository.create({
      title: titleFromPrompt(prompt),
      prompt,
      summary: null,
      durationSec: null,
      audioUrl: null,
      status: 'generating',
      isShared: false,
      userId,
      topicId,
      publishedAt: null,
    });
    await EpisodeRepository.save(episode);

    const jobRepo = AppDataSource.getRepository(GenerationJob);
    const job = jobRepo.create({
      episodeId: episode.id,
      topicId,
      trigger: 'on_demand',
      status: 'queued',
    });
    await jobRepo.save(job);

    enqueue(episode.id);

    // 202 Accepted — generation runs in the background.
    res.status(202).json(await EpisodeRepository.findByIdWithTopic(episode.id));
  } catch (err) {
    next(err);
  }
}

// POST /api/episodes/digest
// Generate the current user's daily digest now, on demand — the same job the
// 4:30 AM cron runs per user. Returns the 'generating' episode to poll.
export async function generateDigest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;

    if (!engineEnabled) {
      // No GEMINI/DEEPGRAM keys → instant placeholder digest so onboarding and
      // the free daily digest keep working (mirrors generateEpisode's stub).
      const followRepo = AppDataSource.getRepository(TopicFollow);
      const follows = await followRepo.find({
        where: { userId },
        relations: { topic: true },
        order: { createdAt: 'ASC' },
      });
      if (!follows.length) {
        throw new HttpError(400, 'Follow at least one topic to get a digest');
      }
      // Tag with the primary (first-followed) topic for a topic-specific icon.
      const primaryTopicId = follows.find((f) => f.topic)?.topicId ?? null;

      const stub = EpisodeRepository.create({
        title: 'Your daily digest',
        prompt: 'Your personalized daily digest',
        summary: null,
        durationSec: 8 * 60,
        audioUrl: SAMPLE_AUDIO[Math.floor(Math.random() * SAMPLE_AUDIO.length)],
        status: 'ready',
        isShared: false,
        userId,
        topicId: primaryTopicId,
        publishedAt: new Date(),
      });
      await EpisodeRepository.save(stub);
      return res.status(201).json(await EpisodeRepository.findByIdWithTopic(stub.id));
    }

    const episodeId = await generateUserDigest(userId, 'on_demand');
    if (!episodeId) {
      throw new HttpError(400, 'Follow at least one topic to get a digest');
    }

    res.status(202).json(await EpisodeRepository.findByIdWithTopic(episodeId));
  } catch (err) {
    next(err);
  }
}
