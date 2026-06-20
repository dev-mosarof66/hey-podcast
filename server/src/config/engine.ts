/**
 * Generation-engine knobs (guide §7). Tune episode quality and voices here.
 * The script-writing prompt (engine/writeScript.ts) is the highest-leverage
 * lever; voices below are the second.
 */

export interface Host {
  /** Stable id used in the script JSON. */
  id: 'A' | 'B';
  /** Display name spoken in the dialogue. */
  name: string;
  /** Deepgram Aura voice model. */
  voice: string;
}

export const ENGINE = {
  // Gemini model for both fetch-brief (with Google Search grounding) and the
  // script. Flash (not Pro) to stay on the free tier.
  textModel: 'gemini-2.5-flash',

  // Target episode length in minutes (drives script length).
  minutes: 8,

  // The two AI hosts. Names must match what the app shows ("Alex & Maya").
  hosts: [
    { id: 'A', name: 'Alex', voice: 'aura-2-apollo-en' }, // warm male
    { id: 'B', name: 'Maya', voice: 'aura-2-thalia-en' }, // bright female
  ] as Host[],

  // TTS audio format. linear16 PCM is what Deepgram returns and what we stitch.
  sampleRate: 24000,
  // Silence inserted between speaker turns, in milliseconds.
  pauseMs: 350,
  // How many turns to synthesize concurrently (Deepgram is one call per turn).
  // Sequential is far too slow for ~40-turn scripts; this bounds parallelism.
  ttsConcurrency: 6,

  // Deepgram speak endpoint.
  deepgramSpeakUrl: 'https://api.deepgram.com/v1/speak',
} as const;

export function hostById(id: 'A' | 'B'): Host {
  return ENGINE.hosts.find((h) => h.id === id) ?? ENGINE.hosts[0];
}
