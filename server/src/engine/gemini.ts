import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { logger } from '../config/logger';

type GenParams = Parameters<GoogleGenAI['models']['generateContent']>[0];
type GenResult = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;

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
 * Run a Gemini generateContent call with key failover: try each configured key
 * in order, and if one is quota-exhausted (429) or rejected, move to the next.
 * The original error is rethrown only when every key has failed.
 */
export async function geminiGenerate(params: GenParams): Promise<GenResult> {
  const list = getClients();
  let lastErr: unknown;
  for (let i = 0; i < list.length; i++) {
    try {
      return await list[i].models.generateContent(params);
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
