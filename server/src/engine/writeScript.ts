import { Type } from '@google/genai';
import { ENGINE } from '../config/engine';
import { geminiGenerate } from './gemini';

export interface ScriptTurn {
  speaker: 'A' | 'B';
  text: string;
}

export interface Script {
  title: string;
  summary: string;
  /** Generated first names for the two hosts (A = male voice, B = female voice). */
  hosts: { A: string; B: string };
  turns: ScriptTurn[];
}

/**
 * Strip markdown the model sometimes emits despite being told not to, so the
 * TTS doesn't read "**" / "*" aloud and the transcript stays clean. Unwraps
 * emphasis/code/links to their inner text, then drops any stray markers.
 */
function stripMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
    .replace(/__([^_]+)__/g, '$1') // __bold__
    .replace(/\*([^*]+)\*/g, '$1') // *italic*
    .replace(/_([^_]+)_/g, '$1') // _italic_
    .replace(/`([^`]+)`/g, '$1') // `code`
    .replace(/~~([^~]+)~~/g, '$1') // ~~strike~~
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // # headings
    .replace(/[*_`~]/g, '') // any leftover/unmatched markers
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Stage 2 — turn the brief into a lively two-host conversation as JSON. This
 * prompt is the highest-leverage quality lever in the whole product (guide §7);
 * change it carefully.
 */
export async function writeScript(brief: string, minutes = ENGINE.minutes): Promise<Script> {
  const [a, b] = ENGINE.hosts;
  const words = minutes * 150;

  const prompt = `You are the head writer for a daily news podcast with two hosts. Speaker "A" has a warm male voice; speaker "B" has a bright female voice. FIRST invent a natural first name for each host — a male first name for A and a female first name for B. Then turn the brief below into a natural, lively spoken conversation of about ${minutes} minutes (~${words} words).

STYLE
- Two hosts who clearly know each other. A tends to tee up topics; B adds analysis, color, the occasional skeptical take.
- THIS IS A PERSONALIZED, ONE-LISTENER PODCAST. Speak to a SINGLE person as "you" throughout. NEVER address a crowd — no "everyone", "everybody", "you all", "you guys", "folks", "listeners", "all of you", or "welcome back everyone". Greet one individual (e.g. "Hey — welcome to your daily digest").
- OPEN WITH A GREETING: the hosts warmly welcome the listener to their personal daily digest and introduce themselves by their first names, then hook into today's topics. Do not read the date.
- Cover the 3-4 most interesting items from the brief. Use the concrete facts and numbers, react to them, ask each other real questions, occasionally disagree or crack a dry joke.
- Have them address each other by first name naturally now and then, the way real co-hosts do.
- Close with a quick, human sign-off (to the one listener, e.g. "that's your digest — talk tomorrow").

SPEAKING RULES (this is read aloud by text-to-speech)
- Conversational: contractions, short sentences. No markdown, no stage directions, no sound-effect notes.
- Do NOT prefix lines with the speaker's own name as a label; names appear only inside natural speech.
- Spell things the way they are said aloud (e.g. "twenty twenty-six", "three point five percent").
- Alternate speakers naturally — not strictly every line. Each turn is 1 to 4 sentences.

RETURN JSON
- hosts: { "A": "<male first name>", "B": "<female first name>" }.
- title: a punchy episode title, max 70 characters, no date.
- summary: one sentence describing the episode, max 160 characters.
- turns: array of { speaker: "A" | "B", text }.

BRIEF:
${brief}`;

  const res = await geminiGenerate({
    model: ENGINE.textModel,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hosts: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
            },
            required: ['A', 'B'],
          },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          turns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING, enum: ['A', 'B'] },
                text: { type: Type.STRING },
              },
              required: ['speaker', 'text'],
            },
          },
        },
        required: ['hosts', 'title', 'summary', 'turns'],
      },
      temperature: 0.9,
    },
  });

  const raw = res.text?.trim();
  if (!raw) throw new Error('writeScript: empty response from Gemini');

  let parsed: Script;
  try {
    parsed = JSON.parse(raw) as Script;
  } catch {
    throw new Error('writeScript: response was not valid JSON');
  }

  const turns = (parsed.turns ?? [])
    .filter((t) => (t.speaker === 'A' || t.speaker === 'B') && t.text?.trim())
    .map((t) => ({ speaker: t.speaker, text: stripMarkdown(t.text) }))
    .filter((t) => t.text);
  if (!turns.length) throw new Error('writeScript: script had no usable turns');

  return {
    title: stripMarkdown(parsed.title ?? '') || 'Your daily digest',
    summary: stripMarkdown(parsed.summary ?? ''),
    // Fall back to the configured host names if the model omitted them.
    hosts: {
      A: parsed.hosts?.A?.trim() || a.name,
      B: parsed.hosts?.B?.trim() || b.name,
    },
    turns,
  };
}
