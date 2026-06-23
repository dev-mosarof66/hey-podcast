import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { logger } from '../config/logger';

type GenParams = Parameters<GoogleGenAI['models']['generateContent']>[0];
type GenResult = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;

// Up to this many attempts per key when the model is transiently unavailable.
const MAX_TRANSIENT_ATTEMPTS = 4;

// One client per configured API key (primary + fallbacks), created lazily.
let clients: GoogleGenAI[] | null = null;

function getClients(): GoogleGenAI[] {
  if (!clients) {
    if (env.geminiApiKeys.length === 0) throw new Error('GEMINI_API_KEY is not set');
    clients = env.geminiApiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));
  }
  return clients;
}

/**
 * Whether an error means "this key is unusable right now" — i.e. worth failing
 * over to the next key. Covers quota/rate-limit (429 / RESOURCE_EXHAUSTED) and
 * auth problems (401/403), matched on both error fields and the message text
 * since the SDK's error shape varies.
 */
function isKeyExhausted(err: unknown): boolean {
  const e = err as { status?: number; code?: number };
  const code = e?.status ?? e?.code;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    code === 429 ||
    code === 401 ||
    code === 403 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('permission') ||
    msg.includes('api key')
  );
}

/**
 * Whether an error is transient — a temporary model overload (503 UNAVAILABLE /
 * "high demand"), a 500, or a network blip. These clear on their own, so the
 * right response is to wait and retry the SAME key (switching keys won't help a
 * model-wide outage).
 */
function isTransient(err: unknown): boolean {
  const e = err as { status?: number; code?: number };
  const code = e?.status ?? e?.code;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    code === 503 ||
    code === 500 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('try again') ||
    msg.includes('internal error') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('network')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One key's call, retrying transient overloads with exponential backoff
 * (~2s → 6s → 18s, plus jitter). Non-transient errors (quota/auth) throw
 * immediately so key-failover can take over.
 */
async function callWithRetry(client: GoogleGenAI, params: GenParams): Promise<GenResult> {
  let delay = 2000;
  for (let attempt = 1; ; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      if (!isTransient(err) || attempt >= MAX_TRANSIENT_ATTEMPTS) throw err;
      const wait = delay + Math.floor(Math.random() * 500);
      logger.warn(
        { attempt, max: MAX_TRANSIENT_ATTEMPTS, waitMs: wait },
        'gemini: transient error (model overloaded) — retrying after backoff'
      );
      await sleep(wait);
      delay *= 3;
    }
  }
}

/**
 * Run a Gemini generateContent call with two layers of resilience:
 *  - transient model overloads (503) are retried with backoff on the same key;
 *  - quota/auth failures (429/401/403) fail over to the next configured key.
 * The original error is rethrown only when every option is exhausted.
 */
export async function geminiGenerate(params: GenParams): Promise<GenResult> {
  const list = getClients();
  let lastErr: unknown;
  for (let i = 0; i < list.length; i++) {
    try {
      return await callWithRetry(list[i], params);
    } catch (err) {
      lastErr = err;
      if (!isKeyExhausted(err) || i === list.length - 1) throw err;
      logger.warn(
        { keyIndex: i, nextKey: i + 1, total: list.length },
        'gemini: key exhausted/failed — falling back to next key'
      );
    }
  }
  throw lastErr;
}
