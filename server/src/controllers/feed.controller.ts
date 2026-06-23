import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Briefing } from '../entities/Briefing';
import { Episode } from '../entities/Episode';
import { EpisodeRepository } from '../repositories/episode.repository';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hhmmss(sec: number | null): string {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

function audioMime(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'm4a' || ext === 'aac') return 'audio/aac';
  if (ext === 'wav') return 'audio/wav';
  return 'audio/mpeg';
}

function buildRss(briefing: Briefing, episodes: Episode[]): string {
  const selfUrl = `${env.publicUrl}/api/feed/${briefing.slug}`;
  const title = xmlEscape(briefing.title);
  const desc = xmlEscape(briefing.description || `Daily audio briefing — ${briefing.title}.`);

  const items = episodes
    .map((e) => {
      const pub = (e.publishedAt ?? e.createdAt).toUTCString();
      const itemDesc = xmlEscape(e.summary || e.title);
      const audio = e.audioUrl ?? '';
      return `    <item>
      <title>${xmlEscape(e.title)}</title>
      <description>${itemDesc}</description>
      <guid isPermaLink="false">${e.id}</guid>
      <pubDate>${pub}</pubDate>
      <enclosure url="${xmlEscape(audio)}" type="${audioMime(audio)}" length="0" />
      <itunes:duration>${hhmmss(e.durationSec)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${xmlEscape(selfUrl)}</link>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <description>${desc}</description>
    <itunes:author>Hey Podcast</itunes:author>
    <itunes:summary>${desc}</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
${items}
  </channel>
</rss>`;
}

// GET /api/feed/:slug — public podcast RSS for a briefing (add to Spotify/Apple).
export async function getBriefingFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug.replace(/\.xml$/i, '');
    const briefing = await AppDataSource.getRepository(Briefing).findOne({ where: { slug } });
    if (!briefing) throw new HttpError(404, 'Feed not found');

    const episodes = await EpisodeRepository.find({
      where: { briefingId: briefing.id, status: 'ready' },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: 100,
    });

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(buildRss(briefing, episodes));
  } catch (err) {
    next(err);
  }
}
