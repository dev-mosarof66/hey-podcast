import { ENGINE } from '../config/engine';
import { logger } from '../config/logger';
import { fetchBrief } from './fetchBrief';
import { writeScript } from './writeScript';
import { deepgramTts } from './tts';
import { saveAudio } from './storage';

export interface GeneratedEpisode {
  title: string;
  summary: string;
  audioUrl: string;
  durationSec: number;
  transcript: { speaker: 'A' | 'B'; text: string }[];
  hosts: { A: string; B: string };
}

/**
 * The full engine: topic → brief → two-host script → voices → hosted audio.
 * `topic` is a user prompt (on-demand) or a topic label (daily digest).
 */
export async function runPipeline(topic: string, minutes = ENGINE.minutes): Promise<GeneratedEpisode> {
  logger.info({ topic }, 'engine: fetching brief');
  const brief = await fetchBrief(topic);

  logger.info('engine: writing script');
  const script = await writeScript(brief, minutes);

  logger.info({ turns: script.turns.length }, 'engine: synthesizing voices');
  const { wav, durationSec } = await deepgramTts.synthesize(script);

  const { url } = await saveAudio(wav);
  logger.info({ durationSec, audioUrl: url }, 'engine: episode assembled');

  return {
    title: script.title,
    summary: script.summary,
    audioUrl: url,
    durationSec,
    transcript: script.turns,
    hosts: script.hosts,
  };
}
