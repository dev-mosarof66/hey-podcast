import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

let client: GoogleGenAI | null = null;

/** Lazily-created Gemini client. Throws if the key is missing. */
export function genai(): GoogleGenAI {
  if (!env.geminiApiKey) throw new Error('GEMINI_API_KEY is not set');
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}
