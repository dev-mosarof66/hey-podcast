import { ENGINE, hostById } from '../config/engine';
import { env } from '../config/env';
import type { Script } from './writeScript';

export interface TtsResult {
  /** Complete WAV file (header + PCM). */
  wav: Buffer;
  durationSec: number;
  /** Per-turn start/end seconds, aligned with script.turns — for transcript sync. */
  timings: { start: number; end: number }[];
}

export interface TtsProvider {
  synthesize(script: Script): Promise<TtsResult>;
}

/** Synthesize one turn → raw linear16 PCM with the given Aura voice. */
async function speakTurn(text: string, voice: string): Promise<Buffer> {
  const url =
    `${ENGINE.deepgramSpeakUrl}?model=${voice}` +
    `&encoding=linear16&sample_rate=${ENGINE.sampleRate}&container=none`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.deepgramApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Deepgram TTS ${res.status}: ${msg.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** N milliseconds of silence as 16-bit mono PCM. */
function silence(ms: number): Buffer {
  const samples = Math.round((ENGINE.sampleRate * ms) / 1000);
  return Buffer.alloc(samples * 2);
}

/** Run an async mapper over items with bounded concurrency, preserving order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Wrap raw 16-bit mono PCM in a 44-byte WAV header. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const dataLen = pcm.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate = sr * channels * bytesPerSample
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Stage 3 + 4 — synthesize each turn in its host's voice and stitch the PCM
 * together with short pauses, then write a WAV header. Deepgram is single-voice
 * per request, so we call it per turn; concatenation is pure Node (no ffmpeg).
 */
export const deepgramTts: TtsProvider = {
  async synthesize(script) {
    // Synthesize all turns concurrently (bounded), keeping their order.
    const clips = await mapWithConcurrency(script.turns, ENGINE.ttsConcurrency, (turn) =>
      speakTurn(turn.text, hostById(turn.speaker).voice)
    );

    // Stitch the ordered clips with a short pause between each, tracking the
    // start/end time of every turn as we go (for karaoke-style transcript sync).
    const gap = silence(ENGINE.pauseMs);
    const bytesPerSec = ENGINE.sampleRate * 2;
    const gapSec = gap.length / bytesPerSec;
    const parts: Buffer[] = [];
    const timings: { start: number; end: number }[] = [];
    let cursor = 0;
    clips.forEach((clip, i) => {
      const start = cursor;
      const end = start + clip.length / bytesPerSec;
      timings.push({ start: Number(start.toFixed(2)), end: Number(end.toFixed(2)) });
      cursor = end;
      parts.push(clip);
      if (i < clips.length - 1) {
        parts.push(gap);
        cursor += gapSec;
      }
    });

    const pcm = Buffer.concat(parts);
    const durationSec = Math.round(pcm.length / bytesPerSec);
    return { wav: pcmToWav(pcm, ENGINE.sampleRate), durationSec, timings };
  },
};
