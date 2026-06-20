import { ENGINE } from '../config/engine';
import { genai } from './gemini';

/**
 * Stage 1 — pull fresh, factual material on a topic using Gemini with Google
 * Search grounding. Returns a tight bullet brief the script stage turns into
 * dialogue. (Grounding can't be combined with JSON output, so this is its own
 * call and returns plain text.)
 */
export async function fetchBrief(topic: string): Promise<string> {
  const ai = genai();
  const prompt = `You are a sharp news researcher. Using up-to-date web results, write a tight factual brief on the most important and genuinely interesting recent developments about: ${topic}.

- 6 to 10 concise bullet points.
- Each bullet is a concrete fact: an event, number, quote, or decision, with just enough context to understand why it matters.
- Strongly prefer the last 3 days. Include specifics — names, figures, dates, places.
- No introduction, no conclusion, no headings. Bullet points only.`;

  const res = await ai.models.generateContent({
    model: ENGINE.textModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
    },
  });

  const text = res.text?.trim();
  if (!text) throw new Error('fetchBrief: empty response from Gemini');
  return text;
}
