import { NextFunction, Request, Response } from 'express';
import { EpisodeRepository } from '../repositories/episode.repository';
import { HttpError } from '../utils/http-error';
import { SAMPLE_AUDIO } from '../seed';
import { engineEnabled } from '../config/env';
import { AppDataSource } from '../data-source';
import { GenerationJob } from '../entities/GenerationJob';
import { enqueue } from '../engine/worker';
import { generateUserDigest } from '../engine/digest';

function titleFromPrompt(prompt: string): string {
  return prompt.length > 80 ? `${prompt.slice(0, 77)}…` : prompt;
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
        topicId: null,
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
      topicId: null,
      publishedAt: null,
    });
    await EpisodeRepository.save(episode);

    const jobRepo = AppDataSource.getRepository(GenerationJob);
    const job = jobRepo.create({ episodeId: episode.id, trigger: 'on_demand', status: 'queued' });
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
      throw new HttpError(503, 'Generation engine is not configured');
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
